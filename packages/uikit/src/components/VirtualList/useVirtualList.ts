import {
  useCallback,
  useMemo,
  useReducer,
  useRef,
  type CSSProperties,
} from "react";
import type {
  ItemHeight,
  ItemMeasurement,
  UseVirtualListOptions,
  UseVirtualListResult,
} from "./types";

function findStartIndex(
  measurements: Map<number, ItemMeasurement>,
  itemCount: number,
  scrollTop: number,
  itemHeight: ItemHeight,
  estimatedItemHeight: number
): number {
  if (itemCount === 0) return 0;

  if (typeof itemHeight === "number") {
    return Math.floor(scrollTop / itemHeight);
  }

  let low = 0;
  let high = itemCount - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const measurement = measurements.get(mid);
    const offset = measurement?.offset ?? mid * estimatedItemHeight;

    if (offset < scrollTop) {
      low = mid + 1;
    } else if (offset > scrollTop) {
      high = mid - 1;
    } else {
      return mid;
    }
  }

  return Math.max(0, low - 1);
}

export function useVirtualList<T>({
  items,
  itemHeight,
  estimatedItemHeight,
  containerHeight,
  overscan,
  scrollTop,
}: UseVirtualListOptions<T>): UseVirtualListResult {
  const measurementsRef = useRef<Map<number, ItemMeasurement>>(new Map());
  const measurements = measurementsRef.current;

  const isFixed = typeof itemHeight === "number";

  // Version counter — bumped synchronously whenever any item is measured
  // so totalHeight and visibleRange useMemos re-run with fresh
  // measurements.
  //
  // No explicit batching: under React 18 automatic batching, multiple
  // `bumpVersion()` calls within the same JS task (typically inside one
  // ResizeObserver callback that delivers N entries) collapse into a
  // single re-render. The dispatch lands in the same task as the RO
  // callback, so the commit happens before paint — no stale-height
  // window like rAF would introduce, and no microtask indirection
  // either.
  const [measurementVersion, bumpVersion] = useReducer((n: number) => n + 1, 0);

  const totalHeight = useMemo(() => {
    if (isFixed) {
      return items.length * itemHeight;
    }
    let height = 0;
    for (let i = 0; i < items.length; i++) {
      const measurement = measurements.get(i);
      height += measurement?.height ?? estimatedItemHeight;
    }
    return height;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    items.length,
    itemHeight,
    isFixed,
    estimatedItemHeight,
    measurements,
    measurementVersion,
  ]);

  const visibleRange = useMemo(() => {
    if (items.length === 0) return { start: 0, end: 0 };

    const startIndex = findStartIndex(
      measurements,
      items.length,
      scrollTop,
      itemHeight,
      estimatedItemHeight
    );

    let endIndex: number;
    if (isFixed) {
      endIndex = Math.min(
        items.length - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight)
      );
    } else {
      let accumulatedHeight = 0;
      endIndex = startIndex;

      const startMeasurement = measurements.get(startIndex);
      const startOffset =
        startMeasurement?.offset ?? startIndex * estimatedItemHeight;
      accumulatedHeight = startOffset - scrollTop;

      while (
        endIndex < items.length - 1 &&
        accumulatedHeight < containerHeight
      ) {
        const measurement = measurements.get(endIndex);
        accumulatedHeight += measurement?.height ?? estimatedItemHeight;
        endIndex++;
      }
    }

    const start = Math.max(0, startIndex - overscan);
    const end = Math.min(items.length - 1, endIndex + overscan);

    return { start, end };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    items.length,
    scrollTop,
    containerHeight,
    overscan,
    itemHeight,
    isFixed,
    estimatedItemHeight,
    measurements,
    measurementVersion,
  ]);

  const getItemStyle = useCallback(
    (index: number): CSSProperties => {
      let top: number;

      if (isFixed) {
        top = index * (itemHeight as number);
      } else {
        const measurement = measurements.get(index);
        if (measurement) {
          top = measurement.offset;
        } else {
          let offset = 0;
          for (let i = 0; i < index; i++) {
            const m = measurements.get(i);
            offset += m?.height ?? estimatedItemHeight;
          }
          top = offset;
        }
      }

      return {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        transform: `translateY(${top}px)`,
        ...(isFixed && { height: itemHeight as number }),
      };
    },
    [itemHeight, isFixed, estimatedItemHeight, measurements]
  );

  const measureItem = useCallback(
    (index: number, height: number) => {
      const currentMeasurement = measurements.get(index);
      if (currentMeasurement?.height === height) return;

      let offset = 0;
      for (let i = 0; i < index; i++) {
        const m = measurements.get(i);
        offset += m?.height ?? estimatedItemHeight;
      }

      measurements.set(index, { offset, height });

      let currentOffset = offset + height;
      for (let i = index + 1; i < items.length; i++) {
        const m = measurements.get(i);
        if (m) {
          measurements.set(i, { ...m, offset: currentOffset });
          currentOffset += m.height;
        } else {
          break;
        }
      }

      bumpVersion();
    },
    [items.length, estimatedItemHeight, measurements, bumpVersion]
  );

  return { visibleRange, totalHeight, getItemStyle, measureItem, measurements };
}
