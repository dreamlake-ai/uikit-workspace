// Flow-layout virtual list. Same external API as VirtualList, but items
// render in normal document flow instead of absolute + transform.
//
// Layout shape:
//
//   <div class="scroll container, overflow-auto, height=props.height">
//     [stickyHeader]                                ← optional, position:sticky
//     <div style={{paddingTop, paddingBottom}}>     ← flow shell
//       <Item />  ← visible items, in normal flow
//       <Item />
//       ...
//     </div>
//     [loadingMore footer]
//   </div>
//
// `paddingTop` and `paddingBottom` reserve the space the off-screen
// items would occupy. Since items are in normal flow (not absolutely
// positioned), the document's own height = paddings + sum of visible
// item heights, and the scroll container scrolls naturally.
//
// Why this matters vs the absolute+transform sibling VirtualList:
//   - `position: sticky` inside an item works relative to the SCROLL
//     CONTAINER (not the item) — items are no longer containing blocks
//     for sticky descendants
//   - CSS `gap`, `margin`, `padding` on the flow shell work naturally
//   - No transform-induced compositing layer per item
//   - Browser's overflow-anchor keeps scroll position stable when
//     off-screen item heights change (e.g. async measurement)

import {
  forwardRef,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "../../lib/utils";
import type { VirtualListProps } from "../VirtualList/types";
import { useVirtualListFlow } from "./useVirtualListFlow";

interface VirtualListFlowComponentProps<T>
  extends
    Omit<ComponentProps<"div">, "children" | "onScroll">,
    VirtualListProps<T> {}

function VirtualListFlowInner<T>(
  {
    items,
    itemHeight,
    estimatedItemHeight = 40,
    height = "100%",
    overscan = 3,
    getItemKey,
    children,
    onScroll,
    onRangeChange,
    className,
    style,
    hasMore = false,
    loadingMore = false,
    onLoadMore,
    loadMoreThreshold = 80,
    renderLoadingMore,
    stickyHeader,
    stickyHeaderHeight = 0,
    ...props
  }: VirtualListFlowComponentProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current =
        node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  // Observe scroll container size so visibleRange recalculates when
  // the panel resizes (e.g. parent layout shift).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    ro.observe(container);
    setContainerHeight(container.clientHeight);
    return () => ro.disconnect();
  }, []);

  // Measurement bookkeeping. `measurements` is a stable Map (kept in a
  // ref); `measurementVersion` is the signal for re-running the layout
  // useMemo. React 18 auto-batches the multiple bumpVersion calls that
  // happen inside a single ResizeObserver batch into one re-render.
  const measurementsRef = useRef<Map<number, number>>(new Map());
  const [measurementVersion, bumpVersion] = useReducer(
    (n: number) => n + 1,
    0,
  );
  const measureItem = useCallback(
    (index: number, height: number) => {
      const current = measurementsRef.current.get(index);
      if (current === height) return;
      measurementsRef.current.set(index, height);
      bumpVersion();
    },
    [bumpVersion],
  );

  const { visibleRange, spaceAbove, spaceBelow, itemStyle } = useVirtualListFlow(
    {
      itemCount: items.length,
      itemHeight,
      estimatedItemHeight,
      containerHeight: Math.max(0, containerHeight - stickyHeaderHeight),
      overscan,
      scrollTop,
      measurements: measurementsRef.current,
      measurementVersion,
    },
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop: st, scrollHeight, clientHeight } = e.currentTarget;
      setScrollTop(st);
      onScroll?.(st);
      if (hasMore && !loadingMore && onLoadMore) {
        if (scrollHeight - st - clientHeight < loadMoreThreshold) {
          onLoadMore();
        }
      }
    },
    [hasMore, loadingMore, onLoadMore, loadMoreThreshold, onScroll],
  );

  const prevRangeRef = useRef({ start: -1, end: -1 });
  useEffect(() => {
    if (
      visibleRange.start !== prevRangeRef.current.start ||
      visibleRange.end !== prevRangeRef.current.end
    ) {
      prevRangeRef.current = visibleRange;
      onRangeChange?.(visibleRange.start, visibleRange.end);
    }
  }, [visibleRange, onRangeChange]);

  const isDynamic = itemHeight === "dynamic";

  const visibleItems: ReactNode[] = [];
  for (
    let i = visibleRange.start;
    i <= visibleRange.end && i < items.length;
    i++
  ) {
    const item = items[i];
    const key = getItemKey ? getItemKey(item, i) : i;
    visibleItems.push(
      <VirtualListFlowItem
        key={key}
        index={i}
        isDynamic={isDynamic}
        measureItem={measureItem}
      >
        {children(item, i, itemStyle)}
      </VirtualListFlowItem>,
    );
  }

  return (
    <div
      ref={setRefs}
      className={cn("relative w-full overflow-auto", className)}
      style={{ height, ...style }}
      onScroll={handleScroll}
      {...props}
    >
      {stickyHeader && stickyHeaderHeight > 0 && (
        <div className="sticky top-0 z-10">{stickyHeader}</div>
      )}
      <div
        style={{
          paddingTop: spaceAbove,
          paddingBottom: spaceBelow,
        }}
      >
        {visibleItems}
      </div>
      {loadingMore && (
        <div className="py-3 text-center text-xs font-uikit-ui text-uikit-muted opacity-70">
          {renderLoadingMore ?? "Loading more…"}
        </div>
      )}
    </div>
  );
}

// One ResizeObserver per visible item, attached to the wrapper div.
// In dynamic mode the wrapper has no inline height so the browser sizes
// it to content; the observer reports any change back to the parent's
// measurements map. In fixed mode there's no observer — the height
// comes from props directly and we don't wrap children at all.
function VirtualListFlowItem({
  children,
  index,
  isDynamic,
  measureItem,
}: {
  children: ReactNode;
  index: number;
  isDynamic: boolean;
  measureItem: (index: number, height: number) => void;
}) {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDynamic || !itemRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        measureItem(index, entry.contentRect.height);
      }
    });
    ro.observe(itemRef.current);
    measureItem(index, itemRef.current.offsetHeight);
    return () => ro.disconnect();
  }, [index, isDynamic, measureItem]);

  if (!isDynamic) return <>{children}</>;

  return <div ref={itemRef}>{children}</div>;
}

export const VirtualListFlow = forwardRef(VirtualListFlowInner) as <T>(
  props: VirtualListFlowComponentProps<T> & {
    ref?: React.ForwardedRef<HTMLDivElement>;
  },
) => React.ReactElement;
