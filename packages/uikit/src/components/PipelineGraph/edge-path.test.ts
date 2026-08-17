/**
 * Geometry regression tests for the edge router.
 *
 * The bug this suite exists for was reported as "if a connector has no tags, it
 * can bend through the starting node" — but no branch of `buildEdgePath` reads a
 * tag. Tags matter only because dragging a tag pill is the ONLY way a user can
 * feed a `bendFrac` back into the router, so an untagged connector is pinned at
 * `bendFrac = 0.5` with no recourse. The untagged connectors are simply the
 * survivors: the tagged ones got hand-fixed. The defect is in the geometry.
 *
 * So every assertion here is geometric and tag-free. The primitive is
 * `pierce(d, rect)` — flatten the returned `d` (only `M`, `L` and `Q` are ever
 * emitted) into sample points and measure the deepest penetration into a rect.
 * A connector may touch its endpoint cards' boundaries — that is where the ports
 * are — but must never enter their interiors. The whole invariant is
 * `pierce(d, fromRect) === 0 && pierce(d, toRect) === 0`.
 *
 * The fourth block is a CONTINUITY assertion rather than a penetration one. It
 * is what would have caught the `dy = 59 → 60` snap, where the old `>= 2 * MIN`
 * branch flipped the crossing run from "below the lower card" to "at the
 * midpoint" and the rendered line jumped ~60 px for a one-pixel drag. A router
 * can be pierce-clean at every sampled point and still be visibly wrong if it
 * is discontinuous in the inputs, so both checks earn their place.
 */
import { describe, expect, it } from 'vitest'
import { buildEdgePath, pickSides, MIN_CORRIDOR, type Obstacle, type Pt } from './edge-path'
import { NODE_H, NODE_W } from './flow'

// ── geometry harness ────────────────────────────────────────────────────────

type Side = 'left' | 'right' | 'top' | 'bottom'

/** A node card at its top-left corner, as the router sees it. */
const card = (x: number, y: number): Obstacle => ({ x0: x, y0: y, x1: x + NODE_W, y1: y + NODE_H })

/** The port dot on one face of a card. Flow-axis ports sit at mid-height. */
function port(r: Obstacle, side: Side): Pt {
  const cx = (r.x0 + r.x1) / 2
  const cy = (r.y0 + r.y1) / 2
  if (side === 'left') return { x: r.x0, y: cy }
  if (side === 'right') return { x: r.x1, y: cy }
  if (side === 'top') return { x: cx, y: r.y0 }
  return { x: cx, y: r.y1 }
}

/** An obstacle as the two callers build it: the card grown by 4 px. */
const obstacleOf = (r: Obstacle): Obstacle => ({ x0: r.x0 - 4, y0: r.y0 - 4, x1: r.x1 + 4, y1: r.y1 + 4 })

/**
 * Flatten an SVG path into sample points. `buildEdgePath` emits `M`, `L`, `Q`
 * (orthogonal corner arcs) and `C` (the shallow-edge soft curve) and nothing
 * else, so a straight-line walk plus Bézier evaluation is exact enough: lines
 * are sampled densely and the corner arcs are ~10 px long.
 */
function samples(d: string, perLine = 400): Pt[] {
  const toks = d.match(/[MLQC][^MLQC]*/g) ?? []
  let cur: Pt = { x: 0, y: 0 }
  const pts: Pt[] = []
  for (const t of toks) {
    const n = (t.slice(1).match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/g) ?? []).map(Number)
    if (t[0] === 'M') {
      cur = { x: n[0], y: n[1] }
      pts.push(cur)
    } else if (t[0] === 'L') {
      const b = { x: n[0], y: n[1] }
      for (let i = 1; i <= perLine; i++) {
        pts.push({ x: cur.x + (b.x - cur.x) * (i / perLine), y: cur.y + (b.y - cur.y) * (i / perLine) })
      }
      cur = b
    } else if (t[0] === 'Q') {
      const c = { x: n[0], y: n[1] }
      const b = { x: n[2], y: n[3] }
      for (let i = 1; i <= 40; i++) {
        const s = i / 40
        const m = 1 - s
        pts.push({
          x: m * m * cur.x + 2 * m * s * c.x + s * s * b.x,
          y: m * m * cur.y + 2 * m * s * c.y + s * s * b.y,
        })
      }
      cur = b
    } else {
      const c1 = { x: n[0], y: n[1] }
      const c2 = { x: n[2], y: n[3] }
      const b = { x: n[4], y: n[5] }
      for (let i = 1; i <= 120; i++) {
        const s = i / 120
        const m = 1 - s
        pts.push({
          x: m * m * m * cur.x + 3 * m * m * s * c1.x + 3 * m * s * s * c2.x + s * s * s * b.x,
          y: m * m * m * cur.y + 3 * m * m * s * c1.y + 3 * m * s * s * c2.y + s * s * s * b.y,
        })
      }
      cur = b
    }
  }
  return pts
}

/** Deepest penetration of the path into a rect's INTERIOR, in px. 0 = clean. */
function pierce(d: string, r: Obstacle): number {
  let worst = 0
  for (const p of samples(d)) {
    const pen = Math.min(p.x - r.x0, r.x1 - p.x, p.y - r.y0, r.y1 - p.y)
    if (pen > worst) worst = pen
  }
  // Sub-pixel readings are sampling noise on a corner arc, not a real cut.
  return worst < 0.02 ? 0 : worst
}

/** Polyline length of the sampled path — the continuity metric. */
function pathLength(d: string): number {
  const pts = samples(d, 8)
  let len = 0
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
  return len
}

/** Assert a connector clears both of its own endpoint cards. */
function expectClear(d: string, from: Obstacle, to: Obstacle, what: string) {
  const ps = pierce(d, from)
  const pt = pierce(d, to)
  expect(
    `${what}: srcPierce=${ps.toFixed(1)} dstPierce=${pt.toFixed(1)}`,
  ).toBe(`${what}: srcPierce=0.0 dstPierce=0.0`)
}

// ── 1. backwards edges — the reported bug ───────────────────────────────────
//
// This is the "untagged connector crosses its own source node" case. In
// WorkflowCanvas a fan-out (hub → member) segment hardcodes `label: null`, and
// when the member is dragged BESIDE or BEHIND its hub the segment is routed
// port → port straight into the backwards inverted-S. That S placed its long
// crossing run `MIN = 30` px below the port — but the port is at mid-height and
// `NODE_H / 2 = 36`, so the run landed 6 px INSIDE the card and then traversed
// the full 156 px width of both of them.

describe('backwards edge — never crosses its own endpoint cards', () => {
  for (const dx of [-560, -280, -180]) {
    it(`dy sweep 0…120 at dx=${dx}`, () => {
      const src = card(400, 100)
      for (let dy = 0; dy <= 120; dy++) {
        const dst = card(400 + dx, 100 + dy)
        const d = buildEdgePath(port(src, 'right'), port(dst, 'left'), {
          obstacles: [],
          bendFrac: 0.5,
          fromRect: src,
          toRect: dst,
        })
        expectClear(d, src, dst, `dx=${dx} dy=${dy}`)
      }
    })
  }

  it('a member dragged all around its stage hub', () => {
    // The WorkflowCanvas fan-out shape, which is where this bug is most visible:
    // the segment hardcodes `label: null` so no tag can ever rescue it, and when
    // the member's input face is not forward of the hub's output edge the
    // segment goes port → port straight into the backwards branch.
    //
    // Overlapping placements are skipped, and that exclusion is a real claim,
    // not a convenience: when the target card covers the space immediately in
    // front of its own input port there is NO orthogonal route in that avoids
    // the other card, because the port is inside it. Two cards on top of each
    // other is a layout defect, not a routing one.
    const hub = card(500, 200)
    const hubOut = port(hub, 'right')
    const overlaps = (a: Obstacle, b: Obstacle) =>
      a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0
    let checked = 0
    for (let mx = 60; mx <= 900; mx += 20) {
      for (let my = 40; my <= 400; my += 20) {
        const member = card(mx, my)
        if (overlaps(hub, member)) continue
        const d = buildEdgePath(hubOut, port(member, 'left'), {
          obstacles: [], fromRect: hub, toRect: member,
        })
        expectClear(d, hub, member, `hub→member (${mx},${my})`)
        checked++
      }
    }
    expect(checked).toBeGreaterThan(600)
  })

  it('the turn columns clear an oversized hub rather than cutting it', () => {
    // Stage hubs are member-sized today, but nothing in the router should
    // depend on that — the columns are derived from the rects, not from a
    // constant. A wide hub with a member well behind it exercises exactly that.
    const hub: Obstacle = { x0: 200, y0: 100, x1: 900, y1: 340 }
    const hubOut: Pt = { x: hub.x1, y: (hub.y0 + hub.y1) / 2 }
    for (const my of [-40, 380, 460]) {
      const member = card(300, my)
      const d = buildEdgePath(hubOut, port(member, 'left'), {
        obstacles: [], fromRect: hub, toRect: member,
      })
      expectClear(d, hub, member, `wide hub → member y=${my}`)
    }
  })

  it('clears both cards even when the router is given no endpoint rects', () => {
    // A caller that passes nothing must still be safe by default: the fallback
    // clearance has to be NODE_H / 2 + PAD, not the old 30.
    const src = card(400, 100)
    for (let dy = 0; dy <= 120; dy++) {
      const dst = card(120, 100 + dy)
      const d = buildEdgePath(port(src, 'right'), port(dst, 'left'), { obstacles: [] })
      expectClear(d, src, dst, `no-rects dy=${dy}`)
    }
  })
})

// ── 2. forward obstacle detour — defect B ───────────────────────────────────
//
// `detourX` was computed purely from the obstacle and never clamped to the
// span, so when the obstacle's nearer side lay behind `from.x` the router
// emitted a leg travelling in −x out of the source's own output port, at
// `from.y` — the card's exact vertical centre. A 36 px cut straight over the
// node title, on a plain FORWARD edge with no loop-back involved.

describe('forward detour — never runs backward through the source card', () => {
  for (const ox of [90, 100, 110, 120, 130]) {
    it(`obstacle at x=${ox}`, () => {
      const src = card(0, 100)
      const dst = card(176, 300)
      const obs = card(ox, 200)
      const d = buildEdgePath(port(src, 'right'), port(dst, 'left'), {
        obstacles: [obstacleOf(obs)],
        bendFrac: 0.5,
        fromRect: src,
        toRect: dst,
      })
      expectClear(d, src, dst, `ox=${ox}`)
    })
  }

  it('still detours around an obstacle when the span is wide enough to allow it', () => {
    // The fix must not throw the baby out: with room to dodge, the router
    // should still route around the obstacle rather than through it.
    const src = card(0, 100)
    const dst = card(700, 400)
    const obs = card(330, 150)
    const d = buildEdgePath(port(src, 'right'), port(dst, 'left'), {
      obstacles: [obstacleOf(obs)],
      bendFrac: 0.5,
      fromRect: src,
      toRect: dst,
    })
    expectClear(d, src, dst, 'wide-span detour')
    expect(pierce(d, obs)).toBe(0)
  })
})

// ── 3. per-endpoint side selection — the enhancement ────────────────────────
//
// Matched pairs only (both endpoints on the flow axis, or both on the cross
// axis). The mixed case does not compose under a single reflection and is a
// documented follow-up, not a half-implemented branch.

describe('matched side pairs route in their own frame', () => {
  const pairs: Array<[Side, Side]> = [
    ['right', 'left'],
    ['left', 'right'],
    ['bottom', 'top'],
    ['top', 'bottom'],
  ]

  // Where the target sits relative to the source, in the frame the pair implies:
  // "ahead" is a normal forward run, "behind" forces the loop-back branch.
  const place: Record<string, { ahead: [number, number]; behind: [number, number] }> = {
    'right>left': { ahead: [420, 260], behind: [-300, 40] },
    'left>right': { ahead: [-420, 260], behind: [300, 40] },
    'bottom>top': { ahead: [260, 300], behind: [40, -220] },
    'top>bottom': { ahead: [260, -300], behind: [40, 220] },
  }

  for (const [fromSide, toSide] of pairs) {
    const k = `${fromSide}>${toSide}`
    for (const where of ['ahead', 'behind'] as const)
      it(`${k} with the target ${where}`, () => {
        const [dx, dy] = place[k][where]
        const src = card(500, 500)
        const dst = card(500 + dx, 500 + dy)
        const d = buildEdgePath(port(src, fromSide), port(dst, toSide), {
          obstacles: [],
          bendFrac: 0.5,
          fromRect: src,
          toRect: dst,
          fromSide,
          toSide,
        })
        expectClear(d, src, dst, `${k} ${where}`)
      })
  }

  it('pickSides leaves through the cross-axis face exactly when it should', () => {
    const at = (x: number, y: number) => ({ x, y })
    // Plain forward run — nothing to gain from leaving through the top.
    expect(pickSides(at(0, 0), at(400, 20))).toEqual({ fromSide: 'right', toSide: 'left' })
    // Target behind: the case that used to force a full loop around both cards.
    expect(pickSides(at(400, 0), at(0, 0))).toEqual({ fromSide: 'left', toSide: 'right' })
    expect(pickSides(at(400, 0), at(0, -200))).toEqual({ fromSide: 'left', toSide: 'right' })
    // Forward, but the vertical offset dominates by more than a card — the
    // "reroute top / bottom even in horizontal view" case.
    expect(pickSides(at(0, 0), at(60, 400))).toEqual({ fromSide: 'bottom', toSide: 'top' })
    expect(pickSides(at(0, 0), at(60, -400))).toEqual({ fromSide: 'top', toSide: 'bottom' })
    // The vertical layout is the mirror image.
    expect(pickSides(at(0, 0), at(20, 400), 'vertical')).toEqual({ fromSide: 'bottom', toSide: 'top' })
    expect(pickSides(at(0, 400), at(0, 0), 'vertical')).toEqual({ fromSide: 'top', toSide: 'bottom' })
    expect(pickSides(at(0, 0), at(400, 20), 'vertical')).toEqual({ fromSide: 'right', toSide: 'left' })
  })

  it('auto sides shorten the cases the flow faces route badly', () => {
    // The point of the enhancement, stated as a measurement rather than a
    // screenshot. Both routes must clear the cards; the auto one must also be
    // substantially shorter in the two shapes the flow faces handle worst — a
    // target behind its source, and a target stacked under it.
    const centre = (r: Obstacle): Pt => ({ x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 })
    const cases: Array<[string, Obstacle, Obstacle]> = [
      ['target behind', card(500, 300), card(200, 300)],
      ['target stacked below', card(500, 300), card(520, 700)],
    ]
    for (const [what, src, dst] of cases) {
      const flow = buildEdgePath(port(src, 'right'), port(dst, 'left'), {
        obstacles: [], fromRect: src, toRect: dst,
      })
      const { fromSide, toSide } = pickSides(centre(src), centre(dst))
      const auto = buildEdgePath(port(src, fromSide), port(dst, toSide), {
        obstacles: [], fromRect: src, toRect: dst, fromSide, toSide,
      })
      expectClear(flow, src, dst, `${what} / flow faces`)
      expectClear(auto, src, dst, `${what} / auto faces`)
      expect(`${what}: ${(pathLength(auto) / pathLength(flow) < 0.75)}`).toBe(`${what}: true`)
    }
  })

  it('an unsupported mixed pair falls back to the default frame without crashing', () => {
    const src = card(0, 100)
    const dst = card(400, 300)
    const d = buildEdgePath(port(src, 'right'), port(dst, 'left'), {
      obstacles: [],
      fromRect: src,
      toRect: dst,
      fromSide: 'right',
      toSide: 'top',
    })
    expect(d.startsWith('M ')).toBe(true)
  })
})

// ── 3b. the WorkflowCanvas vertical layout ──────────────────────────────────
//
// WorkflowCanvas does its own axis reflection: it swaps both points into
// flow-space, routes there, and un-swaps the whole path with an SVG matrix at
// paint time. The endpoint rects have to make the same trip, un-grown — a port
// sits exactly ON its card's boundary, so the 8 px-grown obstacle form of a rect
// would swallow the port and make every edge read as cutting the card it leaves.

describe('vertical-primary routing (the WorkflowCanvas convention)', () => {
  const swap = (p: Pt): Pt => ({ x: p.y, y: p.x })
  const swapRect = (r: Obstacle): Obstacle => ({ x0: r.y0, y0: r.x0, x1: r.y1, y1: r.x1 })
  /** Un-swap a path the way the `matrix(0,1,1,0,0,0)` transform does. */
  const unswap = (d: string) =>
    d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, a, b) => `${b} ${a}`)

  it('a member dragged all around its hub, routed in swapped space', () => {
    const hub = card(500, 300)
    const hubOut: Pt = { x: hub.x0 + NODE_W / 2, y: hub.y1 } // vertical flow face
    const overlaps = (a: Obstacle, b: Obstacle) =>
      a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0
    for (let mx = 300; mx <= 760; mx += 20) {
      for (let my = 120; my <= 520; my += 20) {
        const member = card(mx, my)
        if (overlaps(hub, member)) continue
        const memberIn: Pt = { x: member.x0 + NODE_W / 2, y: member.y0 }
        const d = unswap(buildEdgePath(swap(hubOut), swap(memberIn), {
          obstacles: [],
          fromRect: swapRect(hub),
          toRect: swapRect(member),
        }))
        expectClear(d, hub, member, `vertical hub→member (${mx},${my})`)
      }
    }
  })
})

// ── 4. continuity — what would have caught the 59 → 60 snap ─────────────────

describe('the routed path is continuous in the endpoint positions', () => {
  it('backwards edge: the only length jump is the corridor opening', () => {
    // This swept clean before backward edges learned to thread the lane between
    // two stacked cards. Opening that lane is a genuine change of route
    // topology — around the outside of the pair, versus between them — so a
    // step at the threshold is not avoidable by tuning: the two routes are
    // nowhere near the same length at the moment one becomes available.
    //
    // What IS still guaranteed is that the step happens EXACTLY ONCE, at a
    // predictable place, and is bounded. Everywhere else a pixel of drag still
    // moves the path a pixel. Asserting the jump's location rather than
    // widening the tolerance keeps this honest — a second jump, or one that
    // drifts, still fails.
    const src = card(400, 100)
    let prev: number | null = null
    const jumps: { dy: number; from: number; to: number }[] = []
    for (let dy = 0; dy <= 120; dy++) {
      const dst = card(120, 100 + dy)
      const len = pathLength(buildEdgePath(port(src, 'right'), port(dst, 'left'), {
        obstacles: [],
        fromRect: src,
        toRect: dst,
      }))
      if (prev !== null && Math.abs(len - prev) > 5) jumps.push({ dy, from: prev, to: len })
      prev = len
    }
    // The lane between the cards is `dy - NODE_H` tall, so it reaches
    // MIN_CORRIDOR — and the route switches — at exactly this dy.
    expect(jumps.map((j) => j.dy)).toEqual([NODE_H + MIN_CORRIDOR])
    // And threading the lane must be the SHORTER route, or it would not be
    // worth a discontinuity at all.
    expect(jumps[0].to).toBeLessThan(jumps[0].from)
    expect(jumps[0].from - jumps[0].to).toBeLessThan(150)
  })

  it('backwards edge: continuous either side of the corridor threshold', () => {
    const src = card(400, 100)
    const lenAt = (dy: number) => pathLength(buildEdgePath(port(src, 'right'), port(card(120, 100 + dy), 'left'), {
      obstacles: [], fromRect: src, toRect: card(120, 100 + dy),
    }))
    for (const [lo, hi] of [[0, NODE_H + MIN_CORRIDOR - 1], [NODE_H + MIN_CORRIDOR, 160]]) {
      let prev: number | null = null
      const jumps: string[] = []
      for (let dy = lo; dy <= hi; dy++) {
        const len = lenAt(dy)
        if (prev !== null && Math.abs(len - prev) > 5) jumps.push(`dy ${dy - 1}→${dy}`)
        prev = len
      }
      expect(jumps).toEqual([])
    }
  })

  it('forward edge: path length never jumps within the orthogonal regime', () => {
    // Swept inside the orthogonal regime only. |dy| = 30 is the deliberate
    // handover from the soft cubic to Manhattan routing — a mode switch, not a
    // routing snap — and it gets its own bounded assertion below.
    const src = card(0, 100)
    let prev: number | null = null
    const jumps: string[] = []
    for (let dy = 30; dy <= 240; dy++) {
      const dst = card(420, 100 + dy)
      const len = pathLength(buildEdgePath(port(src, 'right'), port(dst, 'left'), {
        obstacles: [],
        fromRect: src,
        toRect: dst,
      }))
      if (prev !== null && Math.abs(len - prev) > 5) {
        jumps.push(`dy ${dy - 1}→${dy}: ${prev.toFixed(0)}→${len.toFixed(0)}`)
      }
      prev = len
    }
    expect(jumps).toEqual([])
  })

  it('the curve → orthogonal handover stays a small, bounded step', () => {
    // A soft curve and an L between the same two points cannot have the same
    // length, so the handover can never be perfectly smooth. What it must not do
    // is lurch: this pins it well under the ~59 px snap the old backwards branch
    // produced, so the assertion still fails loudly if the threshold logic drifts.
    const src = card(0, 100)
    const at = (dy: number) => pathLength(buildEdgePath(port(src, 'right'), port(card(420, 100 + dy), 'left'), {
      obstacles: [], fromRect: src, toRect: card(420, 100 + dy),
    }))
    expect(Math.abs(at(30) - at(29))).toBeLessThan(25)
    expect(Math.abs(at(-30) - at(-29))).toBeLessThan(25)
  })
})

describe('a target barely forward of the source jogs — it does not loop', () => {
  // Regression: `backwards` was `B.x - A.x <= 8`, so a target whose left face
  // sat 0–8 px FORWARD of the source's right port was routed as if it were
  // behind — the full inverted-S excursion below both cards. Two cards stacked
  // nearly vertically (an ordinary shape after a drag) hit this constantly.
  const src = card(0, 200)
  // Target 100 px above, swept across the old threshold.
  const dstAt = (dx: number) => card(NODE_W + dx, 100)
  const route = (dx: number) => {
    const dst = dstAt(dx)
    return buildEdgePath(port(src, 'right'), port(dst, 'left'), {
      obstacles: [], fromRect: src, toRect: dst,
    })
  }

  it('routes the 0–8 px band as a short jog, not a loop below both cards', () => {
    // The loop has to reach PAD below the lower card and come back; the jog
    // only spans the vertical gap. Anything near the loop's length means the
    // old branch is back.
    const jog = pathLength(route(24))
    for (const dx of [0, 1, 4, 8]) {
      expect(pathLength(route(dx))).toBeLessThan(jog * 1.35)
    }
  })

  it('never enters either endpoint card across that band', () => {
    for (const dx of [0, 1, 4, 8, 9, 12]) {
      expectClear(route(dx), src, dstAt(dx), `dx=${dx}`)
    }
  })

  it('is continuous in dx everywhere the route family does not change', () => {
    // dx = 0 is the one honest flip: with flow sides the path must arrive
    // travelling +x into the target's LEFT face, so the instant that face is
    // behind the source's port a wrap becomes unavoidable. Either side of it
    // the length must move smoothly.
    for (const [lo, hi] of [[1, 60], [-60, -1]]) {
      let prev: number | null = null
      const jumps: string[] = []
      for (let dx = lo; dx <= hi; dx++) {
        const len = pathLength(route(dx))
        if (prev !== null && Math.abs(len - prev) > 5) jumps.push(`dx ${dx - 1}→${dx}: ${prev.toFixed(0)}→${len.toFixed(0)}`)
        prev = len
      }
      expect(jumps).toEqual([])
    }
  })

  it('keeps the tag anchor on the jog instead of flinging it onto a crossing run', () => {
    // The anchor is what the connector tag rides. Under the old threshold it
    // jumped ~100 px down onto the loop's crossing run at dx = 8, taking the
    // tag and its leader off with it.
    const anchorY = (dx: number) => {
      const dst = dstAt(dx)
      const out: { anchor: Pt } = { anchor: { x: 0, y: 0 } }
      buildEdgePath(port(src, 'right'), port(dst, 'left'), { obstacles: [], fromRect: src, toRect: dst, out })
      return out.anchor.y
    }
    expect(Math.abs(anchorY(8) - anchorY(9))).toBeLessThan(5)
  })
})

describe('a backward edge threads the lane between two stacked cards', () => {
  // Reported as "why isn't this an S curve?" — two cards stacked with a clear
  // gap, connected backwards. The run used to travel around the OUTSIDE of the
  // pair even though the lane between them was empty and sat on the chord
  // midpoint, turning a short S into a wrap most of the way around both cards.
  const src = card(0, 0)                       // lower card, out-port on its right
  const dst = (gap: number) => card(4, -(NODE_H + gap))   // upper card, in-port on its left
  const route = (gap: number) => buildEdgePath(
    port(src, 'right'), port(dst(gap), 'left'),
    { obstacles: [], fromRect: src, toRect: dst(gap) },
  )

  it('runs BETWEEN the cards when the lane is roomy', () => {
    const d = route(21)   // the reported geometry
    // The crossing run must sit inside the lane, not outside the pair.
    const ys = samples(d).map((p) => p.y)
    const lane = { lo: -NODE_H - 21 + NODE_H, hi: 0 }   // [-21, 0]
    expect(ys.some((y) => y > lane.lo && y < lane.hi)).toBe(true)
    // and it must never drop below the lower card, which is what the wrap did.
    expect(Math.max(...ys)).toBeLessThanOrEqual(NODE_H)
  })

  it('is shorter than the wrap it replaces', () => {
    expect(pathLength(route(MIN_CORRIDOR))).toBeLessThan(pathLength(route(MIN_CORRIDOR - 1)))
  })

  it('never enters either card, lane or no lane', () => {
    for (const gap of [40, 21, MIN_CORRIDOR, MIN_CORRIDOR - 1, 8, 0]) {
      expectClear(route(gap), src, dst(gap), `gap=${gap}`)
    }
  })

  it('leaves narrow lanes alone rather than hairlining two card edges', () => {
    const ys = samples(route(MIN_CORRIDOR - 1)).map((p) => p.y)
    // Falls back to the outside route: it must leave the cards' band entirely.
    expect(Math.max(...ys) > NODE_H || Math.min(...ys) < -(NODE_H + MIN_CORRIDOR - 1)).toBe(true)
  })
})
