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
import { buildEdgePath, pickSides, type Obstacle, type PortSide, type Pt } from './edge-path'
import { restingOffsets, type Rect, type TagProbe } from './tag-place'

/**
 * Clearance kept between a lifted connector tag and a node card, in world px.
 * The tag is placed outside the card's area by this much rather than merely
 * not overlapping it — "close" should never read as "touching".
 */
const TAG_CARD_GAP = 8

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
  /** Which card faces a connector leaves and arrives on.
   *
   *  `'flow'` (the default) is the historical behaviour: every edge leaves
   *  through the source's right face and arrives on the target's left face, so
   *  a target sitting behind its source gets a full loop-back around both
   *  cards. `'auto'` lets each edge pick its faces from the geometry — top or
   *  bottom when the target is behind, or when the vertical offset dominates —
   *  which turns most of those loop-backs into a short jog.
   *
   *  Opt-in on purpose: it changes the shape of already-published figures, so
   *  it is a choice the embedder makes rather than one that lands on them. */
  edgeSides?: 'flow' | 'auto'
  className?: string
}

/**
 * The arrowhead at an edge's arrival port, oriented to the face it lands on.
 *
 * It used to be two hardcoded +x barbs, which was correct only because every
 * edge arrived from the left. Now that a connector can arrive on any face, the
 * head is built from the face's inward normal: pulled `GAP` back off the 6 px
 * input dot (radius 3 + 1) so the tip hugs it without overlapping, with the
 * barbs 6 px behind the tip and 4 px to either side.
 */
function arrowHead(to: Pt, side: PortSide): string {
  const GAP = 4
  // Inward normal — the direction the line is travelling as it arrives.
  const n: Pt =
    side === 'left' ? { x: 1, y: 0 } :
    side === 'right' ? { x: -1, y: 0 } :
    side === 'top' ? { x: 0, y: 1 } : { x: 0, y: -1 }
  const p: Pt = { x: -n.y, y: n.x }
  const tip: Pt = { x: to.x - n.x * GAP, y: to.y - n.y * GAP }
  const back: Pt = { x: tip.x - n.x * 6, y: tip.y - n.y * 6 }
  return `M ${back.x + p.x * 4} ${back.y + p.y * 4} L ${tip.x} ${tip.y} L ${back.x - p.x * 4} ${back.y - p.y * 4}`
}

/**
 * The two port points and two card rects for one edge, in ONE place.
 *
 * All three consumers — the drawn path, the frozen tag-avoidance pass and the
 * live tag anchor — must agree exactly, or a tag drifts off the line it is
 * supposed to ride. They used to agree by three copies of the same two
 * `portPos` calls; now that a side can vary per edge, they agree by
 * construction instead.
 */
function edgeEnds(a: GraphNode, b: GraphNode, auto: boolean): {
  from: Pt; to: Pt
  fromRect: Obstacle; toRect: Obstacle
  fromSide?: PortSide; toSide?: PortSide
} {
  const rect = (n: GraphNode): Obstacle => ({
    x0: n.pos.x, y0: n.pos.y, x1: n.pos.x + NODE_W, y1: n.pos.y + NODE_H,
  })
  const centre = (n: GraphNode): Pt => ({ x: n.pos.x + NODE_W / 2, y: n.pos.y + NODE_H / 2 })
  const fromRect = rect(a)
  const toRect = rect(b)
  if (!auto) {
    return { from: portPos(a, '', 'out'), to: portPos(b, '', 'in'), fromRect, toRect }
  }
  const { fromSide, toSide } = pickSides(centre(a), centre(b), 'horizontal')
  return {
    from: portPos(a, '', 'out', fromSide),
    to: portPos(b, '', 'in', toSide),
    fromRect, toRect, fromSide, toSide,
  }
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
// toPorts). Placement + drag are IDENTICAL to WorkflowCanvas: the tag rests on
// its edge's routed jog/detour point (buildEdgePath's `out` anchor, so it always
// sits ON the drawn line), dragging it ALONG the edge rebends the edge (bendFrac)
// and ACROSS it lifts the tag onto a dashed leader (labelOffset).
const TAG_ROWGAP = 3       // vertical gap between stacked param rows

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

export function PipelineGraph({
  graph, statusById, selectedNodeId, onSelectNode, showControls = true,
  edgeSides = 'flow', className,
}: PipelineGraphProps) {
  const autoSides = edgeSides === 'auto'
  useInjectedStyles()

  const [internalSel, setInternalSel] = useState<string | null>(null)
  const selected = selectedNodeId !== undefined ? selectedNodeId : internalSel
  const select = useCallback((id: string | null) => {
    if (selectedNodeId === undefined) setInternalSel(id)
    onSelectNode?.(id)
  }, [selectedNodeId, onSelectNode])

  const [view, setView] = useState<View>({ x: 28, y: 20, k: 1 })
  const [posOverride, setPosOverride] = useState<Record<string, { x: number; y: number }>>({})
  // Per-pair connector-tag interaction — identical to WorkflowCanvas: dragging a
  // tag along the edge axis rebends its edge (bendFracs, fed to buildEdgePath);
  // dragging across it lifts the tag onto a dashed leader (labelOffsets, world
  // px). A tag always rests on its edge's routed jog/detour anchor (see pairTags).
  const [bendFracs, setBendFracs] = useState<Record<string, number>>({})
  const [labelOffsets, setLabelOffsets] = useState<Record<string, number>>({})
  // The pair key of the tag currently pressed/held — highlights that tag, its
  // leader, and the edge its anchor sits on. Cleared on pointer up / cancel.
  const [activeTag, setActiveTag] = useState<string | null>(null)
  // Last resting-lift pass, fed back in as hysteresis so a tag holds a lift
  // that still works instead of re-searching (and possibly flipping sides)
  // every frame of a node drag.
  const prevRest = useRef<Record<string, number>>({})
  // Reset drag state on load / version change.
  useEffect(() => {
    setPosOverride({})
    setBendFracs({})
    setLabelOffsets({})
    setActiveTag(null)
    // Drop the avoidance hysteresis too — carrying a previous graph's lifts in
    // would hold tags off the line for edges that no longer exist.
    prevRest.current = {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph.id])

  const containerRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null)
  const nodeDrag = useRef<{ id: string; sx: number; sy: number; bx: number; by: number; moved: boolean } | null>(null)
  const tagDrag = useRef<{ id: string; sx: number; sy: number; startFrac: number; startOff: number; span: number; vertical: boolean } | null>(null)

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

  // LIVE card-avoidance: the resting perpendicular LIFT for each tag, refreshed
  // whenever the nodes move. A tag defaults to sitting ON its connector and
  // lifts clear only while a card is close enough to touch it — so pulling two
  // nodes together pushes the tag out of the way, and pulling them apart drops
  // it back on the line.
  //
  // This deliberately re-runs on node drags. It used to be frozen at load
  // (keyed on `graph.id`) to stop siblings reshuffling mid-drag, but that also
  // meant the avoidance never reacted to the layout it was avoiding: drag two
  // cards together and the tag stayed at its stale lift, sitting on top of a
  // card. `restingOffsets` handles the churn the freeze was working around —
  // it holds a tag's previous lift while that lift is still clear, so nothing
  // flip-flops — and it never touches a tag the user has dragged.
  const restOffsets = useMemo(() => {
    const cards: Rect[] = nodes.map(n => ({ x: n.pos.x, y: n.pos.y, w: NODE_W, h: NODE_H }))
    const probes: TagProbe[] = []
    for (const g of groupEdgeParams(graph.edges).values()) {
      const src = byId[g.from]; const dst = byId[g.to]
      if (!src || !dst || g.params.length === 0) continue
      const key = `${g.from}->${g.to}`
      const ends = edgeEnds(src, dst, autoSides)
      const { from: fromP, to: toP } = ends
      const obstacles: Obstacle[] = nodes
        .filter(n => n.id !== g.from && n.id !== g.to)
        .map(n => ({ x0: n.pos.x - 4, x1: n.pos.x + NODE_W + 4, y0: n.pos.y - 4, y1: n.pos.y + NODE_H + 4 }))
      // Probe at the tag's LIVE bend, not a fixed mid-edge 0.5 — otherwise a
      // rebent edge is avoided at a point its tag no longer occupies.
      const frac = bendFracs[key] ?? 0.5
      const vertical = ends.fromSide === 'top' || ends.fromSide === 'bottom'
      const span = vertical ? toP.y - fromP.y : toP.x - fromP.x
      const probe: { anchor: Pt } = {
        anchor: { x: fromP.x + (vertical ? 0 : span * frac), y: (fromP.y + toP.y) / 2 },
      }
      buildEdgePath(fromP, toP, {
        obstacles, bendFrac: frac, out: probe,
        fromRect: ends.fromRect, toRect: ends.toRect,
        fromSide: ends.fromSide, toSide: ends.toSide,
      })
      const longest = g.params.reduce((m, p) => Math.max(m, p.length), 0)
      probes.push({ key, anchor: probe.anchor, boxW: longest * 5.6 + 22, boxH: g.params.length * 12 + 2 })
    }
    const offs = restingOffsets(probes, cards, labelOffsets, prevRest.current, 'y', TAG_CARD_GAP)
    prevRest.current = offs
    return offs
  }, [nodes, graph.edges, byId, bendFracs, labelOffsets, autoSides])

  // Per-edge param tags — one per node-pair (A→B), listing the params it transfers
  // (edge toPorts). Anchored ON its edge's routed jog/detour point (buildEdgePath's
  // `out`, so it tracks both nodes, detours and rebends live). The perpendicular
  // lift is the user's across-drag (labelOffsets) if touched, else the live
  // card-avoidance offset (restOffsets) — one value, so grabbing never teleports.
  const pairTags = useMemo(() => {
    const out: Array<{
      key: string; from: string; to: string; params: string[]
      tagX: number; tagY: number; leaderY: number
      span: number; vertical: boolean; hasLeader: boolean; color: string
    }> = []
    for (const g of groupEdgeParams(graph.edges).values()) {
      const src = byId[g.from]; const dst = byId[g.to]
      if (!src || !dst || g.params.length === 0) continue
      const key = `${g.from}->${g.to}`
      const ends = edgeEnds(src, dst, autoSides)
      const { from: fromP, to: toP } = ends
      // Which way does this edge actually run? With `edgeSides='auto'` a
      // top/bottom pair routes vertically, and then the bend parameter advances
      // along world *y*, not world *x*. Measuring the span on the wrong axis
      // gives a near-zero denominator for a vertical edge, so the drag either
      // does nothing or snaps straight to a clamp.
      const vertical = ends.fromSide === 'top' || ends.fromSide === 'bottom'
      const span = vertical ? toP.y - fromP.y : toP.x - fromP.x
      const frac = bendFracs[key] ?? 0.5
      const off = labelOffsets[key] ?? restOffsets[key] ?? 0
      // Idle edges render muted (not the faint --edge-idle) — matching the edge
      // line's own idle treatment below — so the filled tag pill stays legible
      // on the dark panel instead of washing out (~1.5:1 in dark).
      const flow = edgeFlow(src.status, dst.status)
      const color = flow === 'idle' ? 'var(--color-uikit-muted)' : FLOW[flow].color
      // Anchor the tag ON the actual routed edge — buildEdgePath reports its
      // jog/detour point via `out` (the SAME obstacle-avoidance the drawn edge
      // uses), so the tag and its leader always sit on the line, detours
      // included. The anchor tracks the bendFrac live, so a touched tag rides
      // the bend and an untouched one already sits on the jog (no teleport on
      // grab). Identical to WorkflowCanvas's bend-capable tags.
      const obstacles: Obstacle[] = nodes
        .filter(n => n.id !== g.from && n.id !== g.to)
        .map(n => ({ x0: n.pos.x - 4, x1: n.pos.x + NODE_W + 4, y0: n.pos.y - 4, y1: n.pos.y + NODE_H + 4 }))
      const probe: { anchor: Pt; jog?: { y0: number; y1: number } } = {
        anchor: { x: fromP.x + span * frac, y: (fromP.y + toP.y) / 2 },
      }
      buildEdgePath(fromP, toP, {
        obstacles, bendFrac: frac, out: probe,
        fromRect: ends.fromRect, toRect: ends.toRect,
        fromSide: ends.fromSide, toSide: ends.toSide,
      })
      const ax = probe.anchor.x
      const tagY = probe.anchor.y + off
      // The leader is vertical at ax. When the routed edge has a vertical JOG at
      // ax (orthogonal / detour — buildEdgePath reports its [y0,y1] span), draw
      // the leader only from where it LEAVES the jog to the tag, so it never
      // doubles the edge line (and is hidden while the tag sits within the jog).
      // A CURVE / straight / backward edge has NO such vertical segment — its
      // anchor is a lone point ON the line — so the leader runs straight to the
      // anchor; clamping to the ports' y would stop it short and leave the tag
      // floating off the curve (the bug the design doesn't have).
      const leaderY = probe.jog
        ? (tagY < probe.jog.y0 ? probe.jog.y0 : tagY > probe.jog.y1 ? probe.jog.y1 : tagY)
        : probe.anchor.y
      out.push({
        key, from: g.from, to: g.to, params: g.params,
        tagX: ax, tagY, leaderY, span, vertical,
        hasLeader: Math.abs(tagY - leaderY) > 0.5, color,
      })
    }
    return out
  }, [nodes, graph.edges, byId, bendFracs, labelOffsets, restOffsets, autoSides])

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

  // — tag drag (mirrors WorkflowCanvas): dragging ALONG the edge axis (x) rebends
  //   its edge (bendFrac); dragging ACROSS it (y) lifts the tag onto a dashed
  //   leader (labelOffset, snapping back within 3px). stopPropagation keeps the
  //   canvas/nodes from also dragging. —
  const onTagDown = (e: ReactPointerEvent, t: { key: string; span: number; vertical?: boolean }) => {
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    tagDrag.current = {
      id: t.key, sx: e.clientX, sy: e.clientY,
      startFrac: bendFracs[t.key] ?? 0.5, startOff: labelOffsets[t.key] ?? restOffsets[t.key] ?? 0, span: t.span,
      vertical: t.vertical ?? false,
    }
    setActiveTag(t.key)   // highlight this tag + its leader + its edge while held
  }
  const onTagMove = (e: ReactPointerEvent) => {
    const d = tagDrag.current
    if (!d) return
    e.stopPropagation()
    // The bend runs ALONG the edge and the lift runs ACROSS it, so which
    // pointer axis is which depends on how the edge is routed. A top/bottom
    // pair (edgeSides='auto') runs vertically, and there the roles swap.
    const px = (e.clientX - d.sx) / view.k
    const py = (e.clientY - d.sy) / view.k
    const along = d.vertical ? py : px
    const across = d.vertical ? px : py
    if (Math.abs(d.span) > 1) {
      const next = Math.max(0.1, Math.min(0.9, d.startFrac + along / d.span))
      setBendFracs(o => ({ ...o, [d.id]: next }))
    }
    let off = Math.max(-400, Math.min(400, d.startOff + across))
    if (Math.abs(off) <= 3) off = 0   // snap back onto the line
    setLabelOffsets(o => ({ ...o, [d.id]: off }))
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

  // Paint order: a highlighted (hot) edge must sit ABOVE the dimmed ones, or an
  // overlapping neighbour drawn later occludes it (SVG paints in document order).
  // Stable-sort the hot edges to the end so they render last; carry the original
  // index so keys stay stable. Only reorders while something is selected/held.
  const isEdgeHot = (e: GraphEdge) =>
    (!!selected && (e.from === selected || e.to === selected)) ||
    activeTag === `${e.from}->${e.to}`
  const orderedEdges = graph.edges.map((e, i) => ({ e, i }))
  if (selected || activeTag) {
    orderedEdges.sort((a, b) => (isEdgeHot(a.e) ? 1 : 0) - (isEdgeHot(b.e) ? 1 : 0))
  }

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
          {orderedEdges.map(({ e, i }) => {
            const a = byId[e.from]
            const b = byId[e.to]
            if (!a || !b) return null
            const ends = edgeEnds(a, b, autoSides)
            const obstacles: Obstacle[] = nodes
              .filter(n => n.id !== e.from && n.id !== e.to)
              .map(n => ({ x0: n.pos.x - 4, x1: n.pos.x + NODE_W + 4, y0: n.pos.y - 4, y1: n.pos.y + NODE_H + 4 }))
            const frac = bendFracs[`${e.from}->${e.to}`] ?? 0.5
            // The edge's OWN two cards go in as fromRect/toRect, not obstacles:
            // the line has to land on their ports, so it must not be detoured
            // around them — but the router still needs them to keep the line
            // out of their bodies. Filtering them out of `obstacles` and then
            // never mentioning them again is the defect this fixes.
            const d = buildEdgePath(ends.from, ends.to, {
              obstacles, bendFrac: frac,
              fromRect: ends.fromRect, toRect: ends.toRect,
              fromSide: ends.fromSide, toSide: ends.toSide,
            })
            const flow = edgeFlow(a.status, b.status)
            const spec = FLOW[flow]
            // Hot when the selected node is an endpoint, OR the held tag's pair is
            // this edge (press-and-hold a tag to trace its edge).
            const selHot = !!selected && (e.from === selected || e.to === selected)
            const tagHot = activeTag === `${e.from}->${e.to}`
            const hot = selHot || tagHot
            // Fade the rest when a node is selected OR a tag is held, so the hot
            // edge reads the same in both cases (thicker, full-colour, others pale).
            const dim = (!!selected || !!activeTag) && !hot
            // A `mask` edge is a gate/filter, not data flow. In the settled
            // states (idle / ok) it stays DASHED whether or not it's selected.
            const maskGate = e.kind === 'mask' && (flow === 'idle' || flow === 'ok')
            const dash = maskGate ? '4 4' : spec.dash
            // SOLID colours only — never opacity — so overlapping lines can't
            // stack up and darken. idle → the design's warm grey (--edge-idle,
            // carried by spec.color); a dimmed edge → a solid pale tint of its
            // colour; a mask gate → a slightly paler solid (its "fainter" cue
            // without the alpha). A selection highlights in the node's status colour.
            const baseColor = spec.color
            // A held tag highlights its edge in the edge's OWN colour, deepened —
            // an idle edge's faint grey goes to muted (matching the shade an
            // idle-node selection uses), so it reads as highlighted.
            const hotColor = flow === 'idle' ? 'var(--color-uikit-muted)' : spec.color
            const stroke = selHot
              ? selColor
              : tagHot
                ? hotColor
                : dim
                  ? `color-mix(in srgb, ${baseColor} 42%, var(--color-uikit-panel))`
                  : maskGate && !hot
                    ? `color-mix(in srgb, ${baseColor} 62%, var(--color-uikit-panel))`
                    : baseColor
            // One thin weight, kept below the 1.5px card border so border and
            // connectors read consistently (border slightly heavier).
            const width = hot ? 1.5 : Math.min(spec.width, 1.4)
            // Pull the arrowhead back off the 6px input dot so its tip hugs it
            // without overlap. The dot is drawn in world coords centred exactly
            // on `to`, so GAP = radius(3) + 1 lands the tip 1px off its edge.
            // The line still runs to the port, hidden by the dot / card.
            return (
              <g key={i}>
                <path
                  d={d} fill="none" stroke={stroke} strokeWidth={width}
                  strokeLinecap="round" strokeDasharray={dash}
                  className={hot ? undefined : spec.anim}
                />
                <path
                  d={arrowHead(ends.to, ends.toSide ?? 'left')}
                  fill="none" stroke={stroke} strokeWidth={width}
                  strokeLinecap="round" strokeLinejoin="round"
                />
              </g>
            )
          })}

          {/* Param-tag leaders: a straight dashed line from a lifted tag down to
              the point where it LEAVES its edge's jog — clipped so it never
              doubles (overlaps) the collinear vertical jog. Tinted to the edge. */}
          {pairTags.map(t => {
            if (!t.hasLeader) return null
            const dim = !!selected && t.from !== selected && t.to !== selected
            const active = activeTag === t.key
            return (
              <line
                key={`lead-${t.key}`}
                x1={t.tagX} y1={t.tagY} x2={t.tagX} y2={t.leaderY}
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
              onPointerDown={ev => onTagDown(ev, t)}
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

        {/* Port dots — world coords at the exact port anchor, so the edge lines
            and arrowheads point at their centres (drawn above the cards). */}
        {nodes.map(n => {
          const inA = n.inputs.length > 0 ? portPos(n, '', 'in') : null
          const outA = n.outputs.length > 0 ? portPos(n, '', 'out') : null
          return (
            <span key={`dots-${n.id}`}>
              {inA && <PortDot x={inA.x} y={inA.y} />}
              {outA && <PortDot x={outA.x} y={outA.y} />}
            </span>
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
        // A touch heavier than the edge lines (~1.4px) so card outline and
        // connectors read at one consistent weight (WorkflowCanvas parity).
        border: `1.5px solid ${border}`,
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
      {/* Port dots are drawn separately, in world coords (see PortDot), so they
          land on the exact edge endpoints — the card only holds the text. */}
    </div>
  )
}

// The single 6px port dot, centred on the port anchor in WORLD coords (not a
// child of the card) so the edge lines / arrowheads point at its centre —
// matching WorkflowCanvas's port markers.
function PortDot({ x, y }: { x: number; y: number }) {
  return (
    <span style={{
      position: 'absolute',
      left: x - 3, top: y - 3,
      width: 6, height: 6, borderRadius: 3,
      background: 'var(--color-uikit-panel)',
      border: '1px solid var(--color-uikit-muted)',
      pointerEvents: 'none',
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
