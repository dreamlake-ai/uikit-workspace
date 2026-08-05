/**
 * Connector-tag placement — a one-time card-avoidance shared by PipelineGraph
 * and WorkflowCanvas.
 *
 * A tag rests on its edge's live routed anchor and is displaced only
 * PERPENDICULARLY off the line (a leadered lift), via each canvas's
 * `labelOffsets` map. `clearOffset` computes the initial value of that lift: the
 * smallest offset that clears the node cards. Because the result feeds the same
 * `labelOffsets` the drag reads, a seeded tag and a hand-dragged one are the
 * same object — grabbing one never teleports it, and it rides the live anchor
 * through node drags and rebends. Pure geometry, SSR-safe.
 */
export type Pt = { x: number; y: number }
export type Rect = { x: number; y: number; w: number; h: number }

/** AABB overlap test. */
export function boxesIntersect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

/**
 * Smallest signed PERPENDICULAR offset (along `axis` — the edge's cross axis)
 * that lifts a tag box centred on `anchor` clear of the `avoid` cards and the
 * `taken` sibling tags. Returns 0 when the anchor already sits clear (tag stays
 * ON the line, no leader).
 *
 * Bidirectional: it probes ±step outward and takes the first clear side. If
 * nothing in range is clear (a tag boxed in on BOTH sides), it returns the
 * offset with the LEAST overlap area rather than 0, so the tag is nudged as
 * clear as the geometry allows instead of sitting dead-centre on a card.
 *
 * Meant to run ONCE per layout to seed a tag's resting lift, which is then
 * frozen — node drags carry the tag rigidly along its edge (anchor moves, lift
 * constant) instead of re-searching every frame (which would make siblings
 * jump). The lift axis is the same one the user's across-drag uses, so seeded
 * and dragged tags are interchangeable.
 */
export function clearOffset(
  anchor: Pt,
  boxW: number,
  boxH: number,
  avoid: Rect[],
  taken: Rect[],
  axis: 'x' | 'y',
  opts: { step?: number; max?: number } = {},
): { off: number; box: Rect } {
  const step = opts.step ?? 6
  const max = opts.max ?? 140
  const boxAt = (off: number): Rect => {
    const cx = anchor.x + (axis === 'x' ? off : 0)
    const cy = anchor.y + (axis === 'y' ? off : 0)
    return { x: cx - boxW / 2 - 2, y: cy - boxH / 2 - 2, w: boxW + 4, h: boxH + 4 }
  }
  const clear = (b: Rect) => !avoid.some((r) => boxesIntersect(b, r)) && !taken.some((t) => boxesIntersect(b, t))
  if (clear(boxAt(0))) return { off: 0, box: boxAt(0) }

  // Total overlap area of a box against every obstacle — the tie-breaker when
  // no position is fully clear.
  const overlapArea = (b: Rect): number => {
    let a = 0
    for (const r of avoid) {
      const ox = Math.max(0, Math.min(b.x + b.w, r.x + r.w) - Math.max(b.x, r.x))
      const oy = Math.max(0, Math.min(b.y + b.h, r.y + r.h) - Math.max(b.y, r.y))
      a += ox * oy
    }
    for (const t of taken) {
      const ox = Math.max(0, Math.min(b.x + b.w, t.x + t.w) - Math.max(b.x, t.x))
      const oy = Math.max(0, Math.min(b.y + b.h, t.y + t.h) - Math.max(b.y, t.y))
      a += ox * oy
    }
    return a
  }
  let best = { off: 0, box: boxAt(0), overlap: overlapArea(boxAt(0)) }
  for (let d = step; d <= max; d += step) {
    for (const off of [d, -d]) {
      const box = boxAt(off)
      if (clear(box)) return { off, box }
      const ov = overlapArea(box)
      if (ov < best.overlap) best = { off, box, overlap: ov }
    }
  }
  return { off: best.off, box: best.box }
}
