/**
 * Visual language for the pipeline graph — kind colours, node status, and the
 * derived edge "flow" states. Ported from the DreamLake Studio design
 * prototype (pipelines-canvas.jsx). Colours use uikit tone tokens so they
 * adapt to light/dark automatically.
 */
import {
  Archive, Box, Database, Eye, Filter, GitMerge, Sparkles, SquareFunction,
  type LucideIcon,
} from 'lucide-react'
import type { PortSide } from './edge-path'
import type { NodeKind, NodeStatus } from './types'

// Node card size (design: 156 × 72).
export const NODE_W = 156
export const NODE_H = 72
// Fixed spacing between adjacent port dots, clustered at the node's centre.
export const PORT_GAP = 15

/** Kind → CSS colour (uikit tone token, theme-aware). Still what the THUMB
 *  (PipelineThumb) tints its 7px kind square with — a glyph is illegible at
 *  thumbnail scale, so the shrunk card keeps the dot. The live canvas card no
 *  longer uses it; see KIND_ICON. */
const KIND_TOKEN: Record<string, string> = {
  source: 'var(--color-uikit-tone-green)',
  transform: 'var(--color-uikit-tone-blue)',
  model: 'var(--color-uikit-tone-purple)',
  filter: 'var(--color-uikit-tone-amber)',
  merge: 'var(--color-uikit-tone-warm-gray)',
  sink: 'var(--color-uikit-tone-red)',
  review: 'var(--color-uikit-tone-purple)',
}
export const kindColor = (k: NodeKind): string =>
  KIND_TOKEN[k] ?? 'var(--color-uikit-muted)'

/** Kind → lucide icon (WorkflowCanvas's WF_KIND_ICON convention). TYPE is
 *  carried by the icon SHAPE, so colour stays free to mean run STATUS — the
 *  card's leading glyph is this icon tinted by `status` rather than a
 *  kind-coloured dot that collides with the status palette.
 *
 *  Every glyph here is distinct from WorkflowCanvas's set (Layers / Cpu / Bot /
 *  Shuffle / GitBranch, plus the control subtypes Diamond / Pause / RotateCcw /
 *  Split) — the two views share one canvas vocabulary, so a repeated glyph would
 *  claim two different node types.
 *
 *  `transform` is SquareFunction — the boxed `f`. It started as Cpu, which was an
 *  exact duplicate of `compute`, and the arrow pair (ArrowRightLeft) that read
 *  cleanest at 13px lands in the same two-arrows family as `sampler`'s Shuffle.
 *  The boxed `f` says what the node IS (a `@ls.udf` stage is a function), sits in
 *  the boxed-glyph family with Database / Archive, and collides with nothing in
 *  either view. It is the most detailed glyph in the set, so if the card glyph
 *  size ever drops below 13px this is the one to re-check first. */
const KIND_ICON: Record<string, LucideIcon> = {
  source: Database,
  transform: SquareFunction,
  model: Sparkles,
  filter: Filter,
  merge: GitMerge,
  sink: Archive,
  review: Eye,
}
/** `NodeKind` is open (`string & {}`) — a udf can declare any category — so an
 *  unrecognised kind falls back to the neutral generic-node glyph rather than
 *  rendering nothing. */
export const kindIcon = (k: NodeKind): LucideIcon => KIND_ICON[k] ?? Box

/** The canonical kinds, in the order the canvas legend lists them (source →
 *  sink, review last). Kinds outside this list are appended by the legend in
 *  first-seen order. */
export const KIND_ORDER: readonly string[] = [
  'source', 'transform', 'model', 'filter', 'merge', 'sink', 'review',
]

/** Node status → dot colour + label. */
export const STATUS: Record<NodeStatus, { label: string; color: string }> = {
  idle: { label: 'idle', color: 'var(--color-uikit-muted)' },
  running: { label: 'running', color: 'var(--color-uikit-tone-blue)' },
  // Human-in-the-loop pause (serving a labeling UI) — purple, not the running blue.
  waiting: { label: 'waiting', color: 'var(--color-uikit-tone-purple)' },
  ok: { label: 'ok', color: 'var(--color-uikit-tone-green)' },
  error: { label: 'error', color: 'var(--color-uikit-tone-red)' },
  stale: { label: 'stale', color: 'var(--color-uikit-tone-amber)' },
}

/** The six edge flow states — colour, width, dash pattern, and the CSS
 *  animation class (injected by the component). Matches the design legend. */
export type EdgeFlow = 'running' | 'queued' | 'stalled' | 'error' | 'ok' | 'idle'

export const FLOW: Record<EdgeFlow, {
  label: string
  color: string
  width: number
  dash?: string
  anim?: string
}> = {
  running: { label: 'running', color: 'var(--color-uikit-tone-blue)', width: 1.8, dash: '6 5', anim: 'dl-edge-flow' },
  queued: { label: 'queued', color: 'var(--color-uikit-tone-warm-gray)', width: 1.4, dash: '3 6', anim: 'dl-edge-queued' },
  stalled: { label: 'stalled', color: 'var(--color-uikit-tone-amber)', width: 1.4, dash: '5 4', anim: 'dl-edge-stalled' },
  error: { label: 'error', color: 'var(--color-uikit-tone-red)', width: 1.6, dash: '2 4' },
  ok: { label: 'ok', color: 'var(--color-uikit-tone-green)', width: 1.4 },
  // The design's warm idle grey (#9c907a light / #5a5560 dark), theme-aware via
  // the --edge-idle token — used for idle edges, their dashed variants, and the
  // tag→edge leaders in both PipelineGraph and WorkflowCanvas.
  idle: { label: 'idle', color: 'var(--color-uikit-edge-idle)', width: 1.4 },
}

/**
 * Derive an edge's flow from its endpoints' status (design's `edgeFlow`).
 *   src running                → 'running'  (data is flowing now)
 *   src ok, dst running        → 'running'  (the edge is being read)
 *   src ok, dst idle           → 'queued'   (waiting for downstream)
 *   src or dst error           → 'error'
 *   src stale                  → 'stalled'
 *   src ok, dst ok             → 'ok'
 *   default                    → 'idle'
 */
export function edgeFlow(src: NodeStatus | undefined, dst: NodeStatus | undefined): EdgeFlow {
  if (src === 'error' || dst === 'error') return 'error'
  if (src === 'running') return 'running'
  if (dst === 'running' && src === 'ok') return 'running'
  if (src === 'stale') return 'stalled'
  if (src === 'ok' && (dst === 'idle' || dst == null)) return 'queued'
  if (src === 'ok' && dst === 'ok') return 'ok'
  return 'idle'
}

/**
 * Offset (from the node's top-left corner) of a port dot along the node edge.
 * Horizontal layout → ports on left/right edges, spaced along Y. Ports are
 * clustered at a fixed PORT_GAP around the node's centre (shrinking only when
 * too many would overflow the 12px padding). The 6px dot's top-left is
 * returned. (Design's `portAlong`.)
 */
export function portAlong(count: number, idx: number, vertical = false): number {
  const full = vertical ? NODE_W : NODE_H
  if (count <= 1) return full / 2 - 3
  const gap = Math.min(PORT_GAP, (full - 12) / (count - 1))
  const start = full / 2 - (gap * (count - 1)) / 2
  return start + idx * gap - 3
}

/** Absolute canvas position of a node's single input / output dot. Every param
 *  now shares ONE dot per side (the parameter list is surfaced in the per-node
 *  input tag instead), so this is the edge-centre — all edges into a node
 *  converge on the left-centre dot, all edges out share the right-centre dot.
 *  `port` is accepted for call-site compatibility but no longer affects position.
 *
 *  `face` chooses which side of the card the dot sits on. Historically this was
 *  a `vertical` boolean whose branch was dead — no call site ever passed it —
 *  which is a large part of why an edge could only ever leave to the right and
 *  arrive from the left, loop-backs and all. It now also accepts an explicit
 *  `PortSide`, so a caller that has looked at the geometry (see `pickSides`) can
 *  route an edge out through the top or bottom instead. Passing nothing keeps
 *  the historical left/right faces, so no existing render changes. */
export function portPos(
  node: { pos: { x: number; y: number } },
  _port: string,
  dir: 'in' | 'out',
  face: boolean | PortSide = false,
): { x: number; y: number } {
  const side: PortSide = typeof face === 'string'
    ? face
    : face
      ? (dir === 'in' ? 'top' : 'bottom')
      : (dir === 'in' ? 'left' : 'right')
  const { x, y } = node.pos
  switch (side) {
    case 'top': return { x: x + NODE_W / 2, y }
    case 'bottom': return { x: x + NODE_W / 2, y: y + NODE_H }
    case 'right': return { x: x + NODE_W, y: y + NODE_H / 2 }
    default: return { x, y: y + NODE_H / 2 }
  }
}
