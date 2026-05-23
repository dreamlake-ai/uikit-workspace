import { useEffect, useMemo, useRef, useState } from 'react'
import { usePageContext } from 'vike-react/usePageContext'
import { pages } from '../lib/navigation'

const TOC_KEY_PREFIX = 'toc-collapsed:'

interface Heading {
  id: string
  text: string
  level: 2 | 3
  el: HTMLElement
}

interface RailPoint {
  id: string
  /** Cumulative arc-length along the rail at this row's center. */
  len: number
}

/**
 * Right-column table of contents — a faithful port of the dreamlake
 * docs.html implementation. Key invariants matching the design:
 *
 *  - Path is built once after layout / on resize. Anchor for each row is
 *    at `top + 4` (NOT mid-height) until the very last row, which lands
 *    on its true vertical center so the end-cap square sits naturally.
 *  - Indent change uses a small S-curve confined to a `BEND = 8`px window
 *    above the next row plus 2px below — short enough to read as a
 *    corner, smooth enough to read as organic.
 *  - Active stroke length tracks via a `segLen` React state (was a CSS
 *    custom property on the path; same effect, simpler in React).
 *  - Active dot follows the active stroke's leading edge via
 *    `path.getPointAtLength(currentLen)`.
 *  - End-cap square sits at the very tail of the path.
 *  - Active heading detection: last heading whose top ≤ ACTIVATE_LINE.
 */
const X0 = 4
const X_INDENT_H3 = 12
const BEND = 8
const ACTIVATE_LINE = 110
const TWEEN_MS = 600

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

/** rAF-driven smooth scroll. We do this manually instead of
 *  `window.scrollTo({behavior:'smooth'})` because the native smooth
 *  scroll gets cancelled by Chromium/Safari when sticky H2s above us
 *  transition between stuck and unstuck states during the animation
 *  — the page jumps a short distance and then halts. The manual loop
 *  is immune to that. A passive wheel/touch listener lets the user
 *  cancel the animation by scrolling themselves. */
function animateScrollTo(targetY: number) {
  const startY = window.scrollY
  const distance = targetY - startY
  if (Math.abs(distance) < 1) return
  // Duration scales gently with distance — short hops feel snappy,
  // page-spanning jumps still settle in well under a second.
  const duration = Math.min(700, Math.max(260, Math.abs(distance) * 0.35))
  const start = performance.now()
  let cancelled = false
  const cancel = () => {
    cancelled = true
  }
  window.addEventListener('wheel', cancel, { passive: true, once: true })
  window.addEventListener('touchstart', cancel, { passive: true, once: true })
  function step(now: number) {
    if (cancelled) return
    const t = Math.min(1, (now - start) / duration)
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    window.scrollTo(0, startY + distance * eased)
    if (t < 1) {
      requestAnimationFrame(step)
    } else {
      window.removeEventListener('wheel', cancel)
      window.removeEventListener('touchstart', cancel)
    }
  }
  requestAnimationFrame(step)
}

/** Scroll a TOC link's target to its `scroll-margin-top`. The target
 *  is either the H2 anchor span (data-toc-anchor) or the H3 itself —
 *  both non-sticky, so `getBoundingClientRect().top + scrollY` is a
 *  reliable natural-document-Y. */
function scrollToHeading(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  // Respect modifier-clicks (open in new tab / window) — let the
  // browser handle those natively.
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
  const target = document.getElementById(id)
  if (!target) return
  e.preventDefault()
  const cs = window.getComputedStyle(target)
  const marginTop = parseFloat(cs.scrollMarginTop) || 0
  const targetY = target.getBoundingClientRect().top + window.scrollY - marginTop
  animateScrollTo(targetY)
  history.replaceState(null, '', `#${id}`)
}

export function TOC() {
  const { urlPathname } = usePageContext() as { urlPathname: string }
  const [headings, setHeadings] = useState<Heading[]>([])
  const [endPos, setEndPos] = useState<{ x: number; y: number } | null>(null)
  const [pathD, setPathD] = useState('')

  const bodyRef = useRef<HTMLDivElement | null>(null)
  const railBaseRef = useRef<SVGPathElement | null>(null)
  const activeStrokeRef = useRef<SVGPathElement | null>(null)
  const dotRef = useRef<SVGCircleElement | null>(null)
  const gradientRef = useRef<SVGLinearGradientElement | null>(null)

  const railPointsRef = useRef<RailPoint[]>([])
  const totalLenRef = useRef<number>(0)
  const currentLenRef = useRef<number>(0)
  const currentStartRef = useRef<number>(0)
  const animFromRef = useRef<number>(0)
  const animToRef = useRef<number>(0)
  const startAnimFromRef = useRef<number>(0)
  const startAnimToRef = useRef<number>(0)
  const animStartRef = useRef<number>(0)
  const animReqRef = useRef<number | null>(null)

  // Mirror of activeId for use inside buildRail, which runs in a
  // requestAnimationFrame callback whose closure would otherwise capture
  // a stale value. On first load the scroll-spy sets activeId after the
  // buildRail effect's closure is created — without this ref the rail
  // would snap to 0 even though the first heading is the active one.
  const activeIdRef = useRef<string | null>(null)

  // --- Fold state: collapse H3 children under their parent H2 ---
  const [collapsedH2s, setCollapsedH2s] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      return new Set(JSON.parse(localStorage.getItem(TOC_KEY_PREFIX + urlPathname) || '[]'))
    } catch {
      return new Set()
    }
  })
  const [foldVersion, setFoldVersion] = useState(0)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(TOC_KEY_PREFIX + urlPathname) || '[]')
      setCollapsedH2s(new Set(stored))
    } catch {
      setCollapsedH2s(new Set())
    }
  }, [urlPathname])

  function toggleH2(id: string) {
    setCollapsedH2s(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem(TOC_KEY_PREFIX + urlPathname, JSON.stringify([...next]))
      return next
    })
    setFoldVersion(v => v + 1)
  }

  const h2HasChildren = useMemo(() => {
    const set = new Set<string>()
    let lastH2: string | null = null
    for (const h of headings) {
      if (h.level === 2) lastH2 = h.id
      else if (lastH2) set.add(lastH2)
    }
    return set
  }, [headings])

  const visibleHeadings = useMemo(() => {
    const result: Heading[] = []
    let lastH2Id: string | null = null
    for (const h of headings) {
      if (h.level === 2) {
        lastH2Id = h.id
        result.push(h)
      } else if (lastH2Id && !collapsedH2s.has(lastH2Id)) {
        result.push(h)
      }
    }
    return result
  }, [headings, collapsedH2s])

  // 1. Collect headings from main content. Re-runs on route change so
  // Vike's persistent Layout doesn't keep stale headings.
  useEffect(() => {
    const main = document.querySelector<HTMLElement>('main.doc-content')
    if (!main) {
      setHeadings([])
      return
    }
    // Per-page TOC depth. `tocLevel` in frontmatter is the knob; defaults
    // to 3 (H2 + H3). Setting 2 in frontmatter keeps the rail to H2 only
    // — used on long pages whose H3 count would otherwise crowd the rail.
    const current = pages.find(p => p.path === urlPathname)
    const tocLevel = current?.tocLevel ?? 3
    const selector =
      tocLevel >= 3 ? '[data-toc-anchor], h3[id]' : '[data-toc-anchor]'
    function collect() {
      // H2 ids live on a non-sticky `<span data-toc-anchor>` just before
      // the visible <h2>; H3 keeps its id directly. See the H2 component
      // in mdx-components.tsx for the rationale (sticky elements report
      // painted positions in getBoundingClientRect / offsetTop, which
      // breaks scroll-target math).
      const nodes = Array.from(
        main!.querySelectorAll<HTMLElement>(selector),
      )
      setHeadings(
        nodes.map(el => {
          const isAnchor = el.hasAttribute('data-toc-anchor')
          // For H2: text lives on the next sibling <h2>.
          // For H3: text lives on the element itself.
          const textSource = (isAnchor ? el.nextElementSibling : el) as HTMLElement | null
          return {
            id: el.id,
            text: textSource?.textContent?.replace(/#$/, '').trim() ?? '',
            level: (isAnchor ? 2 : 3) as 2 | 3,
            // `el` drives scroll-spy (rect.top vs ACTIVATE_LINE). Always
            // pick a non-sticky element: the anchor span for H2, the
            // h3 itself for H3 (h3 is not sticky).
            el,
          }
        }),
      )
    }
    collect()
    const mo = new MutationObserver(collect)
    mo.observe(main, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [urlPathname])

  // 2. Build the rail path + per-row arc-lengths.
  useEffect(() => {
    if (headings.length === 0 || !bodyRef.current) {
      railPointsRef.current = []
      totalLenRef.current = 0
      currentLenRef.current = 0
      animFromRef.current = 0
      animToRef.current = 0
      setPathD('')
      setEndPos(null)
      applyRailDOM(0, 0)
      return
    }

    function buildRail() {
      const body = bodyRef.current
      const base = railBaseRef.current
      if (!body || !base) return

      const links = Array.from(body.querySelectorAll<HTMLAnchorElement>('ul[data-toc-list] a'))
      if (links.length === 0) return
      const bodyRect = body.getBoundingClientRect()

      const rows = links.map(a => {
        const li = a.parentElement!
        const r = a.getBoundingClientRect()
        const indent = li.dataset.level === '3' ? X_INDENT_H3 : 0
        return {
          id: a.getAttribute('href')!.slice(1),
          top: r.top - bodyRect.top,
          h: r.height,
          indent,
        }
      })

      let d = ''
      const startY = rows[0].top + 4
      const startX = X0 + rows[0].indent
      d += `M ${startX} ${startY}`

      for (let i = 1; i < rows.length; i++) {
        const prev = rows[i - 1]
        const cur = rows[i]
        const prevX = X0 + prev.indent
        const curX = X0 + cur.indent
        const midY = cur.top + 4
        if (prevX === curX) {
          d += ` L ${curX} ${midY}`
        } else {
          const bendStart = midY - BEND
          const bendEnd = midY + 2
          d += ` L ${prevX} ${bendStart}`
          d += ` C ${prevX} ${bendStart + BEND * 0.6}, ${curX} ${bendStart + BEND * 0.4}, ${curX} ${bendEnd}`
        }
      }

      const lastRow = rows[rows.length - 1]
      const endY = lastRow.top + lastRow.h / 2
      d += ` L ${X0 + lastRow.indent} ${endY}`

      setPathD(d)
      // The ref's d attribute needs to be set before getTotalLength works.
      base.setAttribute('d', d)

      const pathLen = base.getTotalLength()
      totalLenRef.current = pathLen

      const endPt = base.getPointAtLength(pathLen)
      setEndPos({ x: endPt.x, y: endPt.y })

      railPointsRef.current = rows.map(row => {
        const midY = row.top + row.h / 2
        let lo = 0
        let hi = pathLen
        for (let k = 0; k < 18; k++) {
          const mid = (lo + hi) / 2
          const p = base.getPointAtLength(mid)
          if (p.y < midY) lo = mid
          else hi = mid
        }
        return { id: row.id, len: (lo + hi) / 2 }
      })

      // Snap stroke length to the current active heading's arc-length
      // (no animation on rebuild). Read activeId via ref so we pick up
      // the value the scroll-spy set after this effect was created.
      const ai = activeIdRef.current
      if (ai) {
        const match = railPointsRef.current.find(p => p.id === ai)
        if (match) {
          snap(match.len, findParentH2Len(ai))
        }
      } else {
        snap(0, 0)
      }
    }

    function findParentH2Len(id: string): number {
      let parentH2Id: string | null = null
      for (const h of visibleHeadings) {
        if (h.level === 2) parentH2Id = h.id
        if (h.id === id) break
      }
      if (!parentH2Id) return 0
      const pt = railPointsRef.current.find(p => p.id === parentH2Id)
      return pt ? pt.len : 0
    }

    function snap(len: number, start: number) {
      currentLenRef.current = len
      currentStartRef.current = start
      animFromRef.current = len
      animToRef.current = len
      startAnimFromRef.current = start
      startAnimToRef.current = start
      applyRailDOM(start, len)
    }

    const raf = requestAnimationFrame(buildRail)
    const onResize = () => buildRail()
    window.addEventListener('resize', onResize)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => buildRail())
    }
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headings, foldVersion])

  // 3. Scroll-spy: runs against ALL headings to detect the true active
  // heading. If the active heading is an H3 under a collapsed H2, auto-
  // expand that H2. The displayed activeId is then set to the visible
  // heading (which now includes the newly-expanded H3s).
  useEffect(() => {
    if (headings.length === 0) return
    let scheduled = false
    function pick() {
      scheduled = false
      let id: string | null = headings[0].id
      for (let i = 0; i < headings.length; i++) {
        const top = headings[i].el.getBoundingClientRect().top
        if (top - ACTIVATE_LINE <= 0.5) id = headings[i].id
        else break
      }
      if (id) {
        const h = headings.find(h => h.id === id)
        if (h && h.level === 3) {
          let parentH2: string | null = null
          for (const hh of headings) {
            if (hh.level === 2) parentH2 = hh.id
            if (hh.id === id) break
          }
          if (parentH2 && collapsedH2s.has(parentH2)) {
            setCollapsedH2s(prev => {
              const next = new Set(prev)
              next.delete(parentH2!)
              localStorage.setItem(TOC_KEY_PREFIX + urlPathname, JSON.stringify([...next]))
              return next
            })
            setFoldVersion(v => v + 1)
          }
        }
      }
      // Toggle highlight + start tween in the same frame.
      const body = bodyRef.current
      if (body) {
        const prev = body.querySelector<HTMLElement>('a[aria-current="location"]')
        if (prev) prev.removeAttribute('aria-current')
        if (id) {
          const next = body.querySelector<HTMLElement>(`a[href="#${CSS.escape(id)}"]`)
          if (next) next.setAttribute('aria-current', 'location')
        }
      }
      if (id !== activeIdRef.current) {
        activeIdRef.current = id
        tweenToActiveId(id)
      }
    }
    function onScroll() {
      if (scheduled) return
      scheduled = true
      requestAnimationFrame(pick)
    }
    pick()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [headings, collapsedH2s])

  // 3b. Scroll the active TOC entry into view only when a section unfolds.
  useEffect(() => {
    if (!foldVersion || !activeIdRef.current || !bodyRef.current) return
    const link = bodyRef.current.querySelector<HTMLElement>(`a[href="#${CSS.escape(activeIdRef.current)}"]`)
    if (link) link.scrollIntoView({ block: 'nearest', behavior: 'auto' })
  }, [foldVersion])

  // Direct DOM write for the rail accent stroke + dot — no React state.
  function applyRailDOM(start: number, len: number) {
    const base = railBaseRef.current
    const stroke = activeStrokeRef.current
    const dot = dotRef.current
    const grad = gradientRef.current
    currentStartRef.current = start
    currentLenRef.current = len
    if (stroke) {
      const dashLen = Math.max(0, len - start)
      stroke.style.strokeDasharray = `${dashLen} 99999`
      stroke.style.strokeDashoffset = `${-start}`
    }
    if (base && dot) {
      if (len > 0) {
        const p = base.getPointAtLength(Math.max(0, len))
        dot.setAttribute('cx', String(p.x))
        dot.setAttribute('cy', String(p.y))
        dot.style.opacity = '1'
      } else {
        dot.style.opacity = '0'
      }
    }
    if (base && grad && len > start) {
      const startPt = base.getPointAtLength(Math.max(0, start))
      const endPt = base.getPointAtLength(Math.max(0, len))
      const ah = visibleHeadings.find(h => h.id === activeIdRef.current)
      const isH3 = ah && ah.level === 3
      const fadeLen = isH3
        ? Math.min(8, (endPt.y - startPt.y) * 0.12)
        : Math.min(40, (endPt.y - startPt.y) * 0.5)
      grad.setAttribute('y1', String(startPt.y))
      grad.setAttribute('y2', String(startPt.y + fadeLen))
    }
  }

  // 4. Tween engine — called directly from pick(), not via useEffect.
  function tweenTick(now: number) {
    const t = Math.min(1, (now - animStartRef.current) / TWEEN_MS)
    const k = easeOut(t)
    const s = startAnimFromRef.current + (startAnimToRef.current - startAnimFromRef.current) * k
    const v = animFromRef.current + (animToRef.current - animFromRef.current) * k
    applyRailDOM(s, v)
    if (t < 1) {
      animReqRef.current = requestAnimationFrame(tweenTick)
    } else {
      animReqRef.current = null
    }
  }

  function tweenTo(targetStart: number, targetLen: number) {
    animFromRef.current = currentLenRef.current
    animToRef.current = targetLen
    startAnimFromRef.current = currentStartRef.current
    startAnimToRef.current = targetStart
    animStartRef.current = performance.now()
    if (animReqRef.current === null) {
      animReqRef.current = requestAnimationFrame(tweenTick)
    }
  }

  function tweenToActiveId(id: string | null) {
    if (!id) { tweenTo(0, 0); return }
    const match = railPointsRef.current.find(p => p.id === id)
    if (!match) return

    const activeH = visibleHeadings.find(h => h.id === id)
    let anchorId: string | null = null
    if (activeH && activeH.level === 3) {
      for (const h of visibleHeadings) {
        if (h.level === 2) anchorId = h.id
        if (h.id === id) break
      }
    } else {
      let prev: string | null = null
      for (const h of visibleHeadings) {
        if (h.id === id) break
        if (h.level === 2) prev = h.id
      }
      anchorId = prev
    }
    const anchorPt = anchorId ? railPointsRef.current.find(p => p.id === anchorId) : null
    const startLen = anchorPt ? Math.max(0, anchorPt.len - 20) : 0
    tweenTo(startLen, match.len)
  }

  // Mirror dreamlake-ai's RightTOC: pages with no headings opt out
  // entirely — no empty "On this page" card. This also covers SSR /
  // first client render before the heading-collection effect has run,
  // so there is no flash of an empty TOC either.
  if (headings.length === 0) return null

  const tocAside = (
    <aside
      aria-label="On this page"
      className="hidden lg:block sticky overflow-y-auto"
      style={{ top: 40, height: 'calc(100vh - 40px)', padding: '32px 22px 32px 18px' }}
    >
      <div
        className="uppercase border-b border-doc-template-faint text-doc-template-muted"
        style={{
          fontFamily: 'var(--font-doc-template-mono)',
          fontSize: 9,
          fontWeight: 600,
          opacity: 0.7,
          letterSpacing: '0.14em',
          padding: '0 0 10px',
          marginBottom: 6,
        }}
      >
        On this page
      </div>
      <div ref={bodyRef} style={{ position: 'relative' }}>
          <svg
            aria-hidden
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: 28,
              height: '100%',
              pointerEvents: 'none',
              overflow: 'visible',
            }}
          >
            <defs>
              <linearGradient id="toc-rail-fade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="white" stopOpacity="0" />
                <stop offset="0.08" stopColor="white" stopOpacity="1" />
                <stop offset="1" stopColor="white" stopOpacity="1" />
              </linearGradient>
              <mask id="toc-rail-mask" maskUnits="userSpaceOnUse">
                <rect x="0" y="0" width="100%" height="100%" fill="url(#toc-rail-fade)" />
              </mask>
              <linearGradient ref={gradientRef} id="toc-accent-fade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="0">
                <stop offset="0" stopColor="var(--color-doc-template-accent)" stopOpacity="0" />
                <stop offset="1" stopColor="var(--color-doc-template-accent)" stopOpacity="1" />
              </linearGradient>
            </defs>
            <g mask="url(#toc-rail-mask)">
              <path
                ref={railBaseRef}
                d={pathD}
                style={{
                  stroke: 'var(--color-doc-template-rail-stroke)',
                  strokeWidth: 1.5,
                  fill: 'none',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                }}
              />
              <path
                ref={activeStrokeRef}
                d={pathD}
                style={{
                  stroke: 'url(#toc-accent-fade)',
                  strokeWidth: 2,
                  fill: 'none',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  strokeDasharray: '0 99999',
                  strokeDashoffset: 0,
                }}
              />
              {endPos && (
                <rect
                  x={endPos.x - 2.5}
                  y={endPos.y - 2.5}
                  width={5}
                  height={5}
                  style={{ fill: 'var(--color-doc-template-rail-stroke)' }}
                />
              )}
            </g>
            <circle
              ref={dotRef}
              cx={0}
              cy={0}
              r={3.5}
              style={{
                fill: 'var(--color-doc-template-accent)',
                opacity: 0,
              }}
            />
          </svg>

          <ul
            data-toc-list
            className="list-none m-0 p-0 flex flex-col"
            style={{ marginLeft: 14, gap: 1 }}
          >
            {visibleHeadings.map(h => {
              const hasFold = h.level === 2 && h2HasChildren.has(h.id)
              const isFolded = hasFold && collapsedH2s.has(h.id)
              return (
                <li
                  key={h.id}
                  data-level={h.level}
                  style={h.level === 3 ? { paddingLeft: 12 } : undefined}
                >
                  <a
                    href={`#${h.id}`}
                    onClick={e => scrollToHeading(e, h.id)}
                    data-level={h.level}
                    className="toc-link"
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>{h.text}</span>
                    {hasFold && (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={isFolded ? 'Expand' : 'Collapse'}
                        className="toc-fold-toggle"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); toggleH2(h.id) }}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleH2(h.id) } }}
                      >
                        <svg
                          width="8" height="8" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                          aria-hidden
                          style={{ transform: isFolded ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.15s ease' }}
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </span>
                    )}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      <div
        className="flex flex-col border-t border-doc-template-faint"
        style={{ marginTop: 18, paddingTop: 14, gap: 6 }}
      >
        <a
          href="#"
          onClick={e => e.preventDefault()}
          className="no-underline text-doc-template-muted hover:text-doc-template-ink uppercase"
          style={{
            padding: '4px 10px 4px 12px',
            fontFamily: 'var(--font-doc-template-mono)',
            fontSize: 10,
            fontWeight: 500,
            borderLeft: '2px solid transparent',
            marginLeft: -2,
            letterSpacing: '0.04em',
          }}
        >
          Edit this page
        </a>
        <a
          href="#"
          onClick={e => e.preventDefault()}
          className="no-underline text-doc-template-muted hover:text-doc-template-ink uppercase"
          style={{
            padding: '4px 10px 4px 12px',
            fontFamily: 'var(--font-doc-template-mono)',
            fontSize: 10,
            fontWeight: 500,
            borderLeft: '2px solid transparent',
            marginLeft: -2,
            letterSpacing: '0.04em',
          }}
        >
          Report an issue
        </a>
      </div>
    </aside>
  )

  return tocAside
}
