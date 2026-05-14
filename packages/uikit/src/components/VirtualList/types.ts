import type { CSSProperties, ReactNode } from "react";

export type ItemHeight = number | "dynamic";

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: ItemHeight;
  estimatedItemHeight?: number;
  height?: number | string;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
  children: (item: T, index: number, style: CSSProperties) => ReactNode;
  onScroll?: (scrollTop: number) => void;
  onRangeChange?: (startIndex: number, endIndex: number) => void;
  className?: string;
  // Infinite scroll
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  loadMoreThreshold?: number;
  renderLoadingMore?: ReactNode;
  // Sticky header rendered inside the scroll container (aligns with items when scrollbar appears)
  stickyHeader?: ReactNode;
  stickyHeaderHeight?: number;
}

export interface ItemMeasurement {
  offset: number;
  height: number;
}

export interface UseVirtualListOptions<T> {
  items: T[];
  itemHeight: ItemHeight;
  estimatedItemHeight: number;
  containerHeight: number;
  overscan: number;
  scrollTop: number;
}

export interface UseVirtualListResult {
  visibleRange: { start: number; end: number };
  totalHeight: number;
  getItemStyle: (index: number) => CSSProperties;
  measureItem: (index: number, height: number) => void;
  measurements: Map<number, ItemMeasurement>;
}
