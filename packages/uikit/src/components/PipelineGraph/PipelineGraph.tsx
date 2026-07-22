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
import type { GraphNode, GraphEdge, PipelineGraphData, StatusOverlay } from './types'
import { FLOW, NODE_H, NODE_W, STATUS, edgeFlow, kindColor, portPos } from './flow'
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

// —— Per-edge param tags ————————————————————————————————————————————————————
// Each node-pair (A→B) gets one tag listing the params it transfers (the edge
// toPorts). It anchors at the straight-line midpoint between A's out dot and B's
// in dot — so it tracks both nodes as they move — and is auto-placed into open
// canvas so it never overlaps a node or another tag. A single straight dashed
// leader joins it back to the anchor; being one diagonal segment it can't run
// collinear with the axis-aligned edges, so it never *overlaps* an edge.

// Estimated tag box (mono 9px / 600 / .04em, matching the design's edge label),
// used to test candidate placements for collisions. Slightly OVER-estimated so a
// reserved slot always fully clears the rendered tag (no residual overlap).
const TAG_CHARW = 6.0      // ~advance of one mono char at 9px + letter-spacing, rounded up
const TAG_PADX = 7
const TAG_PADY = 3         // → single-row box ≈ 15px tall (design pill is 14)
const TAG_ROW = 10         // one param row's height
const TAG_ROWGAP = 3       // vertical gap between rows
const TAG_LEADCOL = 8      // leading dot (3px) + its 5px gap before the text
const TAG_MARGIN = 14      // clearance kept around a placed tag (fixes slight overlap)

type TagRect = { x0: number; y0: number; x1: number; y1: number }
const rectsOverlap = (a: TagRect, b: TagRect) =>
  a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0
// Coarse sampled segment∩rect test — keeps a leader from tunnelling under a node.
function segHitsRect(ax: number, ay: number, bx: number, by: number, r: TagRect): boolean {
  const N = 16
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const x = ax + (bx - ax) * t
    const y = ay + (by - ay) * t
    if (x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) return true
  }
  return false
}
function estTagSize(params: string[]): { w: number; h: number } {
  const longest = params.reduce((m, p) => Math.max(m, p.length), 0)
  return {
    w: TAG_PADX * 2 + TAG_LEADCOL + Math.ceil(longest * TAG_CHARW),
    h: TAG_PADY * 2 + params.length * TAG_ROW + Math.max(0, params.length - 1) * TAG_ROWGAP,
  }
}
// Placement search directions, preferring straight ABOVE first (near-vertical
// leader), then fanning up-sideways, then below.
const TAG_DIRS: [number, number][] = [
  [0, -1], [-0.5, -1], [0.5, -1], [-1, -0.5], [1, -0.5], [0, 1], [-1, 0.5], [1, 0.5],
]

// Measure the point at `frac` (0..1) along an SVG path's length. Used to anchor a
// tag ON the real routed edge — the straight-line midpoint floats off a detouring
// edge, leaving the leader connected to nothing. Uses a cached detached <path>;
// getPointAtLength is pure geometry and works unattached. Null on the server (no
// document) → the caller falls back to the straight midpoint.
let _measurePath: SVGPathElement | null = null
function pointOnPath(d: string, frac: number): { x: number; y: number } | null {
  if (typeof document === 'undefined') return null
  try {
    if (!_measurePath) _measurePath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    _measurePath.setAttribute('d', d)
    const len = _measurePath.getTotalLength()
    if (!len || !Number.isFinite(len)) return null
    const p = _measurePath.getPointAtLength(len * frac)
    return { x: p.x, y: p.y }
  } catch {
    return null
  }
}

// Group edges by node-pair, collecting each pair's transferred params (toPorts).
function groupEdgeParams(edges: GraphEdge[]): Map<string, { from: string; to: string; params: string[] }> {
  const groups = new Map<string, { from: string; to: string; params: string[] }>()
  for (const e of edges) {
    const key = `${e.from}->${e.to}`
    let g = groups.get(key)
    if (!g) { g = { from: e.from, to: e.to, params: [] }; groups.set(key, g) }
    if (e.toPort && !g.params.includes(e.toPort)) g.params.push(e.toPort)
  }
  return groups
}

// The on-edge midpoint anchor for a pair — same endpoints + obstacles as the drawn
// edge, so it lands exactly on the rendered (routed) path. Falls back to the
// straight midpoint if the path can't be measured (server render).
function pairAnchor(src: GraphNode, dst: GraphNode, all: GraphNode[], fromId: string, toId: string): { x: number; y: number } {
  const from = portPos(src, '', 'out')
  const to = portPos(dst, '', 'in')
  const obstacles: Obstacle[] = all
    .filter(n => n.id !== fromId && n.id !== toId)
    .map(n => ({ x0: n.pos.x - 4, x1: n.pos.x + NODE_W + 4, y0: n.pos.y - 4, y1: n.pos.y + NODE_H + 4 }))
  return pointOnPath(buildEdgePath(from, to, { obstacles }), 0.5)
    ?? { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
}

// Adaptive placement — the expensive part. For each pair: anchor at its on-edge
// midpoint, then search outward (preferring straight above) for a slot clear of
// every node rect and already-placed tag, whose straight leader doesn't tunnel a
// node. Returns per-pair offsets {dx,dy} from the anchor. Runs ONCE per graph (at
// init) — node drags reuse the frozen offsets, so this never hits the hot path.
function autoPlaceTags(nodeList: GraphNode[], edges: GraphEdge[]): Record<string, { dx: number; dy: number }> {
  const byId: Record<string, GraphNode> = Object.fromEntries(nodeList.map(n => [n.id, n]))
  const nodeRects: TagRect[] = nodeList.map(n => ({ x0: n.pos.x, y0: n.pos.y, x1: n.pos.x + NODE_W, y1: n.pos.y + NODE_H }))
  const items: Array<{ key: string; anchorX: number; anchorY: number; w: number; h: number }> = []
  for (const g of groupEdgeParams(edges).values()) {
    const src = byId[g.from]; const dst = byId[g.to]
    if (!src || !dst || g.params.length === 0) continue
    const mid = pairAnchor(src, dst, nodeList, g.from, g.to)
    const { w, h } = estTagSize(g.params)
    items.push({ key: `${g.from}->${g.to}`, anchorX: mid.x, anchorY: mid.y, w, h })
  }
  // Deterministic placement order: top-to-bottom, then left-to-right.
  items.sort((a, b) => a.anchorY - b.anchorY || a.anchorX - b.anchorX)

  const placed: TagRect[] = []
  const offs: Record<string, { dx: number; dy: number }> = {}
  for (const it of items) {
    const boxAt = (cx: number, cy: number, pad = 0): TagRect => ({
      x0: cx - it.w / 2 - pad, y0: cy - it.h / 2 - pad,
      x1: cx + it.w / 2 + pad, y1: cy + it.h / 2 + pad,
    })
    const base = it.h / 2 + TAG_MARGIN + 24
    let cx = it.anchorX, cy = it.anchorY - base
    let found = false
    for (let ring = 0; ring < 12 && !found; ring++) {
      const dist = base + ring * 22
      for (const [ux, uy] of TAG_DIRS) {
        const tx = it.anchorX + ux * dist
        const ty = it.anchorY + uy * dist
        const box = boxAt(tx, ty, TAG_MARGIN)
        if (nodeRects.some(r => rectsOverlap(box, r))) continue
        if (placed.some(r => rectsOverlap(box, r))) continue
        if (nodeRects.some(r => segHitsRect(it.anchorX, it.anchorY, tx, ty, r))) continue
        cx = tx; cy = ty; found = true; break
      }
    }
    placed.push(boxAt(cx, cy))
    offs[it.key] = { dx: cx - it.anchorX, dy: cy - it.anchorY }
  }
  return offs
}

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
  // Per-pair tag offset from its edge-midpoint anchor (keyed `from->to`). Seeded
  // ONCE per graph by the adaptive placement below, then frozen — node drags reuse
  // these offsets (only the anchor moves), and a manual tag drag overwrites one.
  const [tagOffset, setTagOffset] = useState<Record<string, { dx: number; dy: number }>>({})
  // The pair key of the tag currently pressed/held — highlights that tag, its
  // leader, and the edge its anchor sits on. Cleared on pointer up / cancel.
  const [activeTag, setActiveTag] = useState<string | null>(null)
  // One-time adaptive placement: solve collision-free offsets from the initial
  // layout and freeze them. Keyed on graph.id so it runs on load / version change,
  // NOT on every node drag — keeping the O(pairs·rings·dirs) search off the hot path.
  useEffect(() => {
    setPosOverride({})
    setTagOffset(autoPlaceTags(Object.values(graph.nodes), graph.edges))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph.id])

  const containerRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null)
  const nodeDrag = useRef<{ id: string; sx: number; sy: number; bx: number; by: number; moved: boolean } | null>(null)
  const tagDrag = useRef<{ id: string; sx: number; sy: number; dx: number; dy: number } | null>(null)

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

  // Per-edge param tags — one per node-pair (A→B), listing the params it transfers
  // (edge toPorts). Anchored at the pair's ON-EDGE midpoint (tracks both nodes as
  // they move); positioned by a FROZEN offset from the one-time adaptive placement
  // (the graph.id effect) or a manual drag. A straight dashed leader joins tag to
  // anchor. This recomputes per render so anchors follow node drags, but does NO
  // collision search — only the cheap per-pair anchor measurement.
  const pairTags = useMemo(() => {
    const out: Array<{
      key: string; from: string; to: string; params: string[]
      anchorX: number; anchorY: number; tagX: number; tagY: number
      off: { dx: number; dy: number }; color: string
    }> = []
    for (const g of groupEdgeParams(graph.edges).values()) {
      const src = byId[g.from]; const dst = byId[g.to]
      if (!src || !dst || g.params.length === 0) continue
      const mid = pairAnchor(src, dst, nodes, g.from, g.to)
      const key = `${g.from}->${g.to}`
      // Frozen offset from the adaptive pass or a drag; a straight-above fallback
      // covers the first frame before the init effect populates tagOffset.
      const off = tagOffset[key] ?? { dx: 0, dy: -(estTagSize(g.params).h / 2 + TAG_MARGIN + 24) }
      out.push({
        key, from: g.from, to: g.to, params: g.params,
        anchorX: mid.x, anchorY: mid.y, tagX: mid.x + off.dx, tagY: mid.y + off.dy, off,
        color: FLOW[edgeFlow(src.status, dst.status)].color,
      })
    }
    return out
  }, [nodes, graph.edges, byId, tagOffset])

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

  // — tag drag: move a pair's param tag in both axes off its edge-midpoint anchor
  //   (a straight dashed leader bridges the gap); this pins it, overriding the
  //   auto-placement. stopPropagation keeps the canvas/nodes from also dragging. —
  const onTagDown = (e: ReactPointerEvent, id: string, off: { dx: number; dy: number }) => {
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    tagDrag.current = { id, sx: e.clientX, sy: e.clientY, dx: off.dx, dy: off.dy }
    setActiveTag(id)   // highlight this tag + its leader + its edge while held
  }
  const onTagMove = (e: ReactPointerEvent) => {
    const d = tagDrag.current
    if (!d) return
    e.stopPropagation()
    const dx = d.dx + (e.clientX - d.sx) / view.k
    const dy = d.dy + (e.clientY - d.sy) / view.k
    setTagOffset(o => ({ ...o, [d.id]: { dx, dy } }))
  }
  const onTagUp = (e: ReactPointerEvent) => {
    setActiveTag(null)
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

  // Selection highlight colour = the selected node's STATUS colour (not a fixed
  // accent), so a highlighted node border + its edges read as that node's state.
  const selColor = selected
    ? (STATUS[byId[selected]?.status ?? 'idle'] ?? STATUS.idle).color
    : 'var(--color-uikit-accent)'

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
            const d = buildEdgePath(from, to, { obstacles })
            const flow = edgeFlow(a.status, b.status)
            const spec = FLOW[flow]
            // Hot when the selected node is an endpoint, OR the held tag's pair is
            // this edge (press-and-hold a tag to trace its edge).
            const selHot = !!selected && (e.from === selected || e.to === selected)
            const tagHot = activeTag === `${e.from}->${e.to}`
            const hot = selHot || tagHot
            // Highlight in the RELEVANT colour, not a fixed accent: a selection
            // uses the selected node's status colour; a held tag uses its edge's
            // own flow colour (== spec.color, so no change needed there).
            const stroke = selHot ? selColor : spec.color
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

          {/* Param-tag leaders: a single straight dashed line from each tag's CENTRE
              to its edge-midpoint anchor. Drawn under the (opaque) tag, so it
              emerges from whichever side faces the anchor. Being one diagonal
              segment it can't run collinear with the axis-aligned edges → it never
              overlaps an inter-node edge. Tinted to match the edge. */}
          {pairTags.map(t => {
            if (Math.abs(t.off.dx) < 2 && Math.abs(t.off.dy) < 2) return null
            const dim = !!selected && t.from !== selected && t.to !== selected
            const active = activeTag === t.key
            return (
              <line
                key={`lead-${t.key}`}
                x1={t.tagX} y1={t.tagY} x2={t.anchorX} y2={t.anchorY}
                stroke={t.color}
                strokeWidth={active ? 1.4 : 0.8} strokeDasharray="2 2"
                opacity={active ? 1 : dim ? 0.2 : 0.55}
              />
            )
          })}
        </svg>

        {/* Param tags — one per node-pair, listing the params it transfers (each
            with a small leading dot, stacked). Styled to match the design's edge
            label: panel fill, 1px flow-colour border, rx3, a faint drop shadow,
            mono 9/600/.04em text in the flow colour. Auto-placed clear of nodes /
            other tags; drag to pin. Rendered BEFORE the nodes so a tag sits BELOW
            them in z-order (never covers a node). HTML so it's pointer-interactive
            (the svg is pointer-events:none). */}
        {pairTags.map(t => {
          const dim = !!selected && t.from !== selected && t.to !== selected
          const active = activeTag === t.key
          return (
            <div
              key={`tag-${t.key}`}
              onPointerDown={ev => onTagDown(ev, t.key, t.off)}
              onPointerMove={onTagMove}
              onPointerUp={onTagUp}
              onPointerCancel={onTagUp}
              style={{
                position: 'absolute',
                left: t.tagX, top: t.tagY,
                transform: 'translate(-50%, -50%)',
                opacity: dim ? 0.28 : 1,
                transition: 'opacity 160ms ease, box-shadow 120ms ease, border-color 120ms ease',
                display: 'flex', flexDirection: 'column', gap: TAG_ROWGAP,
                fontFamily: 'var(--font-uikit-mono)', fontSize: 9, fontWeight: 600,
                letterSpacing: '.04em', lineHeight: 1,
                padding: '2px 7px', borderRadius: 3,
                background: 'var(--color-uikit-panel, #fcfbf7)',
                // Held → emphasise in the edge's OWN flow colour (matching its
                // node-edge), with a colour ring — not the fixed accent.
                border: `${active ? 1.4 : 1}px solid ${t.color}`,
                boxShadow: active
                  ? `0 0 0 2px color-mix(in oklab, ${t.color} 30%, transparent), 0 1px 2px rgba(0,0,0,.10)`
                  : '0 1px 1px rgba(0,0,0,.06)',
                color: t.color,
                cursor: 'grab', userSelect: 'none',
              }}
            >
              {t.params.map((p, i) => (
                <span key={`${p}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                  <span style={{ width: 3, height: 3, borderRadius: 2, background: t.color, flexShrink: 0 }} />
                  {p}
                </span>
              ))}
            </div>
          )
        })}

        {nodes.map(n => (
          <PipeNode
            key={n.id}
            node={n}
            selected={n.id === selected}
            // Never fade non-selected nodes — selection reads via the status
            // border + shadow, not by dimming the rest of the graph.
            dimmed={false}
            onPointerDown={e => onNodeDown(e, n)}
            onPointerMove={onNodeMove}
            onPointerUp={e => onNodeUp(e, n)}
          />
        ))}
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
  // Border always reflects STATUS (design's statusBorders): a faint+status mix at
  // rest; the full status colour when selected (an idle node's status colour is
  // the neutral muted, so its selection border reads neutral — matching the
  // design). Never the fixed blue accent.
  const border = selected
    ? st.color
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

      {/* One input dot (left-centre) + one output dot (right-centre). The input
          param names are surfaced in the floating input tag, not beside the dot. */}
      {node.inputs.length > 0 && <PortDot dir="in" />}
      {node.outputs.length > 0 && <PortDot dir="out" />}
    </div>
  )
}

// The single 6px port dot, centred on the node's left (in) or right (out) edge.
function PortDot({ dir }: { dir: 'in' | 'out' }) {
  return (
    <span style={{
      position: 'absolute',
      top: NODE_H / 2 - 3,
      ...(dir === 'in' ? { left: -3 } : { right: -3 }),
      width: 6, height: 6, borderRadius: 3,
      background: 'var(--color-uikit-panel)',
      border: '1px solid var(--color-uikit-muted)',
    }} />
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
        right: 14, top: 12,
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
