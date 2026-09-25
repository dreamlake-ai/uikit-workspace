import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  Fragment,
  ReactNode,
  Ref,
} from "react";
import { createPortal } from "react-dom";
import {
  Folder,
  ChevronRight,
  ChevronDown,
  Columns3,
  ListTree,
  Loader,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { ToggleButtons, ToggleButton } from "../Toggle/ToggleButtons";
import { useBreadcrumbTree } from "./useBreadcrumbTree";
import { TreeFlow } from "./TreeFlow";
import type {
  BreadcrumbNode,
  BreadcrumbView,
  FetchChildrenResult,
  BreadcrumbDragAndDrop,
  BreadcrumbDropTarget,
  BreadcrumbMove,
} from "./types";

/** Panel height, the anchor→panel gap, and the closest the panel may come to
 *  the edge of the window. */
const PANEL_H = 360;
/** How far the view toggle sits from the panel's edges. One number for both
 *  sides: the control is tucked into a corner, and a corner reads as a corner
 *  only when the two gaps match. Measured at 8 left and 1 bottom before this,
 *  which made it look dropped rather than placed. */
const TOGGLE_INSET = 8;
/** The control's own height, and with the inset below it, the strip it sits
 *  in. The body gets what is left, and the wrapped tree wraps against exactly
 *  that. */
const TOGGLE_H = 28;
const FOOTER_H = TOGGLE_H + TOGGLE_INSET;
const PANEL_GAP = 6;
const VIEWPORT_EDGE = 8;

/** Imperative access, for the moves a HOST starts. The tree applies a drag to
 *  its own cache and never refetches, so an edit it is not told about is one
 *  it cannot show — and cannot animate. */
export interface BreadcrumbTreeHandle {
  /** Apply a move to the tree's cache, as though it had made it. */
  applyMove: (move: BreadcrumbMove) => void;
  /** Put back a move the tree reported — the one an Undo needs. */
  undo: (move: BreadcrumbMove) => void;
}

export interface BreadcrumbTreeProps {
  /** Controlled navigation path, root → leaf. Empty array = nothing selected. */
  path: BreadcrumbNode[];
  /**
   * Fires on every row click (panel stays open) and on breadcrumb item
   * click (panel closes). Caller must update `path` accordingly.
   */
  onNavigate: (node: BreadcrumbNode, newPath: BreadcrumbNode[]) => void;
  /**
   * Fetch sub-children at `path` for `page` / `limit`.
   * `path` is slash-separated (e.g. `""` for root, `"datasets/droid-2024"`).
   * When `rootPath` is set the root call becomes `rootPath` and sub-calls become
   * `rootPath/folder/subfolder`.
   */
  fetchChildren: (
    path: string,
    page: number,
    limit: number,
  ) => Promise<FetchChildrenResult>;
  /**
   * Optional root prefix shown as the first breadcrumb item.
   * Typically the project or workspace name (e.g. `"my-project"`).
   * When set, all `fetchChildren` calls are prefixed with this value.
   */
  rootPath?: string;
  /** Custom empty-state renderer per column. Receives the parent node (null = root). */
  renderEmpty?: (parentNode: BreadcrumbNode | null) => ReactNode;
  /** Increment to re-fetch the deepest visible column. */
  refreshKey?: number;
  /**
   * Increment to drop the whole column cache (e.g. after the host deletes or
   * renames a node). Visible columns refetch immediately when the panel is
   * open; otherwise they refetch fresh on next open. Optional — consumers that
   * don't mutate the tree can ignore it.
   */
  refreshToken?: number;
  /** Placeholder shown in the breadcrumb when path is empty and rootPath is not set. */
  placeholder?: string;
  /**
   * Opt in to dragging rows between columns. Omit and the tree behaves
   * exactly as before — no drag handles, no drop targets, no listeners.
   * While a drag is held, dwelling on a row springs its column open, so a
   * node can be walked across to a sibling branch that the breadcrumb
   * could never show at the same time.
   */
  dnd?: BreadcrumbDragAndDrop;
  /**
   * Panel layout. Uncontrolled by default: `defaultView` picks what it opens
   * in and the in-panel toggle takes it from there. Pass `view` to drive it
   * from outside — e.g. to persist the choice per user — in which case
   * `onViewChange` is the only way it can change.
   */
  view?: BreadcrumbView;
  /** Initial layout when `view` is not supplied. Default `columns`. */
  defaultView?: BreadcrumbView;
  /** Fires whichever way the toggle is driven. */
  onViewChange?: (view: BreadcrumbView) => void;
  /** Drop the in-panel toggle — for a host that offers the switch elsewhere,
   *  or one that only ever wants a single layout. */
  hideViewToggle?: boolean;
  /** See `BreadcrumbTreeHandle`. */
  ref?: Ref<BreadcrumbTreeHandle>;
  className?: string;
}

// ── Internal trigger sub-components ──────────────────────────────────────────

function BreadcrumbItem({
  name,
  isLeaf,
  onClick,
}: {
  name: string;
  isLeaf: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-leaf={isLeaf || undefined}
      className={cn(
        "appearance-none border-0 outline-none bg-transparent p-0 mr-1 cursor-pointer",
        "font-normal leading-[1.1]",
        // Inter Tight has heavy hhea metrics (ascent ~1.33em, descent ~0.33em),
        // which push the baseline to the bottom of any line box tighter than
        // ~1.66em. The visible cap-letters then sit visibly below the row's
        // geometric center. A 1px optical shift restores alignment with the
        // adjacent SVG icons (chevron, expand button).
        "-translate-y-px",
        "transition-[color,opacity] duration-[120ms]",
        // Default: inherits parent muted color & opacity. Leaf: ink + full opacity.
        "data-[leaf]:text-uikit-ink data-[leaf]:opacity-100",
        // Hover: accent + full opacity.
        "hover:text-uikit-accent hover:opacity-100",
      )}
    >
      {name}
    </button>
  );
}

function ChevronToggle({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-open={open || undefined}
      className={cn(
        "group/chev appearance-none border-0 outline-none bg-transparent ml-px p-0.5 rounded cursor-pointer",
        "inline-flex items-center transition-colors duration-[120ms]",
        "text-uikit-muted hover:text-uikit-accent data-[open]:text-uikit-accent",
      )}
    >
      <span
        className={cn(
          "inline-flex transition-transform duration-[220ms]",
          "ease-[cubic-bezier(0.2,0.8,0.2,1)]",
          "group-data-[open]/chev:rotate-180",
        )}
      >
        <ChevronDown size={10} strokeWidth={1.5} />
      </span>
    </button>
  );
}

// ── Column row ────────────────────────────────────────────────────────────────

function TreeRow({
  node,
  selected,
  colIdx,
  rowIdx,
  onClick,
  draggable = false,
  isSource = false,
  dropState = "none",
  dragActive = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  node: BreadcrumbNode;
  selected: boolean;
  colIdx: number;
  rowIdx: number;
  onClick: () => void;
  draggable?: boolean;
  /** This row is the one being dragged — fades so the cursor reads as the item. */
  isSource?: boolean;
  /** 'into' marks this row as the destination; 'blocked' refuses it. */
  dropState?: "none" | "into" | "blocked";
  /** A drag is in flight somewhere in the tree. Selection steps back while it
   *  is, so the only loud thing on screen is the row you would drop into. */
  dragActive?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      draggable={draggable || undefined}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      data-selected={selected || undefined}
      data-source={isSource || undefined}
      data-drop={dropState !== "none" ? dropState : undefined}
      // Spring-loading navigates, so every row walked through turns
      // "selected". At full strength that trail competes with the one row
      // that actually matters, so it steps back while a drag is in flight.
      data-trail={(dragActive && selected && dropState === "none") || undefined}
      className={cn(
        "group/row appearance-none border-0 outline-none w-full text-left",
        "flex items-center gap-2 px-2 py-[5px] rounded-[var(--radius)]",
        // `leading-[15.5px]` pins the row's text line-box to the design's
        // height. Without it the row inherits `line-height: 1.5` from the
        // preflight reset, which on 13px text balloons to 19.5px and
        // makes the row taller than the design's spec.
        "font-uikit-ui text-uikit-13 leading-[15.5px] tracking-uikit-snug cursor-pointer",
        "transition-[background-color] duration-[120ms]",
        // Default: ink text, transparent bg.
        "text-uikit-ink bg-transparent font-normal",
        // Hover: ink-6 background.
        "hover:bg-uikit-ink-6",
        // Selected (wins over hover): accent-12 background, weight 500 — but the
        // LABEL stays ink. Accent text on an accent ground repeated down every
        // column reads as a wash of blue on blue; the tint and the weight carry
        // the state, and the folder glyph keeps the accent as the colour cue.
        "data-[selected]:!bg-uikit-accent-12 data-[selected]:text-uikit-ink data-[selected]:font-medium",
        // Drop destination is drawn inline below: a hairline accent ring over a
        // barely-there tint. What separates it from a selected row is the RING,
        // not more colour — so the text stays ink and stays readable, and the
        // panel never picks up a second heavy blue block mid-drag.
        // Refused: say so on the row rather than only via the cursor.
        "data-[drop=blocked]:!bg-transparent data-[drop=blocked]:!opacity-40",
        "data-[drop=blocked]:cursor-no-drop",
        // The row being dragged.
        "data-[source]:!opacity-55",
        // A selected row passed through mid-drag.
        "data-[trail]:!opacity-45",
      )}
      style={{
        // Stagger animation depends on column + row index (runtime).
        animation: `uikit-row-in 240ms ${
          colIdx * 45 + rowIdx * 20
        }ms cubic-bezier(0.2, 0.8, 0.2, 1) both`,
        // Inline, not Tailwind: the arbitrary `shadow-[inset_…]` utility
        // resolved to `box-shadow: none` here, and there is no accent tint
        // below 12% in the token set — too heavy for something that follows
        // the cursor across every row it passes.
        ...(dropState === "into"
          ? {
              background:
                "color-mix(in srgb, var(--uikit-accent) 7%, transparent)",
              boxShadow: "inset 0 0 0 1.5px var(--uikit-accent)",
              color: "var(--ink)",
            }
          : null),
      }}
    >
      {node.icon ?? (
        <Folder
          size={14}
          strokeWidth={1.5}
          className={cn(
            "shrink-0 text-uikit-muted",
            // The glyph keeps the accent on a selected row. What made the panel
            // read blue-on-blue was the LABEL — full-width text repeating down
            // every row of every column. A 14px glyph on the one selected row
            // per column is a different quantity of the same colour, and it is
            // the only thing left that marks the row without shouting.
            //
            // It does not fight the drop target: during a drag the selected row
            // dims to 45% as the spring trail, and the target carries a ring the
            // selected row never has.
            "group-data-[selected]/row:text-uikit-accent",
            "group-data-[drop=into]/row:!text-uikit-accent",
          )}
        />
      )}
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap tracking-uikit-snug">
        {node.name}
      </span>
      {node.hasChildren !== false && (
        <ChevronRight
          size={11}
          strokeWidth={1.5}
          className={cn(
            "shrink-0 text-uikit-muted opacity-50",
            "group-data-[drop=into]/row:!text-uikit-accent group-data-[drop=into]/row:opacity-70",
          )}
        />
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BreadcrumbTree({
  path,
  onNavigate,
  fetchChildren,
  rootPath,
  renderEmpty,
  refreshKey = 0,
  refreshToken = 0,
  placeholder = "Select folder",
  dnd,
  view,
  defaultView = "columns",
  onViewChange,
  hideViewToggle = false,
  ref,
  className,
}: BreadcrumbTreeProps) {
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<{
    top: number;
    left: number;
    height: number;
    /** Captured alongside the rect, because where the panel can go depends on
     *  it and it has to be re-read on the same events the rect is. */
    viewportH: number;
  } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);

  const [ownView, setOwnView] = useState<BreadcrumbView>(defaultView);
  const activeView = view ?? ownView;
  const setView = useCallback(
    (next: BreadcrumbView) => {
      if (view === undefined) setOwnView(next);
      onViewChange?.(next);
    },
    [view, onViewChange],
  );

  // Which keys the wrapped tree has open. Panel state rather than TreeFlow's
  // own, because a drag re-keys the cache and these have to move with it.
  const [expanded, setExpanded] = useState<Record<string, true>>({});
  const [justMoved, setJustMoved] = useState<{
    id: string;
    token: number;
  } | null>(null);
  const seededRef = useRef(false);

  const { fetchPath, loadMore, getColumnData, applyMove, cache, clearCache } =
    useBreadcrumbTree(fetchChildren);

  const buildKey = useCallback(
    (segments: string[]): string =>
      rootPath ? [rootPath, ...segments].join("/") : segments.join("/"),
    [rootPath],
  );

  const getColumnPathKey = useCallback(
    (depth: number): string =>
      buildKey(path.slice(0, depth).map((n) => n.name)),
    [path, buildKey],
  );

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setAnchorRect({
        top: r.top,
        left: r.left,
        height: r.height,
        viewportH: window.innerHeight,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { capture: true, passive: true });
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, {
        capture: true,
      } as EventListenerOptions);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const key = getColumnPathKey(0);
    const data = getColumnData(key);
    if (!data.loading && data.items.length === 0 && data.page === 0)
      fetchPath(key, 1);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    for (let depth = 1; depth <= path.length; depth++) {
      const key = getColumnPathKey(depth);
      const data = getColumnData(key);
      if (!data.loading && data.items.length === 0 && data.page === 0)
        fetchPath(key, 1);
    }
  }, [open, path.length, getColumnPathKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!refreshKey) return;
    fetchPath(getColumnPathKey(path.length), 1);
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Drop the whole column cache on host-driven mutations (delete / rename).
  // If the panel is open, refetch all currently-visible columns so the user
  // sees fresh data immediately; otherwise the next open repopulates from
  // empty cache via the "fetch if empty" effects above.
  useEffect(() => {
    if (!refreshToken) return;
    clearCache();
    setExpanded({});
    seededRef.current = false;
    if (open) {
      for (let depth = 0; depth <= path.length; depth++) {
        fetchPath(getColumnPathKey(depth), 1);
      }
    }
  }, [refreshToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Follow the path to the newest column. The wrapped tree has no such column
  // — it grows wherever the expanded node happens to sit — so it keeps its own
  // scroll position instead of being yanked right on every click.
  useEffect(() => {
    if (!open || activeView !== "columns" || !columnsRef.current) return;
    columnsRef.current.scrollLeft = columnsRef.current.scrollWidth;
  }, [path.length, open, activeView]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const key = (entry.target as HTMLElement).dataset.pathKey;
          if (key !== undefined) loadMore(key);
        }
      },
      { threshold: 0 },
    );
    for (const el of sentinelRefs.current.values())
      observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [loadMore, cache]);

  const registerSentinel = useCallback(
    (pathKey: string, el: HTMLDivElement | null) => {
      if (el) {
        sentinelRefs.current.set(pathKey, el);
        observerRef.current?.observe(el);
      } else {
        const prev = sentinelRefs.current.get(pathKey);
        if (prev) observerRef.current?.unobserve(prev);
        sentinelRefs.current.delete(pathKey);
      }
    },
    [],
  );

  // First trip into the wrapped tree: open whatever the breadcrumb already
  // points at, so it starts where the user is rather than at the root. Once
  // only — after that the expansion is theirs.
  useEffect(() => {
    if (activeView !== "tree" || seededRef.current) return;
    seededRef.current = true;
    if (path.length === 0) return;
    const seeds: Record<string, true> = {};
    for (let i = 0; i < path.length; i++)
      seeds[buildKey(path.slice(0, i + 1).map((n) => n.name))] = true;
    setExpanded((e) => ({ ...e, ...seeds }));
  }, [activeView, path, buildKey]);

  // A stable "load this key if it isn't loaded" — the wrapped tree opens
  // arbitrary keys, not just the ones along `path`.
  const requestPath = useCallback(
    (pathKey: string) => {
      const data = getColumnData(pathKey);
      if (!data.loading && data.items.length === 0 && data.page === 0)
        fetchPath(pathKey, 1);
    },
    [getColumnData, fetchPath],
  );

  const handleRowClick = useCallback(
    (node: BreadcrumbNode, depth: number) => {
      const newPath = [...path.slice(0, depth), node];
      onNavigate(node, newPath);
      const childKey = buildKey([
        ...path.slice(0, depth).map((n) => n.name),
        node.name,
      ]);
      const data = getColumnData(childKey);
      if (!data.loading && data.items.length === 0 && data.page === 0)
        fetchPath(childKey, 1);
    },
    [path, buildKey, onNavigate, getColumnData, fetchPath],
  );

  const handleBreadcrumbClick = useCallback(
    (node: BreadcrumbNode, idx: number, e: React.MouseEvent) => {
      e.stopPropagation();
      onNavigate(node, path.slice(0, idx + 1));
      setOpen(false);
    },
    [path, onNavigate],
  );

  const handleRootPathClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (path.length === 0) return;
      onNavigate({ id: rootPath!, name: rootPath! }, []);
      setOpen(false);
    },
    [path.length, rootPath, onNavigate],
  );

  const handleHeaderClick = useCallback(
    (depth: number) => {
      const node = path[depth - 1];
      if (!node) return;
      onNavigate(node, path.slice(0, depth));
      setOpen(false);
    },
    [path, onNavigate],
  );

  // ── Drag to re-parent ──────────────────────────────────────────────────────
  // A breadcrumb encodes exactly ONE root→leaf path, so the source branch and
  // the destination branch can never be on screen together. Spring-loading is
  // what buys that back: hold the drag over a row and its column opens, so the
  // user walks across to the other branch mid-drag and drops there.
  //
  // Column `depth` lists the children of `path[depth - 1]` (root when depth is
  // 0), so a row's parent is always `path[depth - 1] ?? null`. Every target
  // below is derived from that one fact.

  const [dragSource, setDragSource] = useState<{
    node: BreadcrumbNode;
    depth: number;
    /** The parent it started under, captured at dragstart. Spring-loading
     *  rewrites `path` mid-drag, so this cannot be re-derived at drop time. */
    from: BreadcrumbNode | null;
    /** ...and the whole chain above it, for the same reason. This is what
     *  names the row's old cache key when the move is undone. */
    fromPath: BreadcrumbNode[];
  } | null>(null);
  const [dropAt, setDropAt] = useState<
    | { kind: "into"; depth: number; id: string }
    | { kind: "level"; depth: number }
    | null
  >(null);

  // Kept in a ref too: a spring-open re-renders columns and can unmount the
  // source row, and `dragend` may then never reach it.
  const dragSourceRef = useRef<{
    node: BreadcrumbNode;
    depth: number;
    from: BreadcrumbNode | null;
    fromPath: BreadcrumbNode[];
  } | null>(null);
  const springRef = useRef<{
    key: string;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);

  const cancelSpring = useCallback(() => {
    if (springRef.current) {
      clearTimeout(springRef.current.timer);
      springRef.current = null;
    }
  }, []);

  const endDrag = useCallback(() => {
    cancelSpring();
    dragSourceRef.current = null;
    setDragSource(null);
    setDropAt(null);
  }, [cancelSpring]);

  const targetFor = useCallback(
    (depth: number, node: BreadcrumbNode | null): BreadcrumbDropTarget =>
      node
        ? {
            parent: node,
            parentPath: [...path.slice(0, depth), node],
            kind: "into",
          }
        : {
            parent: path[depth - 1] ?? null,
            parentPath: path.slice(0, depth),
            kind: "level",
          },
    [path],
  );

  // Self, own-subtree, and no-op moves are refused here so every consumer gets
  // them for free; `canDrop` is the host's extra say on top.
  const dropAllowed = useCallback(
    (depth: number, node: BreadcrumbNode | null): boolean => {
      const src = dragSourceRef.current;
      if (!src || !dnd) return false;
      const target = targetFor(depth, node);
      if (node) {
        if (node.id === src.node.id) return false;
        // Dropping into anything under the dragged node would detach the subtree.
        if (path.slice(0, depth).some((a) => a.id === src.node.id))
          return false;
      }
      // Already a child of that parent — nothing to do. Uses the captured
      // origin, not `path`, which a spring-open may have moved on from.
      const currentParentId = src.from?.id ?? null;
      if ((target.parent?.id ?? null) === currentParentId) return false;
      return dnd.canDrop ? dnd.canDrop(src.node, target) : true;
    },
    [dnd, path, targetFor],
  );

  const handleRowDragOver = useCallback(
    (e: React.DragEvent, node: BreadcrumbNode, depth: number) => {
      if (!dragSourceRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      const ok = dropAllowed(depth, node);
      e.dataTransfer.dropEffect = ok ? "move" : "none";
      setDropAt({ kind: "into", depth, id: node.id });

      // Spring the column open after a dwell — but never for a row that can't
      // be entered, and never re-arm for the row already being dwelt on.
      const key = `${depth}:${node.id}`;
      if (springRef.current?.key === key) return;
      cancelSpring();
      if (node.hasChildren === false) return;
      if (node.id === dragSourceRef.current.node.id) return;
      const timer = setTimeout(() => {
        springRef.current = null;
        handleRowClick(node, depth);
      }, dnd?.springDelayMs ?? 500);
      springRef.current = { key, timer };
    },
    [dropAllowed, cancelSpring, handleRowClick, dnd],
  );

  // Both layouts land here. The row moves in the cache FIRST and the host is
  // told after — see `BreadcrumbDragAndDrop.onMove` for why the tree no longer
  // waits for a refetch to show a move it already knows the shape of. If the
  // host rejects, the exact inverse is applied and the row goes back.
  // The cache half of a move, with no host call attached — so the same edit
  // can serve a drag the tree reported, the rollback when the host refuses it,
  // and an UNDO the host initiates through the imperative handle below.
  const applyMoveLocally = useCallback(
    (move: BreadcrumbMove) => {
      const names = (nodes: BreadcrumbNode[]) => nodes.map((n) => n.name);
      const fromKey = buildKey(names(move.fromPath));
      const toKey = buildKey(names(move.to.parentPath));
      const oldPrefix = buildKey([...names(move.fromPath), move.source.name]);
      const newPrefix = buildKey([
        ...names(move.to.parentPath),
        move.source.name,
      ]);

      // The moved node's whole subtree changes cache key, and every open key
      // inside it has to change with it — otherwise the branch the user had
      // open silently reads as collapsed at its new address, and its children
      // vanish from the tree even though nothing was refetched.
      const rekey = (from: string, to: string) =>
        setExpanded((prev) => {
          const next: Record<string, true> = {};
          for (const k of Object.keys(prev))
            next[
              k === from || k.startsWith(`${from}/`)
                ? to + k.slice(from.length)
                : k
            ] = true;
          return next;
        });

      applyMove({
        node: move.source,
        fromKey,
        toKey,
        oldPrefix,
        newPrefix,
        newParentId: move.to.parent?.id ?? null,
      });
      rekey(oldPrefix, newPrefix);

      // Open the way to where it landed. A destination that happens to be
      // collapsed swallows the row whole — it does not glide anywhere, it
      // simply stops existing — and that is exactly the case where someone
      // cannot tell what an Undo just did.
      //
      // Only as far as the cache already reaches, though. Expanding a column
      // that has never been fetched starts a fetch, and that fetch races the
      // host's write: it returns the tree as it was BEFORE the move and
      // overwrites the edit, so the row vanishes instead of arriving. Whether
      // that happens would come down to how quick the server is, which is no
      // basis for whether a row exists. Stopping at the last cached ancestor
      // reveals the move whenever the destination was on screen — which is
      // every drag, and every undo of one — and otherwise leaves the toast to
      // say what happened.
      setExpanded((prev) => {
        const next = { ...prev };
        for (let i = 0; i < move.to.parentPath.length; i++) {
          const key = buildKey(names(move.to.parentPath.slice(0, i + 1)));
          if (getColumnData(key).page === 0) break;
          next[key] = true;
        }
        return next;
      });
      // Tells the tree WHICH row to scroll to and mark, and `token` makes a
      // repeat of the same move count as a new event.
      setJustMoved((prev) => ({
        id: move.source.id,
        token: (prev?.token ?? 0) + 1,
      }));
    },
    [buildKey, applyMove, getColumnData],
  );

  /** `move` reversed: what it would take to put the node back. */
  const invert = useCallback(
    (move: BreadcrumbMove): BreadcrumbMove => ({
      source: move.source,
      from: move.to.parent,
      fromPath: move.to.parentPath,
      to: {
        parent: move.from,
        parentPath: move.fromPath,
        kind: move.from ? "into" : "level",
      },
    }),
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      // An undo is a move the HOST starts, so the tree would otherwise learn
      // of it only by refetching — which is the one thing this component no
      // longer does. Routed through here it is applied like any other move,
      // and the row plays back to where it came from instead of silently
      // reappearing there.
      applyMove: applyMoveLocally,
      undo: (move: BreadcrumbMove) => applyMoveLocally(invert(move)),
    }),
    [applyMoveLocally, invert],
  );

  const performMove = useCallback(
    (move: BreadcrumbMove) => {
      if (!dnd) return;
      applyMoveLocally(move);
      Promise.resolve(dnd.onMove(move)).catch(() => {
        applyMoveLocally(invert(move));
      });
    },
    [dnd, applyMoveLocally, invert],
  );

  const commitMove = useCallback(
    (depth: number, node: BreadcrumbNode | null) => {
      const src = dragSourceRef.current;
      const ok = src && dropAllowed(depth, node);
      const target = ok ? targetFor(depth, node) : null;
      endDrag();
      if (src && target)
        performMove({
          source: src.node,
          from: src.from,
          fromPath: src.fromPath,
          to: target,
        });
    },
    [dropAllowed, targetFor, endDrag, performMove],
  );

  const columns = Array.from({ length: path.length + 1 }, (_, i) => i);
  const bodyHeight = PANEL_H - (hideViewToggle ? 0 : FOOTER_H);

  // The panel hangs below the breadcrumb, and it is a FIXED 360px — so on a
  // trigger low in the window it used to hang straight off the bottom, taking
  // its last rows with it. Nothing could scroll it back: a `fixed` element
  // does not move with the page. Flip it above the trigger when that is where
  // the room is, and clamp to the edge when neither side has enough.
  const panelTop = (() => {
    if (!anchorRect) return 0;
    const below = anchorRect.top + anchorRect.height + PANEL_GAP;
    const spaceBelow = anchorRect.viewportH - below;
    const spaceAbove = anchorRect.top - PANEL_GAP;
    if (spaceBelow < PANEL_H && spaceAbove > spaceBelow)
      return Math.max(VIEWPORT_EDGE, anchorRect.top - PANEL_GAP - PANEL_H);
    return Math.max(
      VIEWPORT_EDGE,
      Math.min(below, anchorRect.viewportH - VIEWPORT_EDGE - PANEL_H),
    );
  })();

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative inline-flex items-center font-uikit-ui",
        className,
      )}
    >
      {/* ── Breadcrumb trigger ── */}
      <div
        role="navigation"
        aria-label="Navigation path"
        className={cn(
          "inline-flex items-center gap-0 h-4 leading-4 whitespace-nowrap",
          "font-uikit-ui text-uikit-12 tracking-uikit-snug",
          "text-uikit-muted opacity-70",
        )}
      >
        {rootPath ? (
          <>
            <BreadcrumbItem
              name={rootPath}
              isLeaf={path.length === 0}
              onClick={handleRootPathClick}
            />
            {path.length > 0 && (
              <span
                aria-hidden="true"
                className="text-uikit-11 opacity-45 pr-1 select-none leading-none"
              >
                ›
              </span>
            )}
          </>
        ) : path.length === 0 ? (
          <span className="mr-1">{placeholder}</span>
        ) : null}

        {path.map((node, i) => {
          const isLeaf = i === path.length - 1;
          return (
            <Fragment key={node.id}>
              <BreadcrumbItem
                name={node.name}
                isLeaf={isLeaf}
                onClick={(e) => handleBreadcrumbClick(node, i, e)}
              />
              {!isLeaf && (
                <span
                  aria-hidden="true"
                  className="text-uikit-11 opacity-45 pr-1 select-none leading-none"
                >
                  ›
                </span>
              )}
            </Fragment>
          );
        })}

        <ChevronToggle open={open} onClick={() => setOpen((v) => !v)} />
      </div>

      {/* ── Panel (portaled to body so it floats above any clipping ancestor) ── */}
      {open &&
        anchorRect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            className={cn(
              "uikit-panel-in fixed z-[1000] flex flex-col overflow-hidden origin-top-left",
              "bg-uikit-bg text-uikit-ink font-uikit-ui",
              "rounded-[calc(var(--radius)+2px)]",
            )}
            style={{
              top: panelTop,
              left: anchorRect.left - 14,
              height: PANEL_H,
              // Columns are added one per level, so that layout's width is
              // bounded by how deep the user has gone. The wrapped tree's is
              // bounded by nothing — expand enough branches and it would run
              // off the screen instead of scrolling, which is the one thing
              // that layout is supposed to do.
              ...(activeView === "tree"
                ? { maxWidth: "min(86vw, 920px)" }
                : null),
              // `--shadow-uikit-soft` WITHOUT its third layer. That token is
              // the kit's floating-panel elevation, but it ends in a
              // `0 0 0 1px var(--faint)` ring meant for menus and dropdowns,
              // and this panel renders borderless by design — so its two drop
              // layers are reproduced here rather than the token taken whole.
              // Theme-aware via `--shadow-tint-*`, as the token is.
              //
              // The negative spread came first: this panel used to cast
              // `0 10px 28px` with no pull-in, a wide undiminished pool that at
              // dark mode's 60%-black tint-2 read as a slab under the panel.
              //
              // What was left after that was the FIRST layer — 45% black at
              // 1px, a tight dark rim hugging the bottom edge. `--shadow-tint-*`
              // is tuned for surfaces that also carry a hairline ring; this
              // panel is borderless by design, so its cast is the only edge it
              // gets, and at that weight the edge reads as a drawn line rather
              // than as lift. `--shadow-panel-*` is the same elevation with the
              // dark values pulled back (16%/28%); light is unchanged.
              boxShadow:
                "0 1px 3px var(--shadow-panel-1), 0 8px 20px -10px var(--shadow-panel-2)",
            }}
          >
            <div className="flex-1 min-h-0">
              {activeView === "tree" ? (
                <TreeFlow
                  path={path}
                  onNavigate={onNavigate}
                  keyOf={buildKey}
                  getColumnData={getColumnData}
                  requestPath={requestPath}
                  renderEmpty={renderEmpty}
                  expanded={expanded}
                  setExpanded={setExpanded}
                  justMoved={justMoved}
                  dnd={dnd}
                  onMove={performMove}
                  height={bodyHeight}
                />
              ) : (
                <div ref={columnsRef} className="flex h-full overflow-x-auto">
                  {columns.map((depth) => {
                    const pathKey = getColumnPathKey(depth);
                    const { items, loading, hasMore, error } =
                      getColumnData(pathKey);
                    const selectedId = path[depth]?.id;
                    const headerLabel =
                      depth === 0
                        ? (rootPath ?? null)
                        : (path[depth - 1]?.displayName ??
                          path[depth - 1]?.name ??
                          null);
                    const isLastCol = depth === columns.length - 1;

                    return (
                      <div
                        key={depth}
                        className={cn(
                          "w-[208px] h-full flex flex-col shrink-0",
                          !isLastCol && "border-r border-uikit-faint",
                        )}
                      >
                        {/* Column header */}
                        {headerLabel && (
                          <button
                            type="button"
                            onClick={() =>
                              depth === 0
                                ? setOpen(false)
                                : handleHeaderClick(depth)
                            }
                            className={cn(
                              "appearance-none border-0 outline-none bg-transparent text-left w-full shrink-0",
                              "pt-3 px-3.5 pb-2",
                              "font-uikit-mono text-[11px] font-semibold tracking-[.06em] uppercase",
                              "text-uikit-ink-50",
                              depth === 0 ? "cursor-default" : "cursor-pointer",
                            )}
                          >
                            {headerLabel}
                          </button>
                        )}

                        {/* Column body */}
                        <div
                          onDragOver={
                            dnd && dragSource
                              ? (e) => {
                                  e.preventDefault();
                                  const ok = dropAllowed(depth, null);
                                  e.dataTransfer.dropEffect = ok
                                    ? "move"
                                    : "none";
                                  // Left a row for bare column space: the target is
                                  // now this column's own parent, so drop the dwell.
                                  cancelSpring();
                                  setDropAt({ kind: "level", depth });
                                }
                              : undefined
                          }
                          onDrop={
                            dnd && dragSource
                              ? (e) => {
                                  e.preventDefault();
                                  commitMove(depth, null);
                                }
                              : undefined
                          }
                          className={cn(
                            // `scroll-auto-hide` is the app-side opt-in for the
                            // auto-hiding scrollbar (paints `var(--faint)` thumb
                            // only while the container has `.is-scrolling`).
                            // Apps without the rule fall back to default
                            // browser scrollbars — harmless.
                            "scroll-auto-hide flex-1 overflow-auto flex flex-col gap-0.5",
                            headerLabel ? "pt-0.5 px-1.5 pb-2" : "py-2 px-1.5",
                          )}
                          style={
                            // "Drop at this level" — a ring around the column body,
                            // not an insertion line between rows: siblings here have
                            // no order to insert into. Inline because the Tailwind
                            // arbitrary-shadow utility resolved to `none`.
                            //
                            // `outline` with a NEGATIVE offset rather than an inset
                            // shadow: the shadow paints on the scroll container's
                            // border box, which runs flush to the column header and
                            // to the first row. Pulling the outline 5px inward gives
                            // it room to read as a frame around the list instead of
                            // a box welded to the header, and costs no layout — so
                            // nothing shifts when it appears under the cursor.
                            dropAt?.kind === "level" &&
                            dropAt.depth === depth &&
                            dropAllowed(depth, null)
                              ? {
                                  borderRadius: "calc(var(--radius) + 3px)",
                                  outline: "1.5px solid var(--uikit-accent)",
                                  outlineOffset: "-5px",
                                }
                              : undefined
                          }
                        >
                          {items.map((node, rowIdx) => (
                            <TreeRow
                              key={node.id}
                              node={node}
                              selected={node.id === selectedId}
                              colIdx={depth}
                              rowIdx={rowIdx}
                              onClick={() => handleRowClick(node, depth)}
                              draggable={!!dnd}
                              isSource={dragSource?.node.id === node.id}
                              dragActive={!!dragSource}
                              dropState={
                                dnd &&
                                dragSource &&
                                dropAt?.kind === "into" &&
                                dropAt.depth === depth &&
                                dropAt.id === node.id
                                  ? dropAllowed(depth, node)
                                    ? "into"
                                    : "blocked"
                                  : "none"
                              }
                              onDragStart={
                                dnd
                                  ? (e) => {
                                      const originPath = path.slice(0, depth);
                                      const origin =
                                        originPath[depth - 1] ?? null;
                                      const src = {
                                        node,
                                        depth,
                                        from: origin,
                                        fromPath: originPath,
                                      };
                                      dragSourceRef.current = src;
                                      setDragSource(src);
                                      e.dataTransfer.effectAllowed = "move";
                                      // Firefox refuses to start a drag without payload.
                                      e.dataTransfer.setData(
                                        "text/plain",
                                        node.id,
                                      );
                                    }
                                  : undefined
                              }
                              onDragEnd={dnd ? () => endDrag() : undefined}
                              onDragOver={
                                dnd && dragSource
                                  ? (e) => handleRowDragOver(e, node, depth)
                                  : undefined
                              }
                              onDrop={
                                dnd && dragSource
                                  ? (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      commitMove(depth, node);
                                    }
                                  : undefined
                              }
                            />
                          ))}

                          {!loading &&
                            !error &&
                            items.length === 0 &&
                            (renderEmpty ? (
                              renderEmpty(path[depth - 1] ?? null)
                            ) : (
                              <div className="py-6 px-2 text-center text-uikit-11 text-uikit-muted opacity-60">
                                No items
                              </div>
                            ))}

                          {error && items.length === 0 && (
                            <div className="py-6 px-2 text-center text-uikit-11 text-uikit-danger">
                              Failed to load
                            </div>
                          )}

                          {loading && items.length === 0 && (
                            <div className="flex items-center justify-center pt-6">
                              <Loader
                                size={14}
                                className="animate-spin text-uikit-muted opacity-50"
                              />
                            </div>
                          )}

                          {hasMore && items.length > 0 && (
                            <div
                              ref={(el) => registerSentinel(pathKey, el)}
                              data-path-key={pathKey}
                              className="h-px"
                            />
                          )}

                          {loading && items.length > 0 && (
                            <div className="flex items-center justify-center py-2">
                              <Loader
                                size={11}
                                className="animate-spin text-uikit-muted opacity-50"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {!hideViewToggle && (
              // Pinned to the LEFT edge. The panel's width is its content's —
              // it grows a column per level in the column view and per wrap in
              // the tree — so anchoring the toggle to the right edge made it
              // walk across the screen as the user drilled in. The left edge
              // is the one thing that does not move, and it lines the control
              // up with the first column.
              <div
                // `items-end` + a bottom pad, rather than centring in the
                // strip: the gap below is then exactly the inset whatever the
                // control's own height turns out to be.
                className="shrink-0 flex items-end justify-start"
                style={{
                  height: FOOTER_H,
                  paddingLeft: TOGGLE_INSET,
                  paddingBottom: TOGGLE_INSET,
                }}
              >
                <ToggleButtons
                  value={activeView}
                  onValueChange={(v) => setView(v as BreadcrumbView)}
                  variant="secondary"
                  size="sm"
                  padding={false}
                >
                  <ToggleButton value="columns" icon aria-label="Column view">
                    <Columns3 size={13} strokeWidth={1.5} />
                  </ToggleButton>
                  <ToggleButton value="tree" icon aria-label="Tree view">
                    <ListTree size={13} strokeWidth={1.5} />
                  </ToggleButton>
                </ToggleButtons>
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
