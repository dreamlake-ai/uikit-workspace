export interface BreadcrumbNode {
  id: string;
  name: string;
  /** When false, hides the chevron indicator — signals no sub-children exist. */
  hasChildren?: boolean;
}

export interface FetchChildrenResult {
  items: BreadcrumbNode[];
  totalPages: number;
}

export interface ColumnData {
  items: BreadcrumbNode[];
  page: number;
  totalPages: number;
  hasMore: boolean;
  loading: boolean;
  error: Error | null;
}
