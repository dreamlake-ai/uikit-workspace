/**
 * panel-box.ts — where a panel sits, expressed as CSS math instead of measured.
 *
 * Content inside a panel sometimes needs to know that panel's own left offset
 * and width — a column centered on the VIEWPORT rather than on its panel, a
 * header eyebrow that must line up with the body beneath it, an overlay that
 * has to agree with both. The obvious way to get those numbers is to measure
 * the panel with a ResizeObserver. That way is a trap: an observer callback
 * fires AFTER layout and its setState commits on the NEXT frame, so during any
 * animation that moves the panel (a collapsing sidebar, a resizing window) the
 * content is always chasing an edge that has already moved on, and it visibly
 * shakes.
 *
 * It doesn't need to be measured at all. A panel's box is a purely arithmetic
 * function of the panel area and the split ratios above it, and the split
 * ratios are React state the layout already holds. So instead of a number, each
 * level of the tree hands its children a `calc()`-able EXPRESSION STRING built
 * from those ratios — `var(--panel-area-w) * 0.62 + 10px` and so on — which
 * <PanelLayout> publishes on each leaf as `--panel-x` / `--panel-w`. The
 * browser evaluates it in the same layout pass that resolves whatever the
 * expression bottoms out in, every frame, for free. Nothing can lag, because
 * nothing is being observed.
 *
 * The strings are rebuilt only when the layout tree changes (a split, a drag
 * that commits a new ratio) — never during an animation.
 *
 * React/DOM-free at module scope, so it is importable from a plain unit test
 * and safe under SSR.
 */

/** Thickness (px) of the `Divider` between two split children. Must match the
 *  `w-[10px]` / `h-[10px]` on PanelLayout's `Divider`. */
export const DIVIDER_PX = 10

/**
 * A panel's box as CSS math: `x` is its left edge measured from the VIEWPORT's
 * left edge, `w` its width. Both are raw expressions (no `calc()` wrapper) so
 * they compose by concatenation; wrap once at the point of use.
 */
export interface PanelBox {
  x: string
  w: string
}

/** The whole panel area — the box a panel tree's root node occupies.
 *
 *  The two variables are the CONTRACT with the host: it declares them on (or
 *  above) the element it mounts <PanelLayout> into, describing where the panel
 *  area sits in the viewport and how wide it is — typically as a `calc()` of
 *  whatever chrome surrounds it, so the whole chain stays resolvable in one
 *  layout pass. A host with different variable names passes its own root box to
 *  <PanelLayout> instead of renaming these. */
export const ROOT_PANEL_BOX: PanelBox = {
  x: 'var(--panel-area-x)',
  w: 'var(--panel-area-w)',
}

/** Trim float noise so the emitted expressions stay readable in devtools. */
function num(n: number): string {
  return String(Number(n.toFixed(6)))
}

/**
 * The box of child `index` of a split whose children have flex-grow `sizes`.
 *
 * A `column` split stacks vertically, so the children inherit the parent's
 * horizontal box untouched. A `row` split divides the parent's width minus the
 * dividers between the children, in proportion to `sizes` — mirroring the
 * `basis-0` + `flexGrow: sizes[i]` layout the renderer actually produces.
 */
export function splitChildBox(
  parent: PanelBox,
  sizes: number[],
  index: number,
  dir: 'row' | 'column',
): PanelBox {
  if (dir === 'column') return parent

  const total = sizes.reduce((a, b) => a + b, 0)
  // Degenerate tree (all-zero or empty sizes): fall back to the parent box
  // rather than emitting a division by zero.
  if (!(total > 0)) return parent

  const gaps = (sizes.length - 1) * DIVIDER_PX
  // The width actually available to the children, dividers removed.
  const avail = gaps > 0 ? `(${parent.w} - ${gaps}px)` : parent.w

  const before = sizes.slice(0, index).reduce((a, b) => a + b, 0) / total
  const frac = sizes[index] / total

  const xParts = [parent.x]
  if (before > 0) xParts.push(`${avail} * ${num(before)}`)
  // Every divider to this child's left also pushes it right.
  if (index > 0) xParts.push(`${index * DIVIDER_PX}px`)

  return {
    x: xParts.length === 1 ? parent.x : `(${xParts.join(' + ')})`,
    w: frac === 1 ? avail : `(${avail} * ${num(frac)})`,
  }
}

/**
 * Where a divider drag puts the boundary between two adjacent children.
 *
 * Pure, and deliberately expressed in the SIZES' OWN UNITS rather than in
 * percent. Two things went wrong when it wasn't:
 *
 *  • `sizes` are flex-grow weights, and nothing forces them to total 100. A tree
 *    built with `[1, 1]` has a span of 2, so a minimum computed as a percentage
 *    (12, for a 1000px container) exceeds the whole span — the clamp then drives
 *    the far side NEGATIVE, and a negative flex-grow silently collapses a panel.
 *  • Flex distributes `containerPx` MINUS the dividers between the children.
 *    Scaling the cursor delta by the full container makes the boundary lag the
 *    cursor by the dividers' share — about 5% across three children in 400px,
 *    which is visible as drift on a slow drag.
 *
 * Scaling the delta by `span / availPx` fixes both at once, at any weight scale.
 */
export function resizeSplit(opts: {
  /** The flex container's full length along the split axis, in px. */
  containerPx: number
  /** How many children the split has (the dividers between them are excluded). */
  childCount: number
  /** Cursor travel since the drag began, in px. */
  deltaPx: number
  /** Sizes of the two children either side of the divider, as of the grab. */
  a: number
  b: number
  /** Smallest a panel may be dragged to, in px. */
  minPx: number
}): { a: number; b: number } {
  const { containerPx, childCount, deltaPx, a, b, minPx } = opts
  const span = a + b
  const availPx = containerPx - Math.max(0, childCount - 1) * DIVIDER_PX
  // A container too small to measure against: leave the split untouched rather
  // than dividing by zero and writing NaN into every size.
  if (!(availPx > 0) || !(span > 0)) return { a, b }

  // Never let the minimum exceed half the span — in a container too small for
  // two minimum-width panels the honest answer is to split it evenly, not to
  // produce a clamp whose lower bound is above its upper bound.
  const minShare = Math.min((minPx / availPx) * span, span / 2)
  const next = Math.max(minShare, Math.min(span - minShare, a + (deltaPx / availPx) * span))
  return { a: next, b: span - next }
}
