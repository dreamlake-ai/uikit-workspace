import { expect, it } from 'vitest'
import { DIVIDER_PX, ROOT_PANEL_BOX, resizeSplit, splitChildBox, type PanelBox } from './panel-box'

// ─────────────────────────────────────────────────────────────────────────────
// panel-box — the CSS math that tells content inside a panel where that panel is,
// replacing the ResizeObserver that would otherwise measure it (and lag a frame
// behind any animation that moves the panel, making the content shake).
//
// The emitted strings are only correct if they evaluate to the SAME numbers the
// flex layout produces. So rather than assert on string shape — which would lock in
// formatting and prove nothing — these tests EVALUATE the expressions and compare
// against an independent reference implementation of the layout.
// ─────────────────────────────────────────────────────────────────────────────

/** Evaluate an emitted expression for a given panel-area origin/width. Substitutes
 *  the two root variables and drops `px` (every term is px, so the arithmetic is
 *  unit-consistent and the numbers come out in px). */
function evaluate(expr: string, areaX: number, areaW: number): number {
  const js = expr
    .replaceAll('var(--panel-area-x)', '(X)')
    .replaceAll('var(--panel-area-w)', '(W)')
    .replaceAll('px', '')
  return new Function('X', 'W', `return ${js}`)(areaX, areaW) as number
}

function evalBox(box: PanelBox, areaX: number, areaW: number) {
  return { x: evaluate(box.x, areaX, areaW), w: evaluate(box.w, areaX, areaW) }
}

/** Independent reference: what the browser's flex layout actually produces for
 *  `basis-0` children with `flexGrow: sizes[i]` separated by DIVIDER_PX dividers. */
function referenceRow(areaX: number, areaW: number, sizes: number[]) {
  const total = sizes.reduce((a, b) => a + b, 0)
  const avail = areaW - (sizes.length - 1) * DIVIDER_PX
  const out: { x: number; w: number }[] = []
  let cursor = areaX
  for (const s of sizes) {
    const w = avail * (s / total)
    out.push({ x: cursor, w })
    cursor += w + DIVIDER_PX
  }
  return out
}

it('[panel-box] the root box is the whole panel area', () => {
  expect(evalBox(ROOT_PANEL_BOX, 228, 1000)).toStrictEqual({ x: 228, w: 1000 })
})

it('[panel-box] a row split matches the flex layout it mirrors', () => {
  const areaX = 228
  const areaW = 1000
  for (const sizes of [[0.62, 0.38], [1, 1], [2, 1, 1], [0.5, 0.2, 0.3]]) {
    const expected = referenceRow(areaX, areaW, sizes)
    sizes.forEach((_, i) => {
      const got = evalBox(splitChildBox(ROOT_PANEL_BOX, sizes, i, 'row'), areaX, areaW)
      expect(
        Math.abs(got.x - expected[i].x) < 1e-6 && Math.abs(got.w - expected[i].w) < 1e-6,
        `sizes=${JSON.stringify(sizes)} child ${i}: got ${JSON.stringify(got)}, want ${JSON.stringify(expected[i])}`,
      ).toBe(true)
    })
    // The children plus the dividers must exactly refill the parent — no drift.
    const spanned = sizes.reduce(
      (a, _, i) => a + evalBox(splitChildBox(ROOT_PANEL_BOX, sizes, i, 'row'), areaX, areaW).w,
      0,
    ) + (sizes.length - 1) * DIVIDER_PX
    expect(
      Math.abs(spanned - areaW) < 1e-6,
      `sizes=${JSON.stringify(sizes)} spans ${spanned}, want ${areaW}`,
    ).toBe(true)
  }
})

it('[panel-box] a column split leaves the horizontal box untouched', () => {
  // Vertical stacking doesn't change x/w, so a centered content column above and
  // below a horizontal divider stays on the same column.
  const child = splitChildBox(ROOT_PANEL_BOX, [1, 1], 1, 'column')
  expect(evalBox(child, 228, 1000)).toStrictEqual({ x: 228, w: 1000 })
})

it('[panel-box] nested splits compose', () => {
  const areaX = 228
  const areaW = 1000
  // Primary 62% | (editor over terminal) 38% — a common layout. The primary leaf
  // is a row child; the terminal is a column child of the right row child, so it
  // inherits the right child's horizontal box exactly.
  const right = splitChildBox(ROOT_PANEL_BOX, [0.62, 0.38], 1, 'row')
  const terminal = splitChildBox(right, [1, 1], 1, 'column')
  expect(evalBox(terminal, areaX, areaW)).toStrictEqual(evalBox(right, areaX, areaW))

  const [refPrimary, refRight] = referenceRow(areaX, areaW, [0.62, 0.38])
  const primary = evalBox(splitChildBox(ROOT_PANEL_BOX, [0.62, 0.38], 0, 'row'), areaX, areaW)
  expect(Math.abs(primary.x - refPrimary.x) < 1e-6 && Math.abs(primary.w - refPrimary.w) < 1e-6).toBe(true)
  const rightEval = evalBox(right, areaX, areaW)
  expect(Math.abs(rightEval.x - refRight.x) < 1e-6 && Math.abs(rightEval.w - refRight.w) < 1e-6).toBe(true)

  // Three levels deep still tracks: split the primary leaf again.
  const inner = splitChildBox(splitChildBox(ROOT_PANEL_BOX, [0.62, 0.38], 0, 'row'), [1, 1], 1, 'row')
  const innerEval = evalBox(inner, areaX, areaW)
  const innerRef = referenceRow(refPrimary.x, refPrimary.w, [1, 1])[1]
  expect(
    Math.abs(innerEval.x - innerRef.x) < 1e-6 && Math.abs(innerEval.w - innerRef.w) < 1e-6,
    `got ${JSON.stringify(innerEval)}, want ${JSON.stringify(innerRef)}`,
  ).toBe(true)
})

it('[panel-box] a degenerate all-zero split falls back to the parent box', () => {
  // Guard against emitting a division by zero into the stylesheet, which would make
  // --panel-x invalid and silently drop the column's gutter.
  const child = splitChildBox(ROOT_PANEL_BOX, [0, 0], 1, 'row')
  expect(evalBox(child, 228, 1000)).toStrictEqual({ x: 228, w: 1000 })
  expect(evalBox(splitChildBox(ROOT_PANEL_BOX, [], 0, 'row'), 228, 1000)).toStrictEqual({ x: 228, w: 1000 })
})

// ── divider drag arithmetic ──────────────────────────────────────────────────

it('[panel-box] resizeSplit moves the boundary 1:1 with the cursor', () => {
  // 3 children in 400px → 380px of flex space once the two dividers are removed.
  // Dragging 38px must move the boundary by exactly 10% of the SPAN; scaling by
  // the full 400px instead would move it 9.5% and let the edge drift behind the
  // cursor on a slow drag.
  const { a, b } = resizeSplit({ containerPx: 400, childCount: 3, deltaPx: 38, a: 50, b: 50, minPx: 10 })
  expect(a).toBeCloseTo(60, 6)
  expect(b).toBeCloseTo(40, 6)
  expect(a + b, 'the pair keeps its span').toBeCloseTo(100, 6)
})

it('[panel-box] resizeSplit works at ANY weight scale, never going negative', () => {
  // `sizes` are flex-grow weights and nothing forces them to total 100. With
  // [1, 1] a percentage-based minimum (12 for a 1000px container) exceeds the
  // whole span of 2 — the old clamp drove the far side to -10, and a negative
  // flex-grow silently collapses a panel.
  const { a, b } = resizeSplit({ containerPx: 1000, childCount: 2, deltaPx: 0, a: 1, b: 1, minPx: 120 })
  expect(a).toBeGreaterThan(0)
  expect(b, 'never negative').toBeGreaterThan(0)
  expect(a + b).toBeCloseTo(2, 6)

  // Same drag, same proportions, whatever the scale the host happened to use.
  const pct = resizeSplit({ containerPx: 1000, childCount: 2, deltaPx: 99, a: 50, b: 50, minPx: 120 })
  const unit = resizeSplit({ containerPx: 1000, childCount: 2, deltaPx: 99, a: 1, b: 1, minPx: 120 })
  expect(unit.a / (unit.a + unit.b)).toBeCloseTo(pct.a / (pct.a + pct.b), 6)
})

it('[panel-box] resizeSplit clamps to minPx and stays sane in a container too small for two', () => {
  const span = 100
  // Drag far past the left edge: the near side bottoms out at minPx' share.
  const left = resizeSplit({ containerPx: 1000, childCount: 2, deltaPx: -9999, a: 50, b: 50, minPx: 200 })
  expect(left.a).toBeCloseTo((200 / 990) * span, 6)
  const right = resizeSplit({ containerPx: 1000, childCount: 2, deltaPx: 9999, a: 50, b: 50, minPx: 200 })
  expect(right.b).toBeCloseTo((200 / 990) * span, 6)

  // 300px of flex space cannot hold two 200px panels. Splitting it evenly is the
  // honest answer; a raw clamp would have a lower bound above its upper bound.
  const tight = resizeSplit({ containerPx: 310, childCount: 2, deltaPx: -9999, a: 50, b: 50, minPx: 200 })
  expect(tight.a).toBeCloseTo(50, 6)
  expect(tight.b).toBeCloseTo(50, 6)
})

it('[panel-box] resizeSplit leaves a degenerate split alone instead of writing NaN', () => {
  expect(resizeSplit({ containerPx: 0, childCount: 2, deltaPx: 20, a: 50, b: 50, minPx: 120 }))
    .toStrictEqual({ a: 50, b: 50 })
  expect(resizeSplit({ containerPx: 1000, childCount: 2, deltaPx: 20, a: 0, b: 0, minPx: 120 }))
    .toStrictEqual({ a: 0, b: 0 })
})
