import type { ReactNode } from "react";

export interface BreadcrumbNode {
  id: string;
  name: string;
  /** Presentation label; name remains the navigation/path key. */
  displayName?: string;
  /** Optional resource glyph for tree rows; defaults to a folder. */
  icon?: ReactNode;
  /** When false, hides the chevron indicator — signals no sub-children exist. */
  hasChildren?: boolean;
}

/**
 * Which layout the panel body uses.
 *
 * `columns` — Miller columns: one column per level of the current path, each
 * listing that node's children. Depth is the only axis, so the panel always
 * shows exactly one root→leaf path and sibling branches are collapsed away.
 *
 * `tree` — the whole expanded tree as one top-to-bottom flow that wraps into
 * columns at the panel's height. Breadth survives (several branches open at
 * once) at the cost of a column meaning nothing: column two is simply what did
 * not fit in column one. Both scroll horizontally and never vertically.
 */
export type BreadcrumbView = "columns" | "tree";

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
 *  and it is also what the tree itself replays to undo its own optimistic
 *  edit when the host rejects the move. */
export interface BreadcrumbMove {
  source: BreadcrumbNode;
  /** The parent it is leaving. `null` = the tree root. */
  from: BreadcrumbNode | null;
  /** Ancestor chain root→`from`, the mirror of `to.parentPath`. `from` alone
   *  names the parent but not the path to it, which is what a host keyed by
   *  path — as this tree's own `fetchChildren` is — needs to undo the move. */
  fromPath: BreadcrumbNode[];
  to: BreadcrumbDropTarget;
}

export interface BreadcrumbDragAndDrop {
  /**
   * Commit the move.
   *
   * The tree has ALREADY moved the row in its own cache by the time this
   * runs — it does not wait, and it does not refetch. A re-parent is one
   * splice and one push; refetching the tree to learn that is what made the
   * rest of the panel blink and collapse back to its unexpanded state on
   * every drag, which is a far bigger event on screen than the one thing
   * that actually changed.
   *
   * So: return a promise that REJECTS to say the move failed, and the tree
   * puts the row back where it came from. Resolving (or returning void) means
   * it stuck — the host does not need to bump `refreshToken` to confirm it,
   * and doing so only spends a round of fetches to redraw what is on screen.
   */
  onMove: (move: BreadcrumbMove) => void | Promise<void>;
  /** Host veto, on top of the built-in self/descendant/no-op guards. */
  canDrop?: (source: BreadcrumbNode, target: BreadcrumbDropTarget) => boolean;
  /** Dwell before a hovered row springs its column open. Default 500ms. */
  springDelayMs?: number;
}
