import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "../../lib/utils";
import type { VirtualListProps } from "./types";
import { useVirtualList } from "./useVirtualList";

interface VirtualListComponentProps<T>
  extends
    Omit<ComponentProps<"div">, "children" | "onScroll">,
    VirtualListProps<T> {}

function VirtualListInner<T>(
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
  }: VirtualListComponentProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
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
    [ref]
  );

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

  const { visibleRange, totalHeight, getItemStyle, measureItem } =
    useVirtualList({
      items,
      itemHeight,
      estimatedItemHeight,
      containerHeight,
      overscan,
      scrollTop,
    });

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
    [hasMore, loadingMore, onLoadMore, loadMoreThreshold, onScroll]
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
  const dynamicChildStyle = { width: "100%" };

  const visibleItems: ReactNode[] = [];
  for (
    let i = visibleRange.start;
    i <= visibleRange.end && i < items.length;
    i++
  ) {
    const item = items[i];
    const key = getItemKey ? getItemKey(item, i) : i;
    const itemStyle = getItemStyle(i);

    visibleItems.push(
      <VirtualListItem
        key={key}
        index={i}
        isDynamic={isDynamic}
        measureItem={measureItem}
        style={itemStyle}
      >
        {children(item, i, isDynamic ? dynamicChildStyle : itemStyle)}
      </VirtualListItem>
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
      <div className="relative w-full" style={{ height: totalHeight }}>
        {visibleItems}
      </div>
      {loadingMore && (
        <div className="py-3 text-center text-xs font-uikit-ui text-uikit-muted opacity-70">
          {renderLoadingMore ?? 'Loading more…'}
        </div>
      )}
    </div>
  );
}

function VirtualListItem({
  children,
  index,
  isDynamic,
  measureItem,
  style,
}: {
  children: ReactNode;
  index: number;
  isDynamic: boolean;
  measureItem: (index: number, height: number) => void;
  style: React.CSSProperties;
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

  return (
    <div ref={itemRef} style={style}>
      {children}
    </div>
  );
}

export const VirtualList = forwardRef(VirtualListInner) as <T>(
  props: VirtualListComponentProps<T> & {
    ref?: React.ForwardedRef<HTMLDivElement>;
  }
) => React.ReactElement;

export type { VirtualListProps };
