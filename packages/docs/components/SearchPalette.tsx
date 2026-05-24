import { useEffect, useRef, useState, type CSSProperties, JSX } from 'react'
import { searchPages, defaultResults, type SearchResult } from '../lib/pagefind-search'
import { useMediaQuery } from '../lib/use-media-query'

interface SearchPaletteProps {
  open: boolean
  onClose: () => void
  query: string
}

const PAL_MAX_W = 860
const PAL_GUTTER = 24
const PAL_INSET = `max(${PAL_GUTTER}px, calc((100vw - ${PAL_MAX_W}px) / 2))`

/** Same easeOutExpo curve as the search-field expand, so the panel
 *  unfurl and the input widening feel like one motion. */
const PAL_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const PAL_MS = 280

export function SearchPalette({ open, onClose, query }: SearchPaletteProps) {
  const [active, setActive] = useState(0)
  const [splitPx, setSplitPx] = useState<number>(() => {
    if (typeof window === 'undefined') return 360
    const stored = Number(localStorage.getItem('palette-split'))
    return Number.isFinite(stored) && stored > 0 ? stored : 360
  })
  const draggingRef = useRef(false)
  const [gripY, setGripY] = useState<number | null>(null)
  // Two separate breakpoints:
  // - `isNarrowInset` (<768px): tuck the panel at 12/12 instead of the
  //   240/240 desktop inset. Matches the topbar's `isMobile` so the
  //   open search input (12/12 fixed) and the panel below it stay
  //   edge-aligned. Above 768, panel anchors to the content column.
  // - `isSingleCol` (<640px): collapse the palette body to one column
  //   and drop the preview pane — at that width the preview is too
  //   cramped to be useful.
  const isNarrowInset = useMediaQuery('(max-width: 767px)')
  const isSingleCol = useMediaQuery('(max-width: 639px)')

  const [hits, setHits] = useState<SearchResult[]>(defaultResults)
  const prevQueryRef = useRef('')
  const prevOrderRef = useRef<string[]>([])

  useEffect(() => {
    let cancelled = false
    searchPages(query).then(results => {
      if (cancelled) return

      const prevQ = prevQueryRef.current
      const isExtending = query.length > prevQ.length
        && query.toLowerCase().startsWith(prevQ.toLowerCase())
        && prevQ.length > 0

      if (isExtending && prevOrderRef.current.length > 0) {
        const resultMap = new Map(results.map(r => [r.path, r]))

        const stable: SearchResult[] = []
        for (const path of prevOrderRef.current) {
          const r = resultMap.get(path)
          if (r) {
            stable.push(r)
            resultMap.delete(path)
          }
        }

        const fresh = [...resultMap.values()].sort((a, b) => b.score - a.score)
        for (const r of fresh) {
          const insertIdx = stable.findIndex(s => r.score > s.score)
          if (insertIdx >= 0) stable.splice(insertIdx, 0, r)
          else stable.push(r)
        }

        prevOrderRef.current = stable.map(r => r.path)
        prevQueryRef.current = query
        setHits(stable)
      } else {
        prevOrderRef.current = results.map(r => r.path)
        prevQueryRef.current = query
        setHits(results)
      }
    })
    return () => { cancelled = true }
  }, [query])

  const previewBodyRef = useRef<HTMLDivElement>(null)
  const [pageHtml, setPageHtml] = useState<string>('')
  const pageCacheRef = useRef<Map<string, string>>(new Map())

  const activePath = hits[active]?.path
  useEffect(() => {
    if (!activePath || isSingleCol || query.trim()) {
      setPageHtml('')
      return
    }

    const cached = pageCacheRef.current.get(activePath)
    if (cached !== undefined) {
      setPageHtml(cached)
      return
    }

    setPageHtml('')
    let cancelled = false
    fetch(activePath)
      .then(r => (r.ok ? r.text() : ''))
      .then(html => {
        if (cancelled) return
        const doc = new DOMParser().parseFromString(html, 'text/html')
        const main = doc.querySelector('[data-pagefind-body]')
        main?.querySelectorAll('[data-pagefind-ignore], script, style').forEach(el => el.remove())
        const h1 = main?.querySelector('h1')
        h1?.remove()
        main?.querySelectorAll('h2, h3').forEach(el => {
          el.removeAttribute('style')
          el.removeAttribute('class')
        })
        const content = main?.innerHTML ?? ''
        pageCacheRef.current.set(activePath, content)
        setPageHtml(content)
      })
      .catch(() => {
        if (!cancelled) setPageHtml('')
      })

    return () => { cancelled = true }
  }, [active, activePath, isSingleCol])

  useEffect(() => {
    if (!open) return
    setActive(0)
  }, [open])

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    const el = previewBodyRef.current
    if (!el) return
    requestAnimationFrame(() => {
      const mark = el.querySelector('mark')
      if (mark) mark.scrollIntoView({ block: 'center', behavior: 'instant' })
      else el.scrollTop = 0
    })
  }, [activePath, query])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive(a => Math.min(a + 1, Math.max(hits.length - 1, 0)))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive(a => Math.max(a - 1, 0))
      } else if (e.key === 'Enter') {
        const hit = hits[active]
        if (hit) window.location.href = hit.path
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, hits, active])

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!draggingRef.current) return
      const dlg = document.querySelector('[data-palette-panel]') as HTMLElement | null
      if (!dlg) return
      const rect = dlg.getBoundingClientRect()
      const x = Math.max(200, Math.min(e.clientX - rect.left, rect.width - 200))
      setSplitPx(x)
      setGripY(Math.max(0, Math.min(e.clientY - rect.top, rect.height)))
    }
    function onUp() {
      if (draggingRef.current) {
        draggingRef.current = false
        setGripY(null)
        localStorage.setItem('palette-split', String(splitPx))
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [splitPx])

  // `mounted` keeps the DOM around during exit animation; `visible` drives
  // the actual entry/exit styles. On open: mount in the entry state
  // (opacity 0, translated up, height 0), then flip `visible` true after
  // one paint so CSS transitions kick in. On close: flip `visible` false
  // immediately, then unmount once the exit anim finishes.
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (open) {
      setMounted(true)
      let raf2 = 0
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true))
      })
      return () => {
        cancelAnimationFrame(raf1)
        if (raf2) cancelAnimationFrame(raf2)
      }
    }
    setVisible(false)
    const t = window.setTimeout(() => setMounted(false), PAL_MS + 40)
    return () => window.clearTimeout(t)
  }, [open])

  if (!mounted) return null

  const previewHit = hits[active]

  function highlight(text: string, q: string): (string | JSX.Element)[] | string {
    if (!q) return text
    const lc = text.toLowerCase()
    const lq = q.toLowerCase()
    const out: (string | JSX.Element)[] = []
    let from = 0
    let key = 0
    while (true) {
      const idx = lc.indexOf(lq, from)
      if (idx < 0) {
        out.push(text.slice(from))
        break
      }
      if (idx > from) out.push(text.slice(from, idx))
      out.push(
        <mark
          key={`m${key++}`}
          style={{
            background: 'color-mix(in srgb, var(--color-doc-template-accent) 18%, transparent)',
            color: 'var(--color-doc-template-ink)',
            opacity: 1,
            fontWeight: 600,
            borderRadius: 2,
            padding: '0 1px',
          }}
        >
          {text.slice(idx, idx + q.length)}
        </mark>,
      )
      from = idx + q.length
    }
    return out
  }

  function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  function highlightHtml(html: string, q: string): string {
    if (!q.trim()) return html
    const ql = q.trim().toLowerCase()
    return html.split(/(<[^>]*>)/g).map((part, i) => {
      if (i % 2 === 1) return part
      const lc = part.toLowerCase()
      if (!lc.includes(ql)) return part
      let result = ''
      let last = 0
      while (true) {
        const idx = lc.indexOf(ql, last)
        if (idx < 0) break
        result += part.slice(last, idx)
        result += `<mark>${part.slice(idx, idx + q.trim().length)}</mark>`
        last = idx + q.trim().length
      }
      return result + part.slice(last)
    }).join('')
  }

  const backdropStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 40,
    background: 'color-mix(in srgb, #000 28%, transparent)',
    backdropFilter: 'blur(6px) saturate(105%)',
    WebkitBackdropFilter: 'blur(6px) saturate(105%)',
    opacity: visible ? 1 : 0,
    pointerEvents: visible ? 'auto' : 'none',
    transition: `opacity ${PAL_MS}ms ease`,
  }

  const panelStyle: CSSProperties = {
    position: 'fixed',
    top: 40,
    left: isNarrowInset ? 12 : PAL_INSET,
    right: isNarrowInset ? 12 : PAL_INSET,
    zIndex: 49,
    background: 'var(--color-doc-template-bg)',
    border: '1px solid var(--color-doc-template-faint)',
    borderRadius: 16,
    boxShadow: '0 24px 60px rgb(0 0 0 / 0.18), 0 6px 18px rgb(0 0 0 / 0.06)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    opacity: visible ? 1 : 0,
    pointerEvents: visible ? 'auto' : 'none',
    transform: visible ? 'translateY(0)' : 'translateY(-8px)',
    maxHeight: visible ? 'min(70vh, 540px)' : 0,
    transformOrigin: 'top center',
    transition: `opacity ${PAL_MS}ms ${PAL_EASE}, transform ${PAL_MS}ms ${PAL_EASE}, max-height ${PAL_MS}ms ${PAL_EASE}`,
  }

  return (
    <>
      {/* Backdrop closes the palette on click; the query state lives in
          the Layout and is preserved, so re-opening shows the previous
          query. Esc still works as the keyboard escape route. */}
      <div style={backdropStyle} onClick={onClose} />
      <div data-palette-panel role="dialog" aria-modal="true" aria-label="Search" style={panelStyle}>
        <div
          className="grid flex-1"
          style={{
            gridTemplateColumns: isSingleCol ? '1fr' : `${splitPx}px 1fr`,
            minHeight: 0,
            position: 'relative',
          }}
        >
          <ul
            className="m-0 overflow-y-auto list-none select-none"
            style={{
              padding: 6,
              borderRight: isSingleCol ? '0' : '1px solid var(--color-doc-template-faint)',
              background: 'color-mix(in srgb, var(--color-doc-template-panel) 35%, var(--color-doc-template-bg))',
            }}
          >
            {hits.length === 0 && (
              <li className="text-doc-template-muted" style={{ padding: '8px 10px', fontSize: 13 }}>
                No matches.
              </li>
            )}
            {hits.map((hit, i) => (
              <li
                key={hit.path}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  window.location.href = hit.path
                }}
                className={
                  i === active
                    ? 'flex items-center gap-2.5 cursor-pointer bg-doc-template-selected text-doc-template-ink'
                    : 'flex items-center gap-2.5 cursor-pointer text-doc-template-ink'
                }
                style={{
                  padding: '4px 10px',
                  borderRadius: 10,
                  fontFamily: 'var(--font-doc-template-ui)',
                  fontSize: 13,
                  transition: 'background 0.1s ease',
                }}
              >
                <span
                  className={
                    i === active
                      ? 'inline-flex items-center justify-center text-doc-template-accent shrink-0'
                      : 'inline-flex items-center justify-center text-doc-template-muted shrink-0'
                  }
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 5,
                    background:
                      i === active
                        ? 'var(--color-doc-template-accent-soft)'
                        : 'var(--color-doc-template-chip)',
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                    style={{ width: 13, height: 13 }}
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </span>
                <span className="flex flex-col min-w-0 flex-1" style={{ gap: isSingleCol ? 1 : 2 }}>
                  {isSingleCol ? (
                    <>
                      <span
                        className="text-doc-template-ink"
                        style={{
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {hit.section && (
                          <span
                            className="text-doc-template-muted uppercase"
                            style={{
                              fontFamily: 'var(--font-doc-template-mono)',
                              fontSize: 9.5,
                              fontWeight: 500,
                              letterSpacing: '0.04em',
                            }}
                          >
                            {hit.section}
                            <span style={{ margin: '0 3px', opacity: 0.5 }}>/</span>
                          </span>
                        )}
                        {highlight(hit.title, query)}
                      </span>
                      {hit.snippet && (
                        <span
                          style={{
                            fontFamily: 'var(--font-doc-template-ui)',
                            fontSize: 12,
                            lineHeight: 1.45,
                            color: 'color-mix(in srgb, var(--color-doc-template-ink) 55%, transparent)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {highlight(hit.snippet, query)}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span
                        className="text-doc-template-ink"
                        style={{
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {highlight(hit.title, query)}
                      </span>
                      {hit.section && (
                        <span
                          className="text-doc-template-muted uppercase"
                          style={{
                            fontFamily: 'var(--font-doc-template-mono)',
                            fontSize: 9.5,
                            fontWeight: 500,
                            letterSpacing: '0.04em',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {hit.section}
                        </span>
                      )}
                      {query.trim() && (hit.excerptHtml || hit.snippet) && (
                        <span
                          className="pagefind-excerpt"
                          style={{
                            fontFamily: 'var(--font-doc-template-ui)',
                            fontSize: 11.5,
                            lineHeight: 1.4,
                            color: 'color-mix(in srgb, var(--color-doc-template-ink) 55%, transparent)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                          {...(hit.excerptHtml
                            ? { dangerouslySetInnerHTML: { __html: hit.excerptHtml } }
                            : { children: highlight(hit.snippet, query) })}
                        />
                      )}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {!isSingleCol && (
            <div
              aria-hidden
              onMouseDown={(e) => {
                draggingRef.current = true
                const dlg = e.currentTarget.closest('[data-palette-panel]')
                if (dlg) {
                  const rect = dlg.getBoundingClientRect()
                  setGripY(Math.max(0, Math.min(e.clientY - rect.top, rect.height)))
                }
              }}
              onDoubleClick={() => {
                setSplitPx(360)
                localStorage.setItem('palette-split', '360')
              }}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `calc(${splitPx}px - 4px)`,
                width: 8,
                cursor: 'col-resize',
                zIndex: 2,
              }}
            >
              {gripY != null && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: gripY,
                    transform: 'translate(-50%, -50%)',
                    width: 3,
                    height: 28,
                    borderRadius: 2,
                    background: 'var(--color-doc-template-muted)',
                  }}
                />
              )}
            </div>
          )}
          {!isSingleCol && (
          <aside
            className="overflow-y-auto flex flex-col"
            style={{
              background: 'color-mix(in srgb, var(--color-doc-template-panel) 60%, transparent)',
              minHeight: 280,
            }}
          >
            {previewHit ? (
              <>
                <div style={{ padding: '14px 18px 0' }}>
                  <div
                    className="text-doc-template-muted uppercase"
                    style={{
                      fontFamily: 'var(--font-doc-template-mono)',
                      fontSize: 9.5,
                      fontWeight: 500,
                      letterSpacing: '0.05em',
                      marginBottom: 6,
                    }}
                  >
                    {previewHit.section || '—'}
                  </div>
                  <h3
                    className="text-doc-template-ink"
                    style={{
                      margin: '0 0 12px',
                      fontFamily: 'var(--font-doc-template-ui)',
                      fontSize: 16,
                      fontWeight: 600,
                      letterSpacing: '-0.012em',
                      lineHeight: 1.25,
                    }}
                  >
                    {highlight(previewHit.title, query)}
                  </h3>
                </div>
                {query.trim() && previewHit.subResults.length > 0 ? (
                  <div ref={previewBodyRef} className="flex-1 overflow-y-auto pagefind-excerpt" style={{ padding: '0 18px 14px' }}>
                    {previewHit.subResults.map((sr, idx) => {
                      const multi = previewHit.subResults.length > 1
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '10px 0',
                            borderTop: idx > 0 ? '1px solid var(--color-doc-template-faint)' : 'none',
                          }}
                        >
                          {sr.title && sr.title !== previewHit.title && (
                            <div
                              className="text-doc-template-muted"
                              style={{
                                fontFamily: 'var(--font-doc-template-mono)',
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: '0.02em',
                                marginBottom: 6,
                                opacity: 0.7,
                              }}
                            >
                              # {sr.title}
                            </div>
                          )}
                          <div
                            style={{
                              fontFamily: 'var(--font-doc-template-ui)',
                              fontSize: 12.5,
                              lineHeight: 1.6,
                              color: 'color-mix(in srgb, var(--color-doc-template-ink) 70%, transparent)',
                              ...(multi ? {
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 5,
                                WebkitBoxOrient: 'vertical',
                              } : {}),
                            }}
                            dangerouslySetInnerHTML={{ __html: sr.excerptHtml }}
                          />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div
                    ref={previewBodyRef}
                    className="flex-1 overflow-y-auto preview-body pagefind-excerpt"
                    style={{ padding: '0 18px 14px' }}
                    dangerouslySetInnerHTML={{
                      __html: pageHtml || escapeHtml(previewHit.description || ''),
                    }}
                  />
                )}
                <div
                  className="text-doc-template-muted"
                  style={{
                    fontFamily: 'var(--font-doc-template-mono)',
                    fontSize: 10,
                    fontWeight: 500,
                    padding: '10px 18px',
                    marginTop: 'auto',
                    opacity: 0.7,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {previewHit.path}
                </div>
              </>
            ) : (
              <p className="text-doc-template-muted" style={{ padding: '18px', fontSize: 13 }}>
                Select a result to preview.
              </p>
            )}
          </aside>
          )}
        </div>
        {/* Footer with keyboard hints (docs.html lines 1533-1538). */}
        <div
          className="flex items-center text-doc-template-muted"
          style={{
            gap: 14,
            padding: '9px 14px',
            borderTop: '1px solid var(--color-doc-template-faint)',
            fontFamily: 'var(--font-doc-template-mono)',
            fontSize: 10,
            fontWeight: 500,
            background: 'color-mix(in srgb, var(--color-doc-template-panel) 50%, transparent)',
          }}
        >
          <FootKey>
            <FootKbd>{'↑'}</FootKbd>
            <FootKbd>{'↓'}</FootKbd>
            <span>navigate</span>
          </FootKey>
          <FootKey>
            <FootKbd>{'↵'}</FootKbd>
            <span>open</span>
          </FootKey>
          <FootKey>
            <FootKbd>esc</FootKbd>
            <span>close</span>
          </FootKey>
          <span style={{ flex: 1 }} />
          <span style={{ opacity: 0.8 }}>Search · DocSite docs</span>
        </div>
      </div>
    </>
  )
}

function FootKey({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center" style={{ gap: 5 }}>
      {children}
    </span>
  )
}

function FootKbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      style={{
        fontFamily: 'var(--font-doc-template-mono)',
        fontSize: 9.5,
        background: 'var(--color-doc-template-bg)',
        border: '1px solid var(--color-doc-template-faint)',
        borderRadius: 3,
        padding: '1px 4px',
        color: 'var(--color-doc-template-ink)',
        minWidth: 14,
        textAlign: 'center',
      }}
    >
      {children}
    </kbd>
  )
}
