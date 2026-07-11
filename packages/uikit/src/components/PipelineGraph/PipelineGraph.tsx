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
import type { GraphNode, PipelineGraphData, StatusOverlay } from './types'
import { FLOW, NODE_H, NODE_W, STATUS, edgeFlow, kindColor, portAlong, portPos } from './flow'
import { buildEdgePath, type Obstacle } from './edge-path'

export interface PipelineGraphProps {
  graph: PipelineGraphData
  /** Live per-node status overlay, merged onto the static graph. */
  statusById?: StatusOverlay
  /** Controlled selection. Omit for uncontrolled (internal) selection. */
  selectedNodeId?: string | null
  onSelectNode?: (id: string | null) => void
  /** Show the canvas overlay chrome — the edge legend (top-left) and the
   *  keyboard-hint strip (bottom). Default true; pass false for tiny embeds. */
  showControls?: boolean
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
.dl-kbd{font-family:var(--font-uikit-mono);font-size:10px;font-weight:600;color:var(--color-uikit-ink);opacity:.9;background:color-mix(in oklab,var(--color-uikit-ink) 5%,transparent);border:1px solid color-mix(in oklab,var(--color-uikit-ink) 10%,transparent);border-radius:4px;padding:1px 5px;min-width:14px;text-align:center;line-height:1.2;box-shadow:inset 0 -1px 0 color-mix(in oklab,var(--color-uikit-ink) 6%,transparent);display:inline-block}
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

// While dragging a connector tag up/down, snap it flush back onto the edge
// once it's within this many canvas px of the line — so it clicks home instead
// of hovering a pixel or two off with a stub leader trailing behind it.
const TAG_SNAP = 7

export function PipelineGraph({
  graph, statusById, selectedNodeId, onSelectNode, showControls = true, className,
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
  // Per-edge overrides: `bendX` pins where the vertical jog sits (absolute
  // canvas x), `tagDy` lifts the connector tag off the line (canvas y offset).
  const [edgeOverrides, setEdgeOverrides] = useState<Record<number, { bendX?: number; tagDy?: number }>>({})
  useEffect(() => { setPosOverride({}); setEdgeOverrides({}) }, [graph.id])

  const containerRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null)
  const nodeDrag = useRef<{ id: string; sx: number; sy: number; bx: number; by: number; moved: boolean } | null>(null)
  const tagDrag = useRef<{ i: number; sx: number; sy: number; bendX: number; tagDy: number; minX: number; maxX: number } | null>(null)

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
    let w = 800
    let h = 400
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
        const cx = e.clientX - rect.left
        const cy = e.clientY - rect.top
        setView(v => {
          const k = Math.min(2.2, Math.max(0.35, v.k * (e.deltaY < 0 ? 1.08 : 1 / 1.08)))
          const wx = (cx - v.x) / v.k
          const wy = (cy - v.y) / v.k
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
    const dx = (e.clientX - d.sx) / view.k
    const dy = (e.clientY - d.sy) / view.k
    if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true
    setPosOverride(o => ({ ...o, [d.id]: { x: d.bx + dx, y: d.by + dy } }))
  }
  const onNodeUp = (e: ReactPointerEvent, n: GraphNode) => {
    const d = nodeDrag.current
    nodeDrag.current = null
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId) } catch { /* noop */ }
    if (d && !d.moved) select(n.id === selected ? null : n.id)
  }

  // — connector-tag drag: sideways drag moves the edge's vertical bend, up/down
  //   drag lifts the tag off the line (a dashed leader then bridges the gap).
  //   stopPropagation keeps the canvas from panning / nodes from dragging. —
  const onTagDown = (
    e: ReactPointerEvent, i: number,
    from: { x: number; y: number }, to: { x: number; y: number },
    bendX: number, tagDy: number,
  ) => {
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    tagDrag.current = {
      i, sx: e.clientX, sy: e.clientY, bendX, tagDy,
      minX: Math.min(from.x, to.x) + 8, maxX: Math.max(from.x, to.x) - 8,
    }
  }
  const onTagMove = (e: ReactPointerEvent) => {
    const d = tagDrag.current
    if (!d) return
    e.stopPropagation()
    const dxCanvas = (e.clientX - d.sx) / view.k
    const dyCanvas = (e.clientY - d.sy) / view.k
    const bendX = Math.min(d.maxX, Math.max(d.minX, d.bendX + dxCanvas))
    const raw = d.tagDy + dyCanvas
    // Snap onto the line when close, so the tag settles flush and the dashed
    // leader (drawn only when |tagDy| > 2) disappears.
    const tagDy = Math.abs(raw) < TAG_SNAP ? 0 : raw
    setEdgeOverrides(o => ({ ...o, [d.i]: { bendX, tagDy } }))
  }
  const onTagUp = (e: ReactPointerEvent) => {
    if (!tagDrag.current) return
    e.stopPropagation()
    tagDrag.current = null
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId) } catch { /* noop */ }
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
      const sx = v.x + n.pos.x * v.k
      const sy = v.y + n.pos.y * v.k
      const w = NODE_W * v.k
      const h = NODE_H * v.k
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
        // Beige canvas plane + dot grid that translates with the world. Dot
        // size/radius scale with zoom, floored so the browser never tiles a
        // sub-pixel background. (Design: pipelines-canvas.jsx.)
        backgroundColor: 'var(--color-uikit-canvas-bg, var(--color-uikit-panel))',
        backgroundImage: `radial-gradient(circle, var(--color-uikit-canvas-dot, var(--color-uikit-faint)) ${Math.max(0.6, 1.2 * view.k)}px, transparent ${Math.max(0.9, 1.5 * view.k)}px)`,
        backgroundSize: `${Math.max(8, 20 * view.k)}px ${Math.max(8, 20 * view.k)}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
        backgroundRepeat: 'repeat',
      }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
      >
        <svg width={bounds.w} height={bounds.h} className="absolute top-0 left-0 pointer-events-none overflow-visible">
          {graph.edges.map((e, i) => {
            const a = byId[e.from]
            const b = byId[e.to]
            if (!a || !b) return null
            const from = portPos(a, e.fromPort, 'out')
            const to = portPos(b, e.toPort, 'in')
            const obstacles: Obstacle[] = nodes
              .filter(n => n.id !== e.from && n.id !== e.to)
              .map(n => ({ x0: n.pos.x - 4, x1: n.pos.x + NODE_W + 4, y0: n.pos.y - 4, y1: n.pos.y + NODE_H + 4 }))
            // Pin the vertical bend where the (draggable) connector tag sits.
            const bendX = edgeOverrides[i]?.bendX ?? (from.x + to.x) / 2
            const anchorY = (from.y + to.y) / 2
            const tagDy = edgeOverrides[i]?.tagDy ?? 0
            const edgeOpts = { obstacles, bendX }
            const d = buildEdgePath(from, to, edgeOpts)
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
                {/* Leader line: bridges the connector tag back to the edge when lifted. */}
                {Math.abs(tagDy) > 2 && (
                  <line
                    x1={bendX} y1={anchorY} x2={bendX} y2={anchorY + tagDy}
                    stroke="var(--color-uikit-muted)" strokeWidth={1} strokeDasharray="3 3"
                  />
                )}
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

        {/* Connector tags — a draggable pill on each edge, showing what it
            carries (`toPort`). Drag sideways to move the bend, up/down to lift
            the tag off the line. Rendered as HTML so it's pointer-interactive
            (the svg above is pointer-events:none). */}
        {graph.edges.map((e, i) => {
          const a = byId[e.from]
          const b = byId[e.to]
          if (!a || !b) return null
          const from = portPos(a, e.fromPort, 'out')
          const to = portPos(b, e.toPort, 'in')
          const bendX = edgeOverrides[i]?.bendX ?? (from.x + to.x) / 2
          const anchorY = (from.y + to.y) / 2
          const tagDy = edgeOverrides[i]?.tagDy ?? 0
          const hot = !!selected && (e.from === selected || e.to === selected)
          const dim = !!selected && !hot
          return (
            <div
              key={`tag-${i}`}
              onPointerDown={ev => onTagDown(ev, i, from, to, bendX, tagDy)}
              onPointerMove={onTagMove}
              onPointerUp={onTagUp}
              onPointerCancel={onTagUp}
              style={{
                position: 'absolute',
                left: bendX, top: anchorY + tagDy,
                transform: 'translate(-50%, -50%)',
                opacity: dim ? 0.28 : 1,
                transition: 'opacity 160ms ease',
                fontFamily: 'var(--font-uikit-mono)', fontSize: 9, lineHeight: 1,
                padding: '2px 6px', borderRadius: 5,
                background: 'var(--color-uikit-canvas-bg, var(--color-uikit-panel))',
                border: '2px solid var(--color-uikit-muted)',
                color: 'var(--color-uikit-muted)',
                whiteSpace: 'nowrap', cursor: 'grab', userSelect: 'none',
              }}
            >
              {e.toPort}
            </div>
          )
        })}
      </div>

      {showControls && <Legend />}
      {showControls && <KeyHint zoom={view.k} />}
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

      {/* Input ports: one per parameter. */}
      {node.inputs.map((p, i) => (
        <Port key={`in-${p}-${i}`} dir="in" along={portAlong(node.inputs.length, i)} label={p} />
      ))}
      {/* Output ports (the tracer emits one — the result table). */}
      {node.outputs.map((p, i) => (
        <Port key={`out-${p}-${i}`} dir="out" along={portAlong(node.outputs.length, i)} label={p} />
      ))}
    </div>
  )
}

function Port({ dir, along, label }: { dir: 'in' | 'out'; along: number; label: string }) {
  // Dot center sits at `along + 2` (top-left `along - 1` + 3px half-height).
  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    top: along + 2,
    ...(dir === 'in'
      ? { left: -6, transform: 'translate(-100%, -50%)' }
      : { right: -6, transform: 'translate(100%, -50%)' }),
    fontFamily: 'var(--font-uikit-mono)', fontSize: 9, lineHeight: 1,
    color: 'var(--color-uikit-muted)', whiteSpace: 'nowrap', pointerEvents: 'none',
  }
  return (
    <>
      <span style={{
        position: 'absolute',
        top: along - 1,
        ...(dir === 'in' ? { left: -3 } : { right: -3 }),
        width: 6, height: 6, borderRadius: 3,
        background: 'var(--color-uikit-panel)',
        border: '1px solid var(--color-uikit-muted)',
      }} />
      <span style={labelStyle}>{label}</span>
    </>
  )
}

// ---------------------------------------------------------------------------
// Canvas overlay chrome — a floating "glass" card look shared by the legend
// (top-left) and the key-hint strip (bottom). Ported from the design's
// .pipe-legend / .pipe-keyhint (panel 88% + blur + faint hairline).
// ---------------------------------------------------------------------------

const GLASS = {
  position: 'absolute',
  background: 'color-mix(in oklab, var(--color-uikit-panel) 88%, transparent)',
  backdropFilter: 'blur(8px) saturate(1.05)',
  WebkitBackdropFilter: 'blur(8px) saturate(1.05)',
  border: '1px solid color-mix(in oklab, var(--color-uikit-faint) 70%, transparent)',
  borderRadius: 8,
  boxShadow: '0 1px 2px rgba(0,0,0,.06)',
  fontFamily: 'var(--font-uikit-mono)',
  color: 'var(--color-uikit-muted)',
  pointerEvents: 'none',
  zIndex: 6,
} satisfies React.CSSProperties

// Edge legend — top-left, a compact column of flow swatches.
const LEGEND: { key: keyof typeof FLOW }[] = [
  { key: 'running' }, { key: 'queued' }, { key: 'stalled' }, { key: 'error' }, { key: 'ok' },
]

function Legend() {
  return (
    <div
      className="hidden sm:flex"
      style={{
        ...GLASS,
        left: 14, top: 12,
        flexDirection: 'column', alignItems: 'flex-start', gap: 4,
        padding: '8px 10px', fontSize: 10, fontWeight: 500,
        letterSpacing: '.04em', whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase',
          opacity: 0.7, paddingBottom: 2, marginBottom: 2, width: '100%',
          borderBottom: '1px solid color-mix(in oklab, var(--color-uikit-faint) 80%, transparent)',
        }}
      >
        edges
      </span>
      {LEGEND.map(({ key }) => {
        const s = FLOW[key]
        return (
          <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <svg width="22" height="8" viewBox="0 0 22 8" style={{ flexShrink: 0 }}>
              <line x1="1" y1="4" x2="21" y2="4" stroke={s.color} strokeWidth={s.width} strokeDasharray={s.dash} strokeLinecap="round" className={s.anim} />
            </svg>
            <span style={{ fontSize: 10.5, letterSpacing: '.04em', opacity: 0.9, color: s.color }}>{s.label}</span>
          </span>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Key-hint strip — bottom of canvas, the real shortcuts this component binds.
// ---------------------------------------------------------------------------

function Kbd({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <kbd className="dl-kbd" style={wide ? { minWidth: 18 } : undefined}>{children}</kbd>
}

function HintGroup({ children }: { children: React.ReactNode }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>{children}</span>
}

function HintSep() {
  return (
    <span
      aria-hidden
      style={{ width: 1, height: 14, flexShrink: 0, background: 'color-mix(in oklab, var(--color-uikit-faint) 80%, transparent)' }}
    />
  )
}

function KeyHint({ zoom }: { zoom: number }) {
  const showZoom = Math.abs(zoom - 1) > 0.02
  const label = (t: string) => (
    <span style={{ marginLeft: 2, opacity: 0.85 }}>{t}</span>
  )
  return (
    <div
      className="hidden sm:flex"
      style={{
        ...GLASS,
        left: 14, bottom: 12, right: 14, maxWidth: 'max-content',
        alignItems: 'center', gap: 10, padding: 5,
        fontSize: 10.5, fontWeight: 500, letterSpacing: '.02em',
        overflow: 'hidden', whiteSpace: 'nowrap',
      }}
    >
      <HintGroup><Kbd wide>↑</Kbd><Kbd>↓</Kbd>{label('select')}</HintGroup>
      <HintSep />
      <HintGroup><Kbd>←</Kbd><Kbd>→</Kbd>{label('neighbor')}</HintGroup>
      <HintSep />
      <HintGroup><Kbd>esc</Kbd>{label('clear')}</HintGroup>
      <HintSep />
      <HintGroup><Kbd>⌘</Kbd>{label('scroll zoom')}</HintGroup>
      {showZoom && (
        <span
          style={{
            marginLeft: 2, color: 'var(--color-uikit-ink)', opacity: 0.8,
            padding: '1px 7px', borderRadius: 999, fontWeight: 600, fontSize: 10, flexShrink: 0,
            background: 'color-mix(in oklab, var(--color-uikit-ink) 8%, transparent)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {Math.round(zoom * 100)}%
        </span>
      )}
    </div>
  )
}
