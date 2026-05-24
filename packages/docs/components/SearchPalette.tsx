import { useEffect, useMemo, useRef, useState, type CSSProperties, JSX } from 'react'
import { searchIndex, search, type SearchHit } from '../lib/search-index'
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
  const [panelH, setPanelH] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = JSON.parse(localStorage.getItem('palette-h') ?? '')
      if (Date.now() - raw.ts > 86_400_000) { localStorage.removeItem('palette-h'); return null }
      return Number.isFinite(raw.v) && raw.v > 0 ? raw.v : null
    } catch { return null }
  })
  const [isResizing, setIsResizing] = useState(false)
  const resizeEdgeRef = useRef<'bottom' | 'corner' | null>(null)
  const resizeOriginRef = useRef({ x: 0, y: 0, w: 0, h: 0 })
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

  const hits = useMemo<SearchHit[]>(() => {
    if (!query.trim()) {
      return searchIndex.slice(0, 12).map(entry => ({
        entry,
        score: 0,
        snippet: entry.description ?? '',
      }))
    }
    return search(query, 30)
  }, [query])

  useEffect(() => {
    if (!open) return
    setActive(0)
  }, [open])

  useEffect(() => setActive(0), [query])

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
        if (hit) window.location.href = hit.entry.path
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

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!resizeEdgeRef.current) return
      const dx = e.clientX - resizeOriginRef.current.x
      const dy = e.clientY - resizeOriginRef.current.y
      if (resizeEdgeRef.current === 'bottom' || resizeEdgeRef.current === 'corner') {
        setPanelH(Math.max(200, Math.min(resizeOriginRef.current.h + dy, window.innerHeight - 60)))
      }
    }
    function onUp() {
      if (resizeEdgeRef.current) {
        resizeEdgeRef.current = null
        setIsResizing(false)
        document.body.style.userSelect = ''
        if (panelH != null) localStorage.setItem('palette-h', JSON.stringify({ v: panelH, ts: Date.now() }))
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [panelH])

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

  const maxVh = typeof window !== 'undefined' ? window.innerHeight * 0.7 : 540
  const effectiveH = panelH ?? (() => {
    const rowH = Math.max(hits.length, 1) * 48 + 44
    const totalChars = hits.reduce((sum, h) => sum + h.title.length + (h.snippet?.length || 0) + (h.description?.length || 0), 0)
    const charH = 120 + Math.min(totalChars * 0.3, 420)
    return Math.max(250, Math.min(Math.max(rowH, charH), maxVh, 540))
  })()

  function startResize(edge: 'bottom' | 'corner', e: React.MouseEvent) {
    const panel = (e.currentTarget as HTMLElement).closest('[data-palette-panel]') as HTMLElement
    if (!panel) return
    const rect = panel.getBoundingClientRect()
    resizeEdgeRef.current = edge
    resizeOriginRef.current = { x: e.clientX, y: e.clientY, w: rect.width, h: rect.height }
    setIsResizing(true)
    document.body.style.userSelect = 'none'
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
    ...(panelH != null ? { height: visible ? panelH : 0 } : {}),
    maxHeight: visible ? effectiveH : 0,
    transformOrigin: 'top center',
    transition: isResizing
      ? 'none'
      : `opacity ${PAL_MS}ms ${PAL_EASE}, transform ${PAL_MS}ms ${PAL_EASE}, max-height ${PAL_MS}ms ${PAL_EASE}${panelH != null ? `, height ${PAL_MS}ms ${PAL_EASE}` : ''}`,
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
                key={hit.entry.path}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  window.location.href = hit.entry.path
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
                        {hit.entry.section && (
                          <span
                            className="text-doc-template-muted uppercase"
                            style={{
                              fontFamily: 'var(--font-doc-template-mono)',
                              fontSize: 9.5,
                              fontWeight: 500,
                              letterSpacing: '0.04em',
                            }}
                          >
                            {hit.entry.section}
                            <span style={{ margin: '0 3px', opacity: 0.5 }}>/</span>
                          </span>
                        )}
                        {highlight(hit.entry.title, query)}
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
                        {highlight(hit.entry.title, query)}
                      </span>
                      {hit.entry.section && (
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
                          {hit.entry.section}
                        </span>
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
            className="overflow-y-auto"
            style={{
              padding: '18px 18px 14px',
              background: 'color-mix(in srgb, var(--color-doc-template-panel) 60%, transparent)',
              minHeight: 280,
            }}
          >
            {previewHit ? (
              <>
                <div
                  className="text-doc-template-muted uppercase"
                  style={{
                    fontFamily: 'var(--font-doc-template-mono)',
                    fontSize: 9.5,
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                    marginBottom: 10,
                  }}
                >
                  {previewHit.entry.section || '—'}
                </div>
                <h3
                  className="text-doc-template-ink"
                  style={{
                    margin: '0 0 8px',
                    fontFamily: 'var(--font-doc-template-ui)',
                    fontSize: 16,
                    fontWeight: 600,
                    letterSpacing: '-0.012em',
                    lineHeight: 1.25,
                  }}
                >
                  {highlight(previewHit.entry.title, query)}
                </h3>
                {previewHit.snippet && (
                  <p
                    className="text-doc-template-muted"
                    style={{
                      fontFamily: 'var(--font-doc-template-ui)',
                      fontSize: 12.5,
                      lineHeight: 1.55,
                      margin: '0 0 14px',
                    }}
                  >
                    {highlight(previewHit.snippet, query)}
                  </p>
                )}
                <div
                  className="text-doc-template-muted"
                  style={{
                    fontFamily: 'var(--font-doc-template-mono)',
                    fontSize: 10,
                    fontWeight: 500,
                    borderTop: '1px dashed var(--color-doc-template-faint)',
                    paddingTop: 10,
                    marginTop: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%', opacity: 0.8 }}>
                    {previewHit.entry.path}
                  </span>
                  <span>
                    Press{' '}
                    <kbd
                      style={{
                        fontFamily: 'var(--font-doc-template-mono)',
                        fontSize: 9.5,
                        background: 'var(--color-doc-template-bg)',
                        border: '1px solid var(--color-doc-template-faint)',
                        borderRadius: 3,
                        padding: '1px 4px',
                        margin: '0 2px',
                        color: 'var(--color-doc-template-ink)',
                      }}
                    >
                      ↵
                    </kbd>{' '}
                    to open
                  </span>
                </div>
              </>
            ) : (
              <p className="text-doc-template-muted" style={{ fontSize: 13 }}>
                Select a result to preview.
              </p>
            )}
          </aside>
          )}
        </div>
        {/* Footer with keyboard hints (docs.html lines 1533–1538). */}
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
            <FootKbd>↑</FootKbd>
            <FootKbd>↓</FootKbd>
            <span>navigate</span>
          </FootKey>
          <FootKey>
            <FootKbd>↵</FootKbd>
            <span>open</span>
          </FootKey>
          <FootKey>
            <FootKbd>esc</FootKbd>
            <span>close</span>
          </FootKey>
          <span style={{ flex: 1 }} />
          <span style={{ opacity: 0.8 }}>Search · DocSite docs</span>
        </div>
        {!isNarrowInset && (
          <>
            <style>{`
              .palette-resize .palette-resize-pill {
                opacity: 0;
                transition: opacity 0.15s ease;
              }
              .palette-resize:hover .palette-resize-pill {
                opacity: 0.45;
              }
            `}</style>
            <div
              className="palette-resize"
              onMouseDown={(e) => startResize('bottom', e)}
              onDoubleClick={() => { setPanelH(null); localStorage.removeItem('palette-h') }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 32,
                right: 32,
                height: 10,
                cursor: 'ns-resize',
                zIndex: 10,
              }}
            >
              <div
                className="palette-resize-pill"
                style={{
                  position: 'absolute',
                  bottom: 3,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 48,
                  height: 4,
                  borderRadius: 9999,
                  background: 'var(--color-doc-template-muted)',
                }}
              />
            </div>
            <div
              className="palette-resize"
              onMouseDown={(e) => startResize('corner', e)}
              onDoubleClick={() => { setPanelH(null); localStorage.removeItem('palette-h') }}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 24,
                height: 24,
                cursor: 'nwse-resize',
                zIndex: 11,
              }}
            >
              <svg
                className="palette-resize-pill"
                width="10"
                height="10"
                viewBox="0 0 10 10"
                overflow="visible"
                style={{ position: 'absolute', bottom: 5, right: 5 }}
              >
                <path
                  d="M 9 0 A 9 9 0 0 1 0 9"
                  stroke="var(--color-doc-template-muted)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
          </>
        )}
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
