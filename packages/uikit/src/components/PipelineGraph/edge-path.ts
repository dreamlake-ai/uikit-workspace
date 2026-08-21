/**
 * Edge geometry — a faithful port of the design prototype's routing.
 *
 * Shallow edges (endpoints nearly level) read best as a soft cubic curve;
 * anything with a real vertical jog uses ORTHOGONAL (Manhattan) routing with
 * rounded corners, and DETOURS around any node it would otherwise cut through.
 * This is what keeps dense graphs readable — lines bend around cards instead of
 * crossing them.
 *
 * ## The router must be told about its own endpoint cards
 *
 * For a long time it was not, and that is the whole story behind the bug
 * reported as "if a connector has no tags, it can bend through the starting
 * node". No branch here reads a tag, and none ever did. Tags mattered only
 * because dragging a tag pill is the ONLY channel through which a `bendFrac`
 * reaches this function — so an untagged connector is pinned at `bendFrac = 0.5`
 * with no user recourse, and the untagged ones are simply the survivors of a
 * geometry defect that the tagged ones got hand-dragged out of.
 *
 * The defect was structural: the callers filtered the edge's own two cards OUT
 * of `obstacles` (correctly — the path has to REACH their ports, so it must not
 * be detoured around them), which left this function with two bare points and
 * no idea where the cards it was cutting through actually were. It then placed
 * the backwards loop's crossing run a hardcoded 30 px below a port that sits at
 * the card's mid-height — 6 px inside a 72 px card — and computed an obstacle
 * detour column with no clamp at all, so a detour could travel in −x straight
 * back out of the source's own output port and across its title.
 *
 * The fix is `fromRect` / `toRect`: the endpoint cards arrive as a SEPARATE
 * channel from `obstacles`, so every branch can measure clearance against them
 * without the detour logic trying to route around the very cards it must land
 * on. When a caller passes nothing we synthesise a standard card footprint
 * behind each port rather than falling back to a magic number, so the default
 * is safe instead of merely conventional.
 *
 * ## Per-endpoint side selection
 *
 * `fromSide` / `toSide` let an edge leave and arrive on the cross-axis faces —
 * top/bottom in a horizontal layout, left/right in a vertical one. Rather than
 * duplicate every branch for four departure normals, a matched pair is routed
 * in a reflected FRAME in which the departure normal is +x again, and every
 * emitted coordinate is mapped back on the way out. All four supported frames
 * are involutive axis-aligned maps, so one function does both directions. This
 * is the same reflection trick `WorkflowCanvas` already applies for vertical
 * layouts; doing it inside the router just means the returned `d` is in world
 * coordinates instead of needing an SVG matrix at paint time.
 *
 * Mixed pairs (`right` → `top`) do not compose under a single reflection and
 * are deliberately NOT half-implemented: they fall back to the default frame.
 */
export type Pt = { x: number; y: number }
export type Obstacle = { x0: number; y0: number; x1: number; y1: number }
/** Which face of its card an edge leaves from / arrives on. */
export type PortSide = 'left' | 'right' | 'top' | 'bottom'

const R = 10    // corner radius
const PAD = 14  // clearance gap from a card or obstacle edge
const CURVE_THRESHOLD = 30 // |Δy| below this → soft curve instead of orthogonal
/**
 * Narrowest empty lane between two vertically-separated cards that a backward
 * edge's crossing run will thread rather than routing around the outside of the
 * pair. Sized so the run keeps ~9 px of clear space either side — enough to read
 * as a lane rather than as a line grazing two card edges.
 */
export const MIN_CORRIDOR = 18

/**
 * The standard node card footprint (`NODE_W` × `NODE_H` in `flow.ts`), used ONLY
 * to synthesise endpoint rects for a caller that passes none. This module keeps
 * ZERO imports on purpose — that is what makes it a pure, buildless unit under
 * test, which is how the routing regressions in `edge-path.test.ts` are caught
 * — so the two numbers are restated here rather than imported. Every caller in
 * this package passes real rects, so these only ever serve third-party callers.
 */
const CARD_W = 156
const CARD_H = 72

/**
 * Boundary tolerance for "is this leg inside that card". A port sits exactly ON
 * its card's edge, so the leg that departs it is collinear with the boundary and
 * must not read as a cut. Anything deeper than half a pixel is a real crossing.
 */
const EPS = 0.5

// ── routing frames ──────────────────────────────────────────────────────────
// Each maps world space to a local frame in which the source departs along +x
// and the target is approached along +x. All four are involutive (f(f(p)) === p)
// and axis-aligned, so the same function un-maps the result and an axis-aligned
// rect stays axis-aligned under it.
const IDENTITY = (p: Pt): Pt => p
const FRAMES: Record<string, (p: Pt) => Pt> = {
  'right>left': IDENTITY,
  'left>right': (p) => ({ x: -p.x, y: p.y }),
  'bottom>top': (p) => ({ x: p.y, y: p.x }),
  'top>bottom': (p) => ({ x: -p.y, y: -p.x }),
}

/** Map a rect through a frame. Axis-aligned in, axis-aligned out. */
function xfRect(r: Obstacle, f: (p: Pt) => Pt): Obstacle {
  const a = f({ x: r.x0, y: r.y0 })
  const b = f({ x: r.x1, y: r.y1 })
  return {
    x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y),
    x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y),
  }
}

/** Does the vertical segment at x=`xx` spanning [ya,yb] pass through an obstacle? */
function hitsV(obstacles: Obstacle[], ya: number, yb: number, xx: number): Obstacle | null {
  const lo = Math.min(ya, yb)
  const hi = Math.max(ya, yb)
  for (const o of obstacles) {
    if (xx > o.x0 && xx < o.x1 && hi > o.y0 && lo < o.y1) return o
  }
  return null
}

/**
 * The horizontal twin of `hitsV`, and the reason defects A and B survived so
 * long: the old router collision-tested only the vertical jog, while BOTH of
 * the bugs it shipped put their offending geometry on a horizontal leg.
 */
function hitsH(obstacles: Obstacle[], xa: number, xb: number, yy: number): Obstacle | null {
  const lo = Math.min(xa, xb)
  const hi = Math.max(xa, xb)
  for (const o of obstacles) {
    if (yy > o.y0 && yy < o.y1 && hi > o.x0 && lo < o.x1) return o
  }
  return null
}

/** Does an axis-aligned segment enter a rect's interior (beyond EPS)? */
function cuts(r: Obstacle, ax: number, ay: number, bx: number, by: number): boolean {
  return (
    Math.max(ax, bx) > r.x0 + EPS && Math.min(ax, bx) < r.x1 - EPS &&
    Math.max(ay, by) > r.y0 + EPS && Math.min(ay, by) < r.y1 - EPS
  )
}

/** Compact number formatting — keeps integers integral and kills −0. */
const f = (v: number): string => (Number.isInteger(v) ? String(v) : String(+v.toFixed(4)))

/** SVG path `d` from an output port to an input port (design's PipeEdge). */
export function buildEdgePath(
  from: Pt,
  to: Pt,
  opts: {
    obstacles?: Obstacle[]
    bendFrac?: number
    bendX?: number
    /** The edge's OWN endpoint cards. Deliberately separate from `obstacles`:
     *  the path must reach their ports, so it must never be detoured around
     *  them — but every branch consults them for body clearance. Omit and a
     *  standard card footprint is assumed behind each port. */
    fromRect?: Obstacle
    toRect?: Obstacle
    /** Which face the edge leaves / arrives on. Only MATCHED pairs are routed
     *  in their own frame (`right`→`left`, `left`→`right`, `bottom`→`top`,
     *  `top`→`bottom`); a mixed pair falls back to the default frame. */
    fromSide?: PortSide
    toSide?: PortSide
    /** Optional out-param: receives the edge's LABEL ANCHOR — the jog elbow
     *  (tracking any detour), or the chord midpoint for curve/level/backward
     *  edges. Lets a connector tag ride the real line, detours included.
     *  `jog` is set ONLY when the routed line has a vertical segment at the
     *  anchor's x (the orthogonal / detour branches) — its [y0,y1] span. A
     *  vertical leader dropped from the anchor would double that segment, so a
     *  tag clamps its leader to the jog boundary. Curve / straight / backward
     *  edges leave it undefined: the anchor is a lone on-line point, so a leader
     *  runs straight to it. A non-default FRAME also leaves it undefined — the
     *  jog is vertical in the routing frame, not in world space, so a world-space
     *  leader has nothing to clamp against. */
    out?: { anchor: Pt; jog?: { y0: number; y1: number } }
  } = {},
): string {
  const bendFrac = opts.bendFrac ?? 0.5

  // Pick the routing frame. An unsupported (mixed) pair is not half-routed —
  // it falls through to the default frame, which is exactly today's behaviour.
  const frame = FRAMES[`${opts.fromSide ?? 'right'}>${opts.toSide ?? 'left'}`]
  const xf = frame ?? IDENTITY
  const worldFrame = xf === IDENTITY

  const A = xf(from)
  const B = xf(to)
  const obstacles = worldFrame
    ? (opts.obstacles ?? [])
    : (opts.obstacles ?? []).map((o) => xfRect(o, xf))
  // The endpoint cards, in the routing frame. Absent a real rect, assume a
  // standard card sitting BEHIND the port along its outward normal — which in
  // this frame is always −x for the source and +x for the target.
  const fromRect = opts.fromRect
    ? xfRect(opts.fromRect, xf)
    : { x0: A.x - CARD_W, y0: A.y - CARD_H / 2, x1: A.x, y1: A.y + CARD_H / 2 }
  const toRect = opts.toRect
    ? xfRect(opts.toRect, xf)
    : { x0: B.x, y0: B.y - CARD_H / 2, x1: B.x + CARD_W, y1: B.y + CARD_H / 2 }
  const own = [fromRect, toRect]

  // Emitters. Every coordinate goes back through `xf` on the way out (the frame
  // is involutive, so the forward map IS the inverse), which is what keeps the
  // returned `d` in world coordinates no matter which frame routed it.
  const P = (x: number, y: number): string => {
    const p = xf({ x, y })
    return `${f(p.x)} ${f(p.y)}`
  }
  const M = (x: number, y: number) => `M ${P(x, y)}`
  const L = (x: number, y: number) => ` L ${P(x, y)}`
  const Q = (cx: number, cy: number, x: number, y: number) => ` Q ${P(cx, cy)} ${P(x, y)}`
  const C = (c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) =>
    ` C ${P(c1x, c1y)}, ${P(c2x, c2y)}, ${P(x, y)}`

  const setAnchor = (x: number, y: number) => {
    if (opts.out) opts.out.anchor = xf({ x, y })
  }
  // Only meaningful in the world frame — see the `out` doc comment.
  const setJog = (y0: number, y1: number) => {
    if (opts.out && worldFrame) opts.out.jog = { y0, y1 }
  }

  // "Backward": the target sits BEHIND the source along the primary axis. Such
  // an edge MUST loop around with the inverted-S below — a soft curve or a
  // straight line would run straight back through both cards (only the
  // arrowhead would show). So the shallow-edge short-circuits are forward-only.
  //
  // The threshold is exactly 0, not a tolerance. It used to be `<= 8`, which
  // sent a target sitting 0–8 px FORWARD of the source's port around the full
  // loop — a ~130-unit excursion below both cards where a ~75-unit vertical jog
  // fits perfectly well. Two cards stacked nearly vertically (a common shape
  // after a drag) hit it constantly, and the result was visibly wrong twice
  // over: the connector dived below both cards for an 8 px difference, and the
  // tag anchor jumped ~100 px down onto the crossing run, dragging its leader
  // off with it.
  //
  // It was also DISCONTINUOUS in the node positions, the defect this router is
  // otherwise careful about: at dx = 9 → 8 the rendered line snapped between
  // the two shapes mid-drag. Zero is where the flip becomes unavoidable rather
  // than merely early — with `edgeSides='flow'` the path must arrive travelling
  // +x into the target's LEFT face, so the moment that face sits behind the
  // source's port, reaching it requires a wrap. At dx = 0 the jog degenerates
  // to a straight vertical run touching both card edges, which is the correct
  // limit of the forward family, not a special case.
  const backwards = B.x - A.x < 0

  // Soft curve for shallow FORWARD edges. (opts.bendX is intentionally ignored
  // here — a shallow soft-curve has no vertical jog to pin.)
  if (!backwards && Math.abs(B.y - A.y) < CURVE_THRESHOLD) {
    const dx = Math.abs(B.x - A.x)
    setAnchor((A.x + B.x) / 2, (A.y + B.y) / 2)
    return M(A.x, A.y) + C(A.x + dx * 0.5, A.y, B.x - dx * 0.5, B.y, B.x, B.y)
  }

  const sgnY = Math.sign(B.y - A.y) || 1
  const dy = Math.abs(B.y - A.y)

  if (backwards) {
    // Loop back to a target behind the source: two turn columns just past each
    // end (ax/bx) joined by a crossing run.
    //
    // The turn columns must clear BOTH cards horizontally, and the crossing run
    // must clear both vertically. The old code guessed at both — a fixed 28 px
    // stub past the chord's half-span, and a 30 px drop below the lower port —
    // and both guesses were smaller than half a card, so the loop reliably
    // landed inside the very cards it connected.
    const STUB = 28

    // Where the crossing run sits. Three candidates, in preference order:
    // through the CORRIDOR between two vertically-separated cards, else fully
    // BELOW both or fully ABOVE both — whichever of those two is nearer the
    // chord midpoint.
    //
    // Below/above can never land inside a card by construction, and — because
    // such a `my` lies outside [A.y, B.y] — the path length is 2·|my − midY|
    // plus a fixed horizontal run, so those two are exactly equal in length at
    // the moment the choice flips. That pair is therefore CONTINUOUS in the
    // node positions, unlike the old `dy >= 2 * MIN` branch which snapped the
    // run 59 px at dy = 59 → 60 and visibly jumped mid-drag.
    //
    // The corridor is the case those two miss. Stack two cards with a gap and
    // connect them backwards — an ordinary shape, and the one this router kept
    // getting wrong — and the run had to travel around the OUTSIDE of the pair
    // even though the lane between them was empty and sat exactly on the chord
    // midpoint. The result was a ~300 px wrap where a ~60 px S fits, and it
    // read as a routing failure rather than a routing choice.
    //
    // It is gated on the lane being genuinely roomy (`MIN_CORRIDOR`, comfortably
    // more than a line's own visual weight) so the run keeps real clearance on
    // both sides instead of hairlining a card edge. Narrower than that and the
    // corridor is simply not offered, which is a discontinuity — but a bounded
    // one at a layout that has no good answer anyway, and the alternative is
    // being wrong at every comfortably-spaced stack to stay smooth at the
    // degenerate ones.
    const midY = (A.y + B.y) / 2
    const below = Math.max(fromRect.y1, toRect.y1) + PAD
    const above = Math.min(fromRect.y0, toRect.y0) - PAD
    // The empty lane between the cards, when one card clears the other outright.
    const lane =
      fromRect.y0 >= toRect.y1 ? { lo: toRect.y1, hi: fromRect.y0 } :
      toRect.y0 >= fromRect.y1 ? { lo: fromRect.y1, hi: toRect.y0 } :
      null
    const outer = Math.abs(below - midY) <= Math.abs(midY - above) ? below : above
    const my =
      lane && lane.hi - lane.lo >= MIN_CORRIDOR ? (lane.lo + lane.hi) / 2 : outer

    // The turn columns. The right one carries the source leg (A.y → my) plus the
    // horizontal out of the source port; the left one carries the target leg
    // (my → B.y) plus the horizontal into the target port. Each is chosen
    // independently and each only has to clear the cards ITS OWN legs would
    // cross — pushing both columns past every card would send a short hop around
    // a wide hub on a pointless excursion.
    //
    // It is a nearest-valid SEARCH, not a monotone push outward, because the
    // gap BETWEEN two nearly-abutting cards is often the only valid column: two
    // cards side by side with overlapping vertical bands leave no room outside
    // either of them, and shoving the column further out only moves the cut.
    const clearAx = (x: number) =>
      !own.some((r) => cuts(r, A.x, A.y, x, A.y) || cuts(r, x, A.y, x, my))
    const clearBx = (x: number) =>
      !own.some((r) => cuts(r, x, my, x, B.y) || cuts(r, x, B.y, B.x, B.y))
    const columns = (natural: number, lo: number, hi: number) => {
      const raw = [natural, ...own.flatMap((r) => [r.x1 + PAD, r.x0 - PAD])]
      return raw
        .map((c) => Math.max(lo, Math.min(hi, c)))
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort((p, q) => Math.abs(p - natural) - Math.abs(q - natural))
    }
    // The natural columns sit one stub past whichever end reaches furthest, so
    // they are the shape the design asks for whenever nothing is in the way.
    const naturalAx = Math.max(A.x, B.x) + STUB
    const naturalBx = Math.min(A.x, B.x) - STUB
    // The source leg departs along +x and the target leg arrives along +x, so
    // the columns may not cross back over their own ports.
    const ax = columns(naturalAx, A.x, Infinity).find(clearAx) ?? naturalAx
    const bx = columns(naturalBx, -Infinity, B.x).find(clearBx) ?? naturalBx

    const d1 = Math.sign(my - A.y) || 1 // source-leg direction
    const d2 = Math.sign(B.y - my) || 1 // target-leg direction
    // Separate corner radii per end: a column pinned hard against its own port
    // has no room for a curve, and capping BOTH ends on the tighter one would
    // square off corners that had space to spare.
    const span2 = Math.abs(ax - bx) / 2
    const rA = Math.min(R, STUB / 2, Math.abs(my - A.y) / 2, span2, Math.abs(ax - A.x))
    const rB = Math.min(R, STUB / 2, Math.abs(B.y - my) / 2, span2, Math.abs(bx - B.x))
    const sx = Math.sign(bx - ax) || -1 // crossing-run direction
    const inA = Math.sign(ax - A.x) || 1 // source port → right column
    const outB = Math.sign(B.x - bx) || 1 // left column → target port
    setAnchor((ax + bx) / 2, my)
    return (
      M(A.x, A.y) +
      L(ax - inA * rA, A.y) +
      Q(ax, A.y, ax, A.y + d1 * rA) +
      L(ax, my - d1 * rA) +
      Q(ax, my, ax + sx * rA, my) +
      L(bx - sx * rB, my) +
      Q(bx, my, bx, my + d2 * rB) +
      L(bx, B.y - d2 * rB) +
      Q(bx, B.y, bx + outB * rB, B.y) +
      L(B.x, B.y)
    )
  }

  // Forward orthogonal rounded routing. The vertical jog normally sits at
  // bendFrac between the endpoints; an explicit finite opts.bendX pins it to an
  // absolute x instead, clamped strictly inside [A.x, B.x] with a margin so
  // the corner radii still fit (falling back to the computed value if that
  // clamp would collapse the usable range).
  let bendX = A.x + (B.x - A.x) * bendFrac
  const bendXOverride = opts.bendX
  if (bendXOverride !== undefined && Number.isFinite(bendXOverride)) {
    const clamped = clampSpan(bendXOverride, A.x, B.x)
    if (clamped !== null) bendX = clamped
  }
  if (dy < 0.5) {
    setAnchor((A.x + B.x) / 2, (A.y + B.y) / 2)
    return M(A.x, A.y) + L(B.x, B.y)
  }

  // A candidate jog column is judged on the WHOLE three-leg L it implies — the
  // horizontal leg out of the source, the vertical run, and the horizontal leg
  // into the target — not just the vertical run. Testing only the run is how a
  // detour column behind `from.x` was allowed to emit a leg travelling in −x
  // straight across the source card's title.
  const cutsOwnCard = (x: number) =>
    own.some((r) =>
      cuts(r, A.x, A.y, x, A.y) ||
      cuts(r, x, A.y, x, B.y) ||
      cuts(r, x, B.y, B.x, B.y))
  const cutsObstacle = (x: number) =>
    !!hitsV(obstacles, A.y, B.y, x) ||
    !!hitsH(obstacles, A.x, x, A.y) ||
    !!hitsH(obstacles, x, B.x, B.y)

  // Candidates, best first: the requested column, then the obstacle's nearer
  // side and its far side CLAMPED into the span (the clamp `opts.bendX` always
  // had and the detour never did), and only then those same sides unclamped —
  // stepping outside the span is a last resort, and even then the column has to
  // clear both endpoint cards to be picked at all.
  const cands: number[] = [bendX]
  const hit = hitsV(obstacles, A.y, B.y, bendX)
  if (hit) {
    const leftX = hit.x0 - PAD
    const rightX = hit.x1 + PAD
    const sides = Math.abs(bendX - leftX) < Math.abs(bendX - rightX) ? [leftX, rightX] : [rightX, leftX]
    for (const s of sides) {
      const c = clampSpan(s, A.x, B.x)
      if (c !== null) cands.push(c)
    }
    cands.push(...sides)
  }
  const uniq = cands.filter((v, i) => cands.indexOf(v) === i)
  // If nothing can clear both the cards and the obstacles, prefer clearing the
  // CARDS: a line grazing an unrelated node is untidy, a line through its own
  // endpoint's title is unreadable. The final fallback is the plain single-jog
  // L, which is what the old code should have degraded to instead of emitting a
  // backward leg.
  const jogX =
    uniq.find((x) => !cutsOwnCard(x) && !cutsObstacle(x)) ??
    uniq.find((x) => !cutsOwnCard(x)) ??
    clampSpan(bendX, A.x, B.x) ??
    bendX

  const r = Math.min(R, Math.abs(jogX - A.x), Math.abs(B.x - jogX), dy / 2)
  const s1 = Math.sign(jogX - A.x) || 1
  const s2 = Math.sign(B.x - jogX) || 1
  setAnchor(jogX, (A.y + B.y) / 2)
  setJog(Math.min(A.y, B.y), Math.max(A.y, B.y))
  return (
    M(A.x, A.y) +
    L(jogX - s1 * r, A.y) +
    Q(jogX, A.y, jogX, A.y + sgnY * r) +
    L(jogX, B.y - sgnY * r) +
    Q(jogX, B.y, jogX + s2 * r, B.y) +
    L(B.x, B.y)
  )
}

/** Clamp a jog column strictly inside [a, b] with room for the corner radii.
 *  Returns null when that margin would collapse the usable range. */
function clampSpan(x: number, a: number, b: number): number | null {
  const margin = R + 2
  const lo = Math.min(a, b) + margin
  const hi = Math.max(a, b) - margin
  return lo <= hi ? Math.max(lo, Math.min(hi, x)) : null
}

/**
 * Pick the departure / arrival faces for an edge from pure geometry.
 *
 * The router can leave and arrive on any face, but SOMEBODY has to decide which
 * — and until now nothing did: `portPos` and `portAnchor` chose a face from
 * `(dir, orientation)` alone, with zero awareness of where the other endpoint
 * sat. That is why a target dragged behind its source produced a full loop-back
 * instead of simply leaving through the top.
 *
 * The rule, in a horizontal layout, in priority order:
 *
 *   1. If the vertical offset DOMINATES — bigger than the horizontal one plus a
 *      card — the two nodes are effectively stacked, and a right→left route
 *      makes a long flat S where a bottom→top drop is a straight line. This is
 *      the "reroute top / bottom even in horizontal view" case.
 *   2. Otherwise, if the target is ahead, the flow faces (right→left).
 *   3. Otherwise the target is BEHIND, and the honest answer is left→right: a
 *      short run out of the source's back face into the target's front face,
 *      instead of a full loop around both cards.
 *
 * The vertical layout is the mirror image. Returned pairs are always MATCHED,
 * because those are the pairs the router can route in their own frame.
 *
 * This is opt-in at every call site — no caller changes its rendering unless it
 * asks for it — so existing graphs are untouched.
 */
export function pickSides(
  from: Pt,
  to: Pt,
  orientation: 'horizontal' | 'vertical' = 'horizontal',
): { fromSide: PortSide; toSide: PortSide } {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (orientation === 'vertical') {
    if (Math.abs(dx) > Math.abs(dy) + CARD_W) {
      return dx > 0 ? { fromSide: 'right', toSide: 'left' } : { fromSide: 'left', toSide: 'right' }
    }
    return dy > 8 ? { fromSide: 'bottom', toSide: 'top' } : { fromSide: 'top', toSide: 'bottom' }
  }
  if (Math.abs(dy) > Math.abs(dx) + CARD_H) {
    return dy > 0 ? { fromSide: 'bottom', toSide: 'top' } : { fromSide: 'top', toSide: 'bottom' }
  }
  return dx > 8 ? { fromSide: 'right', toSide: 'left' } : { fromSide: 'left', toSide: 'right' }
}
