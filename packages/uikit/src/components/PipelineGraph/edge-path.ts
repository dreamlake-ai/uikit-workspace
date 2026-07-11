/**
 * Edge geometry — a faithful port of the design prototype's routing.
 *
 * Shallow edges (endpoints nearly level) read best as a soft cubic curve;
 * anything with a real vertical jog uses ORTHOGONAL (Manhattan) routing with
 * rounded corners, and DETOURS around any node it would otherwise cut through.
 * This is what keeps dense graphs readable — lines bend around cards instead of
 * crossing them. Horizontal layout only (the tracer lays pipelines left→right).
 */
export type Pt = { x: number; y: number }
export type Obstacle = { x0: number; y0: number; x1: number; y1: number }

const R = 10    // corner radius
const PAD = 14  // detour gap from an obstacle edge
const CURVE_THRESHOLD = 30 // |Δy| below this → soft curve instead of orthogonal

/** Does the vertical segment at x=`xx` spanning [ya,yb] pass through an obstacle? */
function hitsV(obstacles: Obstacle[], ya: number, yb: number, xx: number): Obstacle | null {
  const lo = Math.min(ya, yb), hi = Math.max(ya, yb)
  for (const o of obstacles) {
    if (xx > o.x0 && xx < o.x1 && hi > o.y0 && lo < o.y1) return o
  }
  return null
}

/** SVG path `d` from an output port to an input port (design's PipeEdge). */
export function buildEdgePath(
  from: Pt,
  to: Pt,
  opts: { obstacles?: Obstacle[]; bendFrac?: number; bendX?: number } = {},
): string {
  const obstacles = opts.obstacles ?? []
  const bendFrac = opts.bendFrac ?? 0.5

  // Soft curve for shallow edges. (opts.bendX is intentionally ignored here —
  // a shallow soft-curve has no vertical jog to pin.)
  if (Math.abs(to.y - from.y) < CURVE_THRESHOLD) {
    const dx = Math.abs(to.x - from.x)
    return `M ${from.x} ${from.y} C ${from.x + dx * 0.5} ${from.y}, ${to.x - dx * 0.5} ${to.y}, ${to.x} ${to.y}`
  }

  // Orthogonal rounded routing, horizontal primary axis.
  // The vertical jog normally sits at bendFrac between the endpoints; an
  // explicit finite opts.bendX pins it to an absolute x instead. It's clamped
  // strictly inside [from.x, to.x] with a margin so the corner radii still fit,
  // and falls back to the computed value if that clamp would collapse the
  // usable range (endpoints too close to leave room).
  let bendX = from.x + (to.x - from.x) * bendFrac
  const bendXOverride = opts.bendX
  if (bendXOverride !== undefined && Number.isFinite(bendXOverride)) {
    const margin = R + 2
    const lo = Math.min(from.x, to.x) + margin
    const hi = Math.max(from.x, to.x) - margin
    bendX = lo <= hi ? Math.max(lo, Math.min(hi, bendXOverride)) : bendX
  }
  if (Math.abs(to.y - from.y) < 0.5) return `M ${from.x} ${from.y} L ${to.x} ${to.y}`

  const sgnY = Math.sign(to.y - from.y) || 1
  const dy = Math.abs(to.y - from.y)
  const r = Math.min(R, Math.abs(bendX - from.x), Math.abs(to.x - bendX), dy / 2)
  const backwards = to.x - from.x <= 8

  if (backwards) {
    // Inverted-S when the target sits behind the source. Center the middle
    // horizontal run in the channel between the two nodes' facing edges
    // (source right edge = from.x, target left edge = to.x) so the loop reads
    // as symmetric regardless of which input port (upper/lower) the target
    // uses — both turn columns are placed equidistant from the channel mid-x
    // rather than a fixed STUB from their own (asymmetric) endpoints, which
    // otherwise biases the run toward the single-output source's side.
    // (opts.bendX is intentionally ignored here — a backward loop has no single
    //  forward vertical jog to pin.)
    const STUB = 28
    const midX = (from.x + to.x) / 2
    const reach = Math.abs(from.x - to.x) / 2 + STUB
    const ax = midX + reach // right turn column, out past the source edge
    const bx = midX - reach // left turn column, out past the target edge
    const my = (from.y + to.y) / 2
    const r2 = Math.min(R, STUB / 2, dy / 4, Math.abs(ax - bx) / 2)
    return (
      `M ${from.x} ${from.y}` +
      ` L ${ax - r2} ${from.y}` +
      ` Q ${ax} ${from.y} ${ax} ${from.y + sgnY * r2}` +
      ` L ${ax} ${my - sgnY * r2}` +
      ` Q ${ax} ${my} ${ax - r2} ${my}` +
      ` L ${bx + r2} ${my}` +
      ` Q ${bx} ${my} ${bx} ${my + sgnY * r2}` +
      ` L ${bx} ${to.y - sgnY * r2}` +
      ` Q ${bx} ${to.y} ${bx + r2} ${to.y}` +
      ` L ${to.x} ${to.y}`
    )
  }

  // A pinned bendX also drives where we probe for obstacles: the jog is tested
  // (and, on a hit, detoured) around the pinned column rather than the default.
  const hit = hitsV(obstacles, from.y, to.y, bendX)
  if (hit) {
    // Route the vertical jog around the obstacle's nearer side.
    const leftX = hit.x0 - PAD
    const rightX = hit.x1 + PAD
    const detourX = Math.abs(bendX - leftX) < Math.abs(bendX - rightX) ? leftX : rightX
    const dxA = Math.min(R, Math.abs(detourX - from.x) / 2, Math.abs(detourX - to.x) / 2)
    const r2 = Math.min(dxA, dy / 2)
    return (
      `M ${from.x} ${from.y}` +
      ` L ${detourX - Math.sign(detourX - from.x) * r2} ${from.y}` +
      ` Q ${detourX} ${from.y} ${detourX} ${from.y + sgnY * r2}` +
      ` L ${detourX} ${to.y - sgnY * r2}` +
      ` Q ${detourX} ${to.y} ${detourX + Math.sign(to.x - detourX) * r2} ${to.y}` +
      ` L ${to.x} ${to.y}`
    )
  }

  // Simple single-jog L with rounded corners.
  return (
    `M ${from.x} ${from.y}` +
    ` L ${bendX - r} ${from.y}` +
    ` Q ${bendX} ${from.y} ${bendX} ${from.y + sgnY * r}` +
    ` L ${bendX} ${to.y - sgnY * r}` +
    ` Q ${bendX} ${to.y} ${bendX + r} ${to.y}` +
    ` L ${to.x} ${to.y}`
  )
}
