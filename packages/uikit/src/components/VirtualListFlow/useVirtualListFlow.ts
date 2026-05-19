import { useMemo } from "react";
import type {
  UseVirtualListFlowOptions,
  UseVirtualListFlowResult,
} from "./types";

// Resolved height of item at `i`: measured if present, otherwise the
// caller-provided estimate. For fixed-height mode the height is the
// same constant for every index — handled outside via early returns.
function heightAt(
  index: number,
  measurements: Map<number, number>,
  fallback: number,
): number {
  return measurements.get(index) ?? fallback;
}

// Binary-search for the index whose cumulative top crosses `scrollTop`.
// Uses an offset accumulator built lazily; for typical N this is fast
// enough even when called every scroll event (the heavy lifting is in
// the useMemo wrapper above).
function findStartIndex(
  itemCount: number,
  scrollTop: number,
  measurements: Map<number, number>,
  estimatedItemHeight: number,
): number {
  if (itemCount === 0) return 0;
  if (scrollTop <= 0) return 0;
  let cumulative = 0;
  for (let i = 0; i < itemCount; i++) {
    const h = heightAt(i, measurements, estimatedItemHeight);
    if (cumulative + h > scrollTop) return i;
    cumulative += h;
  }
  return itemCount - 1;
}

export function useVirtualListFlow(
  opts: UseVirtualListFlowOptions,
): UseVirtualListFlowResult {
  const {
    itemCount,
    itemHeight,
    estimatedItemHeight,
    containerHeight,
    overscan,
    scrollTop,
    measurements,
    measurementVersion,
  } = opts;

  const isFixed = typeof itemHeight === "number";

  return useMemo(() => {
    if (itemCount === 0) {
      return {
        visibleRange: { start: 0, end: 0 },
        totalHeight: 0,
        spaceAbove: 0,
        spaceBelow: 0,
        itemStyle: { width: "100%" },
      };
    }

    if (isFixed) {
      const h = itemHeight as number;
      const totalHeight = itemCount * h;
      const rawStart = Math.floor(scrollTop / h);
      const rawEnd = Math.ceil((scrollTop + containerHeight) / h);
      const start = Math.max(0, rawStart - overscan);
      const end = Math.min(itemCount - 1, rawEnd + overscan);
      return {
        visibleRange: { start, end },
        totalHeight,
        spaceAbove: start * h,
        spaceBelow: Math.max(0, (itemCount - 1 - end) * h),
        itemStyle: { width: "100%", height: h },
      };
    }

    // Dynamic height: walk the items, computing cumulative offset and
    // total height in one pass. Visible range starts at the first item
    // whose bottom edge crosses scrollTop, ends at the first item whose
    // top edge passes scrollTop + containerHeight.
    const rawStart = findStartIndex(
      itemCount,
      scrollTop,
      measurements,
      estimatedItemHeight,
    );
    const start = Math.max(0, rawStart - overscan);

    let spaceAbove = 0;
    for (let i = 0; i < start; i++) {
      spaceAbove += heightAt(i, measurements, estimatedItemHeight);
    }

    let cumulative = spaceAbove;
    let rawEnd = rawStart;
    const viewportBottom = scrollTop + containerHeight;
    for (let i = start; i < itemCount; i++) {
      cumulative += heightAt(i, measurements, estimatedItemHeight);
      if (cumulative >= viewportBottom) {
        rawEnd = i;
        break;
      }
      rawEnd = i;
    }
    const end = Math.min(itemCount - 1, rawEnd + overscan);

    // Continue the walk to compute total height for items below `end`.
    let totalHeight = cumulative;
    let spaceBelow = 0;
    for (let i = rawEnd + 1; i < itemCount; i++) {
      const h = heightAt(i, measurements, estimatedItemHeight);
      totalHeight += h;
      if (i > end) spaceBelow += h;
    }
    // Also fold remaining overscan items (rawEnd+1..end) — they're
    // visible, so they go to neither spaceAbove nor spaceBelow.
    // (cumulative already counted them implicitly above.)

    return {
      visibleRange: { start, end },
      totalHeight,
      spaceAbove,
      spaceBelow,
      itemStyle: { width: "100%" },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    itemCount,
    itemHeight,
    isFixed,
    estimatedItemHeight,
    containerHeight,
    overscan,
    scrollTop,
    measurements,
    measurementVersion,
  ]);
}
