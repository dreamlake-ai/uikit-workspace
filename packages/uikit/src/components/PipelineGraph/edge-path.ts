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
  const lo = Math.min(ya, yb)
  const hi = Math.max(ya, yb)
  for (const o of obstacles) {
    if (xx > o.x0 && xx < o.x1 && hi > o.y0 && lo < o.y1) return o
  }
  return null
}

/** SVG path `d` from an output port to an input port (design's PipeEdge). */
export function buildEdgePath(
  from: Pt,
  to: Pt,
  opts: {
    obstacles?: Obstacle[]
    bendFrac?: number
    bendX?: number
    /** Optional out-param: receives the edge's LABEL ANCHOR — the jog elbow
     *  (tracking any detour), or the chord midpoint for curve/level/backward
     *  edges. Lets a connector tag ride the real line, detours included.
     *  `jog` is set ONLY when the routed line has a vertical segment at the
     *  anchor's x (the orthogonal / detour branches) — its [y0,y1] span. A
     *  vertical leader dropped from the anchor would double that segment, so a
     *  tag clamps its leader to the jog boundary. Curve / straight / backward
     *  edges leave it undefined: the anchor is a lone on-line point, so a leader
     *  runs straight to it. */
    out?: { anchor: Pt; jog?: { y0: number; y1: number } }
  } = {},
): string {
  const obstacles = opts.obstacles ?? []
  const bendFrac = opts.bendFrac ?? 0.5
  const setAnchor = (x: number, y: number) => { if (opts.out) opts.out.anchor = { x, y } }
  const setJog = (y0: number, y1: number) => { if (opts.out) opts.out.jog = { y0, y1 } }
  // "Backward": the target sits at or behind the source along the primary axis.
  // Such an edge MUST loop around with the inverted-S below — a soft curve or a
  // straight line would run straight back through both cards (only the
  // arrowhead would show). So the shallow-edge short-circuits are forward-only.
  const backwards = to.x - from.x <= 8

  // Soft curve for shallow FORWARD edges. (opts.bendX is intentionally ignored
  // here — a shallow soft-curve has no vertical jog to pin.)
  if (!backwards && Math.abs(to.y - from.y) < CURVE_THRESHOLD) {
    const dx = Math.abs(to.x - from.x)
    setAnchor((from.x + to.x) / 2, (from.y + to.y) / 2)
    return `M ${from.x} ${from.y} C ${from.x + dx * 0.5} ${from.y}, ${to.x - dx * 0.5} ${to.y}, ${to.x} ${to.y}`
  }

  const sgnY = Math.sign(to.y - from.y) || 1
  const dy = Math.abs(to.y - from.y)

  if (backwards) {
    // Loop back to a target behind the source: two turn columns just past each
    // end (ax/bx) joined by a crossing run. The run normally sits at the
    // cross-axis midpoint (a symmetric inverted-S), BUT if the endpoints are too
    // close in the cross axis the S self-overlaps into a flat line — so bulge
    // the run out to one side to keep the loop readable. This makes the loop
    // visible for a member dragged directly before its stage, where the swapped
    // cross-axis delta is ~0. (opts.bendX is ignored — no single jog to pin.)
    const STUB = 28
    const midX = (from.x + to.x) / 2
    const reach = Math.abs(from.x - to.x) / 2 + STUB
    const ax = midX + reach // right turn column, out past the source edge
    const bx = midX - reach // left turn column, out past the target edge
    const MIN = 30
    const my = Math.abs(to.y - from.y) >= 2 * MIN
      ? (from.y + to.y) / 2
      : Math.max(from.y, to.y) + MIN
    const d1 = Math.sign(my - from.y) || 1 // source-leg direction
    const d2 = Math.sign(to.y - my) || 1 // target-leg direction
    const r2 = Math.min(R, STUB / 2, Math.abs(my - from.y) / 2, Math.abs(to.y - my) / 2, Math.abs(ax - bx) / 2)
    setAnchor(midX, my)
    return (
      `M ${from.x} ${from.y}` +
      ` L ${ax - r2} ${from.y}` +
      ` Q ${ax} ${from.y} ${ax} ${from.y + d1 * r2}` +
      ` L ${ax} ${my - d1 * r2}` +
      ` Q ${ax} ${my} ${ax - r2} ${my}` +
      ` L ${bx + r2} ${my}` +
      ` Q ${bx} ${my} ${bx} ${my + d2 * r2}` +
      ` L ${bx} ${to.y - d2 * r2}` +
      ` Q ${bx} ${to.y} ${bx + r2} ${to.y}` +
      ` L ${to.x} ${to.y}`
    )
  }

  // Forward orthogonal rounded routing. The vertical jog normally sits at
  // bendFrac between the endpoints; an explicit finite opts.bendX pins it to an
  // absolute x instead, clamped strictly inside [from.x, to.x] with a margin so
  // the corner radii still fit (falling back to the computed value if that
  // clamp would collapse the usable range).
  let bendX = from.x + (to.x - from.x) * bendFrac
  const bendXOverride = opts.bendX
  if (bendXOverride !== undefined && Number.isFinite(bendXOverride)) {
    const margin = R + 2
    const lo = Math.min(from.x, to.x) + margin
    const hi = Math.max(from.x, to.x) - margin
    bendX = lo <= hi ? Math.max(lo, Math.min(hi, bendXOverride)) : bendX
  }
  if (dy < 0.5) { setAnchor((from.x + to.x) / 2, (from.y + to.y) / 2); return `M ${from.x} ${from.y} L ${to.x} ${to.y}` }
  const r = Math.min(R, Math.abs(bendX - from.x), Math.abs(to.x - bendX), dy / 2)

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
    setAnchor(detourX, (from.y + to.y) / 2)
    setJog(Math.min(from.y, to.y), Math.max(from.y, to.y))
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
  setAnchor(bendX, (from.y + to.y) / 2)
  setJog(Math.min(from.y, to.y), Math.max(from.y, to.y))
  return (
    `M ${from.x} ${from.y}` +
    ` L ${bendX - r} ${from.y}` +
    ` Q ${bendX} ${from.y} ${bendX} ${from.y + sgnY * r}` +
    ` L ${bendX} ${to.y - sgnY * r}` +
    ` Q ${bendX} ${to.y} ${bendX + r} ${to.y}` +
    ` L ${to.x} ${to.y}`
  )
}
