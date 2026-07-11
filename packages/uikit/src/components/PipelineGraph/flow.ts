/**
 * Visual language for the pipeline graph — kind colours, node status, and the
 * derived edge "flow" states. Ported from the DreamLake Studio design
 * prototype (pipelines-canvas.jsx). Colours use uikit tone tokens so they
 * adapt to light/dark automatically.
 */
import type { NodeKind, NodeStatus } from './types'

// Node card size (design: 156 × 72).
export const NODE_W = 156
export const NODE_H = 72
// Fixed spacing between adjacent port dots, clustered at the node's centre.
export const PORT_GAP = 15

/** Kind → CSS colour (uikit tone token, theme-aware). */
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

/** Node status → dot colour + label. */
export const STATUS: Record<NodeStatus, { label: string; color: string }> = {
  idle: { label: 'idle', color: 'var(--color-uikit-muted)' },
  running: { label: 'running', color: 'var(--color-uikit-tone-blue)' },
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
  // A visible-but-quiet foreground grey (NOT a surface token) so idle edges read.
  idle: { label: 'idle', color: 'var(--color-uikit-ink-50)', width: 1.4 },
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

/** Absolute canvas position of a named port. Pure: each port in `inputs` /
 *  `outputs` gets a dot, positioned by its index in that list. The tracer emits
 *  a single output port (`['out']`) — one dot — so nothing special-cases here. */
export function portPos(
  node: { pos: { x: number; y: number }; inputs: string[]; outputs: string[] },
  port: string,
  dir: 'in' | 'out',
  vertical = false,
): { x: number; y: number } {
  const list = dir === 'in' ? node.inputs : node.outputs
  const along = portAlong(list.length, Math.max(list.indexOf(port), 0), vertical) + 3
  if (vertical) {
    return { x: node.pos.x + along, y: dir === 'in' ? node.pos.y : node.pos.y + NODE_H }
  }
  return {
    x: dir === 'in' ? node.pos.x : node.pos.x + NODE_W,
    y: node.pos.y + along,
  }
}
