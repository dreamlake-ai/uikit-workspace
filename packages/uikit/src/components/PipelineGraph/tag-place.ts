/**
 * Connector-tag placement — the card-avoidance shared by PipelineGraph and
 * WorkflowCanvas.
 *
 * A tag rests on its edge's live routed anchor and is displaced only
 * PERPENDICULARLY off the line (a leadered lift). `clearOffset` is the single-
 * tag primitive: the smallest offset that clears the node cards.
 * `restingOffsets` is the whole-layout pass built on it, and is what the canvas
 * actually calls.
 *
 * The pass runs LIVE — on every node move, not once at load. A tag's default is
 * to sit on its connector; it lifts clear only while a card is close enough to
 * touch it, and drops back onto the line as soon as the room reappears. A tag
 * the user has dragged is exempt: their offset holds until they move it again.
 * Pure geometry, SSR-safe.
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

/** One tag's geometry for a resting-offset pass. */
export type TagProbe = { key: string; anchor: Pt; boxW: number; boxH: number }

/**
 * Resting perpendicular lift for every tag in a layout — the LIVE pass that
 * runs whenever the nodes move.
 *
 * The rule, in priority order, per tag:
 *
 *  1. **Manual wins, forever.** A tag the user has dragged across its edge has
 *     an entry in `manual`; its offset is returned untouched and never
 *     re-searched. It still contributes its box to the obstacle set so the
 *     auto-placed tags route around it.
 *  2. **Default to the connector.** If the tag sits clear ON the line, the
 *     offset is 0 — no leader. This is what makes a tag fall back onto its edge
 *     once the nodes move apart again.
 *  3. **Otherwise lift clear of the cards.** Cards are grown by `gap` first, so
 *     a lifted tag clears the node's area rather than merely not overlapping it
 *     — "close" must not mean "touching".
 *
 * Between 2 and 3 sits a hysteresis step: a tag whose PREVIOUS lift is still
 * clear keeps it, instead of re-searching and possibly flipping to the far side
 * of the line. Without it a tag jitters — and worse, siblings shuffle — while a
 * node is being dragged past it. `prev` is the last pass's output.
 *
 * Deterministic: tags are processed in sorted key order, so the `taken`
 * accumulation (and therefore the result) never depends on object iteration
 * order. Pure geometry, SSR-safe, idempotent — feeding a pass's own output back
 * in as `prev` reproduces it exactly.
 */
export function restingOffsets(
  tags: TagProbe[],
  cards: Rect[],
  manual: Record<string, number>,
  prev: Record<string, number>,
  axis: 'x' | 'y' = 'y',
  gap = 8,
): Record<string, number> {
  const avoid: Rect[] = cards.map((r) => ({ x: r.x - gap, y: r.y - gap, w: r.w + gap * 2, h: r.h + gap * 2 }))
  const taken: Rect[] = []
  const offs: Record<string, number> = {}

  const boxAt = (t: TagProbe, off: number): Rect => {
    const cx = t.anchor.x + (axis === 'x' ? off : 0)
    const cy = t.anchor.y + (axis === 'y' ? off : 0)
    return { x: cx - t.boxW / 2 - 2, y: cy - t.boxH / 2 - 2, w: t.boxW + 4, h: t.boxH + 4 }
  }
  const isClear = (b: Rect) => !avoid.some((r) => boxesIntersect(b, r)) && !taken.some((t) => boxesIntersect(b, t))

  for (const t of [...tags].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))) {
    // 1. Hand-placed: locked, but still an obstacle for everyone else.
    const hand = manual[t.key]
    if (hand != null) {
      taken.push(boxAt(t, hand))
      continue
    }
    // 2. On the line whenever it fits.
    if (isClear(boxAt(t, 0))) {
      offs[t.key] = 0
      taken.push(boxAt(t, 0))
      continue
    }
    // 3. Hold the previous lift while it still works — no flip-flopping.
    const before = prev[t.key]
    if (before != null && before !== 0 && isClear(boxAt(t, before))) {
      offs[t.key] = before
      taken.push(boxAt(t, before))
      continue
    }
    // 4. Search for the smallest lift that clears the grown cards.
    const { off, box } = clearOffset(t.anchor, t.boxW, t.boxH, avoid, taken, axis)
    offs[t.key] = off
    taken.push(box)
  }
  return offs
}
