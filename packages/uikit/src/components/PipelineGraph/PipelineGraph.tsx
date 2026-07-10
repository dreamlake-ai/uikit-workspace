/**
 * PipelineGraph — renders a traced pipeline's node/edge DAG. Pure and
 * presentational: it takes the graph JSON (from `dl_trace`) and draws it,
 * with no data fetching of its own. A faithful reproduction of the DreamLake
 * Studio design prototype — dotted canvas, status-tinted node cards, orthogonal
 * rounded edges that detour around nodes, and six runtime "flow" states.
 *
 * Edges store no runtime style: each edge's flow (running / ok / error /
 * stalled / queued / idle) is derived from its endpoints' `status`. Pass a live
 * `statusById` overlay (e.g. streamed from a remote runner) and the graph
 * animates without re-tracing.
 *
 * Keyboard (once the canvas is focused — click or tab into it): ↑/↓ (or k/j)
 * step to the previous / next node in topological order; ←/→ (or h/l) select
 * the upstream / downstream neighbour; Esc clears the selection. The selected
 * node is panned into view. Keys are scoped to focus, so they never hijack the
 * page or collide with another graph on the same page.
 */
import {
  useCallback, useEffect, useMemo, useRef, useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { cn } from '../../lib/utils'
import type { GraphNode, NodeStatus, PipelineGraphData, StatusOverlay } from './types'
import { FLOW, NODE_H, NODE_W, STATUS, edgeFlow, kindColor, portAlong, portPos } from './flow'
import { buildEdgePath, type Obstacle } from './edge-path'

export interface PipelineGraphProps {
  graph: PipelineGraphData
  /** Live per-node status overlay, merged onto the static graph. */
  statusById?: StatusOverlay
  /** Controlled selection. Omit for uncontrolled (internal) selection. */
  selectedNodeId?: string | null
  onSelectNode?: (id: string | null) => void
  className?: string
}

// Injected once — the flow/pulse keyframes (design's <style> block).
const CSS = `
@keyframes dlNodePulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--color-uikit-tone-blue) 50%,transparent)}50%{box-shadow:0 0 0 5px transparent}}
@keyframes dlEdgeFlow{to{stroke-dashoffset:-22}}
.dl-edge-flow{animation:dlEdgeFlow .9s linear infinite}
@keyframes dlEdgeQueued{to{stroke-dashoffset:-18}}
.dl-edge-queued{animation:dlEdgeQueued 2.6s linear infinite;opacity:.8}
@keyframes dlEdgeStalled{0%,100%{opacity:.55}50%{opacity:.9}}
.dl-edge-stalled{animation:dlEdgeStalled 2s ease-in-out infinite}
`
function useInjectedStyles() {
  useEffect(() => {
    const ID = 'dl-pipeline-graph-styles'
    if (document.getElementById(ID)) return
    const el = document.createElement('style')
    el.id = ID
    el.textContent = CSS
    document.head.appendChild(el)
  }, [])
}

type View = { x: number; y: number; k: number }

export function PipelineGraph({
  graph, statusById, selectedNodeId, onSelectNode, className,
}: PipelineGraphProps) {
  useInjectedStyles()

  const [internalSel, setInternalSel] = useState<string | null>(null)
  const selected = selectedNodeId !== undefined ? selectedNodeId : internalSel
  const select = useCallback((id: string | null) => {
    if (selectedNodeId === undefined) setInternalSel(id)
    onSelectNode?.(id)
  }, [selectedNodeId, onSelectNode])

  const [view, setView] = useState<View>({ x: 28, y: 20, k: 1 })
  const [posOverride, setPosOverride] = useState<Record<string, { x: number; y: number }>>({})
  useEffect(() => { setPosOverride({}) }, [graph.id])

  const containerRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null)
  const nodeDrag = useRef<{ id: string; sx: number; sy: number; bx: number; by: number; moved: boolean } | null>(null)

  // Effective nodes: drag overrides + live status overlay merged in.
  const nodes = useMemo(() => {
    return Object.values(graph.nodes).map((n): GraphNode => {
      const ov = statusById?.[n.id]
      return {
        ...n,
        pos: posOverride[n.id] ?? n.pos,
        status: ov?.status ?? n.status,
        progress: ov?.progress ?? n.progress,
        duration: ov?.duration ?? n.duration,
      }
    })
  }, [graph.nodes, posOverride, statusById])

  const byId = useMemo(() => Object.fromEntries(nodes.map(n => [n.id, n])), [nodes])

  // Topological order of the nodes (Kahn's) — the linear sequence ↑/↓ step
  // through. Nodes left out by a cycle are appended in insertion order so every
  // node is reachable. (Design: pipelines-view.jsx `topoOrder`.)
  const topoOrder = useMemo(() => {
    const ids = Object.keys(graph.nodes)
    const indeg: Record<string, number> = Object.fromEntries(ids.map(id => [id, 0]))
    for (const e of graph.edges) if (indeg[e.to] != null) indeg[e.to] += 1
    const queue = ids.filter(id => indeg[id] === 0)
    const order: string[] = []
    while (queue.length) {
      const n = queue.shift()!
      order.push(n)
      for (const e of graph.edges) {
        if (e.from === n && indeg[e.to] != null && --indeg[e.to] === 0) queue.push(e.to)
      }
    }
    for (const id of ids) if (!order.includes(id)) order.push(id)
    return order
  }, [graph.nodes, graph.edges])

  const bounds = useMemo(() => {
    let w = 800, h = 400
    for (const n of nodes) {
      w = Math.max(w, n.pos.x + NODE_W + 140)
      h = Math.max(h, n.pos.y + NODE_H + 140)
    }
    return { w, h }
  }, [nodes])

  // — panning (background) + zoom (pinch / ctrl+wheel) + two-finger scroll pan —
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect()
        const cx = e.clientX - rect.left, cy = e.clientY - rect.top
        setView(v => {
          const k = Math.min(2.2, Math.max(0.35, v.k * (e.deltaY < 0 ? 1.08 : 1 / 1.08)))
          const wx = (cx - v.x) / v.k, wy = (cy - v.y) / v.k
          return { k, x: cx - wx * k, y: cy - wy * k }
        })
      } else {
        setView(v => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const onBgDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    ;(e.currentTarget as HTMLElement).focus({ preventScroll: true })
    panRef.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }
    select(null)
  }
  const onBgMove = (e: ReactPointerEvent) => {
    const p = panRef.current
    if (!p) return
    setView(v => ({ ...v, x: p.vx + (e.clientX - p.x), y: p.vy + (e.clientY - p.y) }))
  }
  const onBgUp = (e: ReactPointerEvent) => {
    panRef.current = null
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId) } catch { /* noop */ }
  }

  const onNodeDown = (e: ReactPointerEvent, n: GraphNode) => {
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    containerRef.current?.focus({ preventScroll: true })   // so arrow-key nav works right after a click
    nodeDrag.current = { id: n.id, sx: e.clientX, sy: e.clientY, bx: n.pos.x, by: n.pos.y, moved: false }
  }
  const onNodeMove = (e: ReactPointerEvent) => {
    const d = nodeDrag.current
    if (!d) return
    const dx = (e.clientX - d.sx) / view.k, dy = (e.clientY - d.sy) / view.k
    if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true
    setPosOverride(o => ({ ...o, [d.id]: { x: d.bx + dx, y: d.by + dy } }))
  }
  const onNodeUp = (e: ReactPointerEvent, n: GraphNode) => {
    const d = nodeDrag.current
    nodeDrag.current = null
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId) } catch { /* noop */ }
    if (d && !d.moved) select(n.id === selected ? null : n.id)
  }

  // — keyboard navigation (only when the canvas is focused, so it never hijacks
  //   page arrow keys or collides with other graphs on the same page) —

  // Pan just enough to bring a node fully into the viewport (the graph has no
  // auto-fit, so keyboard-stepping past the edge would otherwise select an
  // off-screen node).
  const ensureVisible = useCallback((id: string) => {
    const el = containerRef.current
    const n = byId[id]
    if (!el || !n) return
    const rect = el.getBoundingClientRect()
    const pad = 48
    setView(v => {
      let { x, y } = v
      const sx = v.x + n.pos.x * v.k, sy = v.y + n.pos.y * v.k
      const w = NODE_W * v.k, h = NODE_H * v.k
      if (sx < pad) x = v.x + (pad - sx)
      else if (sx + w > rect.width - pad) x = v.x - (sx + w - (rect.width - pad))
      if (sy < pad) y = v.y + (pad - sy)
      else if (sy + h > rect.height - pad) y = v.y - (sy + h - (rect.height - pad))
      return x === v.x && y === v.y ? v : { ...v, x, y }
    })
  }, [byId])

  const onKeyDown = useCallback((e: ReactKeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
    const k = e.key
    const idx = selected ? topoOrder.indexOf(selected) : -1
    let next: string | undefined
    if (k === 'ArrowDown' || k === 'j') {
      next = topoOrder[idx < 0 ? 0 : Math.min(topoOrder.length - 1, idx + 1)]
    } else if (k === 'ArrowUp' || k === 'k') {
      next = topoOrder[idx < 0 ? 0 : Math.max(0, idx - 1)]
    } else if (k === 'ArrowLeft' || k === 'h') {
      if (!selected) return
      next = graph.edges.find(ed => ed.to === selected)?.from
    } else if (k === 'ArrowRight' || k === 'l') {
      if (!selected) return
      next = graph.edges.find(ed => ed.from === selected)?.to
    } else if (k === 'Escape') {
      if (selected) { e.preventDefault(); select(null) }
      return
    } else {
      return
    }
    e.preventDefault()
    if (next && next !== selected) {
      select(next)
      ensureVisible(next)
    }
  }, [topoOrder, selected, graph.edges, select, ensureVisible])

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="application"
      aria-label={`${graph.title} pipeline graph`}
      onPointerDown={onBgDown}
      onPointerMove={onBgMove}
      onPointerUp={onBgUp}
      onKeyDown={onKeyDown}
      className={cn('relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing outline-none', className)}
      style={{
        backgroundColor: 'var(--color-uikit-bg, var(--color-uikit-panel))',
        backgroundImage: 'radial-gradient(circle, var(--color-uikit-faint) 1px, transparent 1.4px)',
        backgroundSize: `${22 * view.k}px ${22 * view.k}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
      }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
      >
        <svg width={bounds.w} height={bounds.h} className="absolute top-0 left-0 pointer-events-none overflow-visible">
          {graph.edges.map((e, i) => {
            const a = byId[e.from], b = byId[e.to]
            if (!a || !b) return null
            const from = portPos(a, e.fromPort, 'out')
            const to = portPos(b, e.toPort, 'in')
            const obstacles: Obstacle[] = nodes
              .filter(n => n.id !== e.from && n.id !== e.to)
              .map(n => ({ x0: n.pos.x - 4, x1: n.pos.x + NODE_W + 4, y0: n.pos.y - 4, y1: n.pos.y + NODE_H + 4 }))
            const d = buildEdgePath(from, to, { obstacles })
            const flow = edgeFlow(a.status, b.status)
            const spec = FLOW[flow]
            const hot = !!selected && (e.from === selected || e.to === selected)
            // Highlighted edges use one accent colour (matches the design), not
            // the source node's kind colour — so a selection reads consistently.
            const stroke = hot ? 'var(--color-uikit-accent)' : spec.color
            const width = hot ? Math.max(spec.width, 2) : spec.width
            const dim = !!selected && !hot
            // A `mask` edge is a gate/filter, not data flow. In the settled
            // states (idle / ok) it stays DASHED whether or not it's selected —
            // so a highlighted mask edge reads as a mask, not a data edge. It's
            // only faded when unselected; when running/error the flow style wins.
            const maskGate = e.kind === 'mask' && (flow === 'idle' || flow === 'ok')
            const dash = maskGate ? '4 4' : spec.dash
            const opacity = dim ? 0.28 : (maskGate && !hot ? 0.6 : 1)
            return (
              <g key={i} style={{ opacity, transition: 'opacity 160ms ease' }}>
                <path
                  d={d} fill="none" stroke={stroke} strokeWidth={width}
                  strokeLinecap="round" strokeDasharray={dash}
                  className={hot ? undefined : spec.anim}
                />
                <path
                  d={`M ${to.x - 6} ${to.y - 4} L ${to.x} ${to.y} L ${to.x - 6} ${to.y + 4}`}
                  fill="none" stroke={stroke} strokeWidth={width}
                  strokeLinecap="round" strokeLinejoin="round"
                />
              </g>
            )
          })}
        </svg>

        {nodes.map(n => (
          <PipeNode
            key={n.id}
            node={n}
            selected={n.id === selected}
            dimmed={!!selected && n.id !== selected}
            onPointerDown={e => onNodeDown(e, n)}
            onPointerMove={onNodeMove}
            onPointerUp={e => onNodeUp(e, n)}
          />
        ))}
      </div>

      <Legend />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Node card — faithful to the design (156×72, status-tinted, ports on edges).
// ---------------------------------------------------------------------------

function PipeNode({ node, selected, dimmed, onPointerDown, onPointerMove, onPointerUp }: {
  node: GraphNode
  selected: boolean
  dimmed: boolean
  onPointerDown: (e: ReactPointerEvent) => void
  onPointerMove: (e: ReactPointerEvent) => void
  onPointerUp: (e: ReactPointerEvent) => void
}) {
  const kc = kindColor(node.kind)
  const st = STATUS[node.status] ?? STATUS.idle
  const idle = node.status === 'idle'

  const panel = 'var(--color-uikit-panel)'
  const bg = idle
    ? panel
    : `color-mix(in srgb, ${panel} ${selected ? '84%' : '90%'}, ${st.color})`
  const border = selected
    ? 'var(--color-uikit-accent)'
    : idle
      ? 'var(--color-uikit-faint)'
      : `color-mix(in srgb, var(--color-uikit-faint) 55%, ${st.color})`

  return (
    <div
      data-node={node.id}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      title={node.title}
      style={{
        position: 'absolute',
        left: node.pos.x, top: node.pos.y,
        width: NODE_W, height: NODE_H,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 7,
        padding: '8px 10px',
        display: 'flex', flexDirection: 'column', gap: 4,
        cursor: 'grab',
        boxShadow: selected ? '0 1px 0 rgba(0,0,0,.05), 0 6px 18px rgba(0,0,0,.10)' : '0 1px 0 rgba(0,0,0,.04)',
        opacity: dimmed ? 0.4 : 1,
        transition: 'opacity 160ms ease, border-color 120ms ease, background 120ms ease',
        fontFamily: 'var(--font-uikit-mono)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
        <span style={{ width: 7, height: 7, borderRadius: 2, background: kc, flexShrink: 0 }} />
        <span style={{
          fontSize: 12, fontWeight: 600, color: 'var(--color-uikit-ink)', letterSpacing: '-.005em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: 1,
        }}>{node.title}</span>
      </div>

      <div style={{
        fontSize: 9, fontWeight: 500, color: 'var(--color-uikit-muted)', opacity: 0.7,
        letterSpacing: '.06em', textTransform: 'uppercase',
      }}>
        {node.kind} · {node.inputs.length}→{node.outputs.length}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 500, marginTop: 'auto' }}>
        <span
          className={node.status === 'running' ? 'dl-node-pulse' : undefined}
          style={{
            width: 6, height: 6, borderRadius: 3, background: st.color,
            animation: node.status === 'running' ? 'dlNodePulse 1.4s ease-in-out infinite' : undefined,
          }}
        />
        <span style={{ color: st.color, letterSpacing: '.04em' }}>{st.label}</span>
        <span style={{ flex: 1 }} />
        {node.status === 'running' && node.progress != null && (
          <span style={{ color: 'var(--color-uikit-muted)', opacity: 0.85 }}>{Math.round(node.progress * 100)}%</span>
        )}
        {node.duration != null && node.status !== 'running' && (
          <span style={{ color: 'var(--color-uikit-muted)', opacity: 0.85 }}>
            {node.duration < 60 ? `${node.duration.toFixed(1)}s` : `${(node.duration / 60).toFixed(1)}m`}
          </span>
        )}
      </div>

      {/* Input ports: one per parameter. */}
      {node.inputs.map((p, i) => (
        <Port key={`in-${p}-${i}`} dir="in" along={portAlong(node.inputs.length, i)} />
      ))}
      {/* Output ports (the tracer emits one — the result table). */}
      {node.outputs.map((p, i) => (
        <Port key={`out-${p}-${i}`} dir="out" along={portAlong(node.outputs.length, i)} />
      ))}
    </div>
  )
}

function Port({ dir, along }: { dir: 'in' | 'out'; along: number }) {
  return (
    <span style={{
      position: 'absolute',
      top: along,
      ...(dir === 'in' ? { left: -3 } : { right: -3 }),
      width: 6, height: 6, borderRadius: 3,
      background: 'var(--color-uikit-panel)',
      border: '1px solid var(--color-uikit-muted)',
    }} />
  )
}

// ---------------------------------------------------------------------------
// Legend — bottom-right, the flow states (design's PipeLegend).
// ---------------------------------------------------------------------------

const LEGEND: { key: keyof typeof FLOW }[] = [
  { key: 'running' }, { key: 'queued' }, { key: 'stalled' }, { key: 'error' }, { key: 'ok' },
]

function Legend() {
  return (
    <div
      className="absolute bottom-2 right-2 hidden sm:flex items-center gap-3 px-2.5 py-1 rounded-md pointer-events-none"
      style={{
        background: 'color-mix(in srgb, var(--color-uikit-panel) 80%, transparent)',
        border: '1px solid var(--color-uikit-faint)',
        backdropFilter: 'blur(6px)',
        fontFamily: 'var(--font-uikit-mono)',
      }}
    >
      <span style={{ fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-uikit-muted)', opacity: 0.7 }}>
        edges
      </span>
      {LEGEND.map(({ key }) => {
        const s = FLOW[key]
        return (
          <span key={key} className="flex items-center gap-1.5">
            <svg width="22" height="8" viewBox="0 0 22 8" style={{ flexShrink: 0 }}>
              <line x1="1" y1="4" x2="21" y2="4" stroke={s.color} strokeWidth={s.width} strokeDasharray={s.dash} strokeLinecap="round" className={s.anim} />
            </svg>
            <span style={{ fontSize: 10, color: s.color }}>{s.label}</span>
          </span>
        )
      })}
    </div>
  )
}
