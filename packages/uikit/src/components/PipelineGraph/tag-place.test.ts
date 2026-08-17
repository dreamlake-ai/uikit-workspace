/**
 * Placement tests for the connector-tag resting lift.
 *
 * The reported defect: "the tag should default to the connector, but if the
 * nodes are close it should place outside the node's area — avoid contact.
 * Till we offset it manually." Three claims, each a block below:
 *
 *  1. DEFAULT — with room, the tag sits ON the line (offset 0, no leader).
 *  2. AVOID — when a card is close enough to touch the tag, the tag is lifted
 *     entirely outside that card's area plus a gap. Not merely non-overlapping:
 *     "close" must not read as "touching".
 *  3. MANUAL — a tag the user has dragged keeps their offset, permanently, and
 *     the auto-placed tags route around it.
 *
 * The old implementation satisfied (1) and (2) only at load: the pass was
 * frozen on `graph.id`, so dragging cards together never re-ran it and the tag
 * stayed at a stale lift, on top of a card. The fourth block is therefore about
 * the pass being re-runnable — stable and idempotent under repeated calls —
 * since that is what the freeze was originally protecting against.
 *
 * The primitive is `gapTo(box, card)`: the clearance between a placed tag box
 * and a card, negative when they overlap. Assertions are on that number rather
 * than on a raw offset, so they describe the visual invariant and survive any
 * retuning of the search step.
 */
import { describe, expect, it } from 'vitest'
import { boxesIntersect, restingOffsets, type Rect, type TagProbe } from './tag-place'

const GAP = 8

/** Where `restingOffsets` actually puts a tag's box, mirroring its own boxAt. */
function placed(t: TagProbe, off: number): Rect {
  return { x: t.anchor.x - t.boxW / 2 - 2, y: t.anchor.y + off - t.boxH / 2 - 2, w: t.boxW + 4, h: t.boxH + 4 }
}

/**
 * Clearance between two rects along the axis that separates them: positive when
 * apart (the size of the visual gap), negative when they overlap.
 */
function gapTo(b: Rect, c: Rect): number {
  const dx = Math.max(c.x - (b.x + b.w), b.x - (c.x + c.w))
  const dy = Math.max(c.y - (b.y + b.h), b.y - (c.y + c.h))
  return Math.max(dx, dy)
}

const tag = (key: string, x: number, y: number): TagProbe => ({ key, anchor: { x, y }, boxW: 60, boxH: 14 })
const card = (x: number, y: number): Rect => ({ x, y, w: 150, h: 46 })

describe('default — the tag rides its connector', () => {
  it('sits on the line when nothing is near', () => {
    const offs = restingOffsets([tag('a->b', 400, 400)], [card(0, 0)], {}, {}, 'y', GAP)
    expect(offs['a->b']).toBe(0)
  })

  it('sits on the line when the cards are merely nearby, not touching', () => {
    // Card ends at y = 246; the tag box spans y = 291..309. Clear by a wide
    // margin, so no lift is warranted.
    const offs = restingOffsets([tag('a->b', 400, 300)], [card(340, 200)], {}, {}, 'y', GAP)
    expect(offs['a->b']).toBe(0)
  })

  it('drops back onto the line once the cards move apart again', () => {
    const t = tag('a->b', 400, 300)
    const close = restingOffsets([t], [card(340, 280)], {}, {}, 'y', GAP)
    expect(close['a->b']).not.toBe(0)
    // Same tag, same previous lift — but the card has gone. Back to the line.
    const apart = restingOffsets([t], [card(340, 900)], {}, close, 'y', GAP)
    expect(apart['a->b']).toBe(0)
  })
})

describe('avoid — a close card pushes the tag outside its area', () => {
  it('lifts the tag clear of a card sitting under the anchor', () => {
    const t = tag('a->b', 400, 300)
    const c = card(340, 280) // straddles the anchor
    const offs = restingOffsets([t], [c], {}, {}, 'y', GAP)
    const box = placed(t, offs['a->b'])
    expect(boxesIntersect(box, c)).toBe(false)
  })

  it('leaves a real gap — outside the area, not just touching it', () => {
    const t = tag('a->b', 400, 300)
    const c = card(340, 280)
    const offs = restingOffsets([t], [c], {}, {}, 'y', GAP)
    expect(gapTo(placed(t, offs['a->b']), c)).toBeGreaterThanOrEqual(GAP)
  })

  it('scales the clearance with the configured gap', () => {
    const t = tag('a->b', 400, 300)
    const c = card(340, 280)
    const wide = restingOffsets([t], [c], {}, {}, 'y', 24)
    expect(gapTo(placed(t, wide['a->b']), c)).toBeGreaterThanOrEqual(24)
  })

  it('keeps two tags on the same crowded anchor off each other', () => {
    const a = tag('a->b', 400, 300)
    const b = tag('c->d', 400, 300)
    const offs = restingOffsets([a, b], [card(340, 280)], {}, {}, 'y', GAP)
    expect(boxesIntersect(placed(a, offs['a->b']), placed(b, offs['c->d']))).toBe(false)
  })

  it('still moves a tag boxed in on both sides rather than leaving it centred', () => {
    // Cards above and below with no clear lane: the search cannot fully clear,
    // and must return its least-overlap position instead of giving up at 0.
    const t = tag('a->b', 400, 300)
    const cards = [card(340, 285), card(340, 200), card(340, 380)]
    const offs = restingOffsets([t], cards, {}, {}, 'y', GAP)
    expect(offs['a->b']).not.toBe(0)
  })
})

describe('manual — a dragged tag is left alone', () => {
  it('does not emit an auto offset for a hand-placed tag', () => {
    const offs = restingOffsets([tag('a->b', 400, 300)], [card(340, 280)], { 'a->b': 70 }, {}, 'y', GAP)
    expect(offs['a->b']).toBeUndefined()
  })

  it('holds the manual offset even where the auto pass would not have lifted', () => {
    // Wide-open layout: auto would return 0. The manual value must survive it.
    const offs = restingOffsets([tag('a->b', 400, 400)], [card(0, 0)], { 'a->b': 55 }, {}, 'y', GAP)
    expect(offs['a->b']).toBeUndefined()
  })

  it('routes an auto tag around a hand-placed sibling', () => {
    const manualTag = tag('a->b', 400, 300)
    const autoTag = tag('c->d', 400, 300)
    const offs = restingOffsets([manualTag, autoTag], [], { 'a->b': 0 }, {}, 'y', GAP)
    // The manual tag is pinned on the line, so the auto one must yield.
    expect(offs['c->d']).not.toBe(0)
    expect(boxesIntersect(placed(manualTag, 0), placed(autoTag, offs['c->d']))).toBe(false)
  })
})

describe('re-runnable — safe to call on every node move', () => {
  it('is idempotent: feeding a pass its own output reproduces it', () => {
    const tags = [tag('a->b', 400, 300), tag('c->d', 410, 306)]
    const cards = [card(340, 280)]
    const first = restingOffsets(tags, cards, {}, {}, 'y', GAP)
    const second = restingOffsets(tags, cards, {}, first, 'y', GAP)
    expect(second).toEqual(first)
  })

  it('holds a still-valid lift instead of re-searching to a different side', () => {
    const t = tag('a->b', 400, 300)
    const cards = [card(340, 280)]
    const settled = restingOffsets([t], cards, {}, {}, 'y', GAP)
    // Hand it a previous lift on the opposite side that is also clear; it
    // should keep that one rather than snapping back across the line.
    const opposite = -Math.abs(settled['a->b']) - 40
    const held = restingOffsets([t], cards, {}, { 'a->b': opposite }, 'y', GAP)
    expect(held['a->b']).toBe(opposite)
  })

  it('does not depend on the order tags are supplied in', () => {
    const a = tag('a->b', 400, 300)
    const b = tag('c->d', 404, 304)
    const cards = [card(340, 280)]
    expect(restingOffsets([b, a], cards, {}, {}, 'y', GAP)).toEqual(
      restingOffsets([a, b], cards, {}, {}, 'y', GAP),
    )
  })
})
