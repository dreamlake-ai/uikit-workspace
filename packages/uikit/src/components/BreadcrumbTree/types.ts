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

/** Where a dragged row would land. */
export interface BreadcrumbDropTarget {
  /** Node the item lands inside. `null` means the tree root. */
  parent: BreadcrumbNode | null;
  /** Ancestor chain root→parent, so the host can rebuild a path key. */
  parentPath: BreadcrumbNode[];
  /** "into" = dropped on a row; "level" = dropped on a column's empty space,
   *  meaning "become a child of that column's own parent". There is no
   *  ordering in this model, so neither carries a sibling index. */
  kind: "into" | "level";
}

/** A completed drag: what moved, where it left, where it landed. `from` is
 *  what makes the move reversible — the host cannot recover it afterwards,
 *  because by then the tree has already been refetched. */
export interface BreadcrumbMove {
  source: BreadcrumbNode;
  /** The parent it is leaving. `null` = the tree root. */
  from: BreadcrumbNode | null;
  to: BreadcrumbDropTarget;
}

export interface BreadcrumbDragAndDrop {
  /** Commit the move. Rejecting/throwing leaves the tree untouched. */
  onMove: (move: BreadcrumbMove) => void | Promise<void>;
  /** Host veto, on top of the built-in self/descendant/no-op guards. */
  canDrop?: (
    source: BreadcrumbNode,
    target: BreadcrumbDropTarget
  ) => boolean;
  /** Dwell before a hovered row springs its column open. Default 500ms. */
  springDelayMs?: number;
}
