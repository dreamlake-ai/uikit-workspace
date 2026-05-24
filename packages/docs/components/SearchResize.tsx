import { useEffect, useRef, useState } from 'react'

const DAY_MS = 86_400_000

export function useSearchResize(hitCount: number, totalChars: number) {
  const [panelH, setPanelH] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = JSON.parse(localStorage.getItem('palette-h') ?? '')
      if (Date.now() - raw.ts > DAY_MS) { localStorage.removeItem('palette-h'); return null }
      return Number.isFinite(raw.v) && raw.v > 0 ? raw.v : null
    } catch { return null }
  })
  const [isResizing, setIsResizing] = useState(false)
  const edgeRef = useRef<'bottom' | 'corner' | null>(null)
  const originRef = useRef({ x: 0, y: 0, w: 0, h: 0 })

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!edgeRef.current) return
      const dy = e.clientY - originRef.current.y
      setPanelH(Math.max(200, Math.min(originRef.current.h + dy, window.innerHeight - 60)))
    }
    function onUp() {
      if (edgeRef.current) {
        edgeRef.current = null
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

  const maxVh = typeof window !== 'undefined' ? window.innerHeight * 0.7 : 540
  const effectiveH = panelH ?? (() => {
    const rowH = Math.max(hitCount, 1) * 48 + 44
    const charH = 120 + Math.min(totalChars * 0.3, 420)
    return Math.max(250, Math.min(Math.max(rowH, charH), maxVh, 540))
  })()

  function startResize(edge: 'bottom' | 'corner', e: React.MouseEvent) {
    const panel = (e.currentTarget as HTMLElement).closest('[data-palette-panel]') as HTMLElement
    if (!panel) return
    const rect = panel.getBoundingClientRect()
    edgeRef.current = edge
    originRef.current = { x: e.clientX, y: e.clientY, w: rect.width, h: rect.height }
    setIsResizing(true)
    document.body.style.userSelect = 'none'
  }

  function resetHeight() {
    setPanelH(null)
    localStorage.removeItem('palette-h')
  }

  return { panelH, effectiveH, isResizing, startResize, resetHeight }
}

export function SearchResizeHandles({ startResize, resetHeight }: {
  startResize: (edge: 'bottom' | 'corner', e: React.MouseEvent) => void
  resetHeight: () => void
}) {
  return (
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
        onDoubleClick={resetHeight}
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
        onDoubleClick={resetHeight}
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
  )
}
