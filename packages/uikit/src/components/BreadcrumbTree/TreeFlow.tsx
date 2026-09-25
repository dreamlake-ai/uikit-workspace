import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Folder, Loader } from "lucide-react";
import { cn } from "../../lib/utils";
import type {
  BreadcrumbNode,
  BreadcrumbDragAndDrop,
  BreadcrumbDropTarget,
  BreadcrumbMove,
  ColumnData,
} from "./types";

// The panel's other layout: instead of one column per PATH LEVEL, the whole
// expanded tree is flattened into a single top-to-bottom flow that WRAPS into
// columns when it reaches the panel's height. The panel therefore scrolls
// horizontally and never vertically.
//
// What that buys is breadth — sibling branches stay on screen instead of being
// collapsed away by a column that can only show one path. What it costs is that
// a column here means nothing: column two is simply what did not fit in column
// one, so a parent and its children routinely land in different ones. Two
// things pay that back without adding chrome:
//
//   • guidelines — the trunk is one unbroken line and each branch curves out of
//     it, drawn by EVERY row from its own `isLastPath`. A row that starts a new
//     column still draws its ancestors' trunks, so depth survives the break.
//   • the ancestor trail — hovering a row marks its ancestors wherever they
//     are, which is the only way to answer "whose child is this?" across one.
//
// Geometry is fixed so the wrap point follows from the height alone.
const ROW_H = 26;
const ROW_W = 208;
const ROW_GAP = 3;
const INDENT = 20;
/** Centre of a row's chevron: 8px of padding plus half the 14px slot. A
 *  parent's trunk hangs here, so the guidelines start from it. */
const CHEVRON_CENTER = 15;
/** Trunk → the child's chevron. Constant at every depth: the slot sits at
 *  `depth * INDENT - 5` and the chevron box at `depth * INDENT + 8`. */
const STUB = INDENT - 7;
/** How long a fetch must be outstanding before a spinner row is worth showing.
 *  Below this it appears and is replaced inside one glance, which reads as a
 *  flicker rather than as loading. */
const SPINNER_DELAY = 180;
/** Radius of the bend where a branch leaves its trunk. Also the point the
 *  corner's own vertical stops at, which is where a continuing trunk has to
 *  pick it up — a constant, not a class name, so the two cannot drift apart
 *  and leave a gap in the line. */
const CORNER_R = 6;
/** Gutter between wrapped columns. */
const COL_GAP = 10;
/** The scroller's own padding, `px-1.5 py-2`. */
const PAD_X = 6;
const PAD_Y = 8;

interface Row {
  kind: "node" | "loading";
  key: string;
  depth: number;
  node: BreadcrumbNode;
  /** Root → this node, so a click can hand the host a whole path. */
  nodePath: BreadcrumbNode[];
  /** `isLastPath[d]` — is `nodePath[d]` the last of its siblings? The whole
   *  input to the guidelines: slot `i` draws a trunk while `isLastPath[i + 1]`
   *  is false, and the elbow closes when it is true. */
  isLastPath: boolean[];
  /** Position among its OWN siblings. The entrance stagger reads from this,
   *  because a row's index in the flattened list moves whenever anything above
   *  it expands. */
  siblingIndex: number;
}

export interface TreeFlowProps {
  path: BreadcrumbNode[];
  onNavigate: (node: BreadcrumbNode, newPath: BreadcrumbNode[]) => void;
  /** Slash-joined key for a name chain, matching the column cache's keys. */
  keyOf: (segments: string[]) => string;
  getColumnData: (pathKey: string) => ColumnData;
  /** Load a key that is not cached yet. */
  requestPath: (pathKey: string) => void;
  renderEmpty?: (parentNode: BreadcrumbNode | null) => React.ReactNode;
  /** Which keys are open. Owned by the panel, not by this component: a move
   *  re-keys the tree's cache and these have to be re-keyed with it, in the
   *  same update. Living up there also means the expansion survives a trip
   *  through the column layout and back. */
  expanded: Record<string, true>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, true>>>;
  dnd?: BreadcrumbDragAndDrop;
  /** Commit a completed drag. The panel owns the optimistic cache edit and
   *  the host call, so both layouts move a row the same way. */
  onMove: (move: BreadcrumbMove) => void;
  /** Outer height of the panel body. The wrap point follows from it. */
  height: number;
}

export function TreeFlow({
  path,
  onNavigate,
  keyOf,
  getColumnData,
  requestPath,
  renderEmpty,
  expanded,
  setExpanded,
  dnd,
  onMove,
  height,
}: TreeFlowProps) {
  const rootKey = useMemo(() => keyOf([]), [keyOf]);

  const [slow, setSlow] = useState<Record<string, true>>({});
  const [hovered, setHovered] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const seen = useRef<Set<string>>(new Set());
  const slowTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  // Every expanded key has to be loaded, not just the ones along `path`.
  useEffect(() => {
    requestPath(rootKey);
    for (const key of Object.keys(expanded)) requestPath(key);
  }, [expanded, rootKey, requestPath]);

  // A spinner is withheld until the fetch has been outstanding long enough to
  // be worth admitting to.
  useEffect(() => {
    const keys = [rootKey, ...Object.keys(expanded)];
    for (const key of keys) {
      const { loading, items } = getColumnData(key);
      const pending = loading && items.length === 0;
      if (pending && !slowTimers.current.has(key)) {
        slowTimers.current.set(
          key,
          setTimeout(
            () => setSlow((s) => ({ ...s, [key]: true })),
            SPINNER_DELAY,
          ),
        );
      }
      if (!pending && slowTimers.current.has(key)) {
        clearTimeout(slowTimers.current.get(key)!);
        slowTimers.current.delete(key);
        setSlow((s) => {
          if (!s[key]) return s;
          const next = { ...s };
          delete next[key];
          return next;
        });
      }
    }
  });

  useEffect(
    () => () => {
      for (const t of slowTimers.current.values()) clearTimeout(t);
      slowTimers.current.clear();
    },
    [],
  );

  // A plain mouse wheel only reports deltaY and this panel has nothing to
  // scroll vertically — `overflow-y: hidden` is the layout's contract. Chrome
  // does not redirect it, so without this a trackpad could reach the far
  // columns and a mouse could not reach them at all. Native listener, because
  // React registers `onWheel` passive and `preventDefault` there is a no-op.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const rows = useMemo(() => {
    const out: Row[] = [];
    const walk = (
      parentKey: string,
      segments: string[],
      nodes: BreadcrumbNode[],
      depth: number,
      lastPath: boolean[],
    ) => {
      const items = getColumnData(parentKey).items;
      items.forEach((node, idx) => {
        const nextSegments = [...segments, node.name];
        const key = keyOf(nextSegments);
        const nodePath = [...nodes, node];
        const isLastPath = [...lastPath, idx === items.length - 1];
        out.push({
          kind: "node",
          key,
          depth,
          node,
          nodePath,
          isLastPath,
          siblingIndex: idx,
        });
        if (!expanded[key]) return;
        const child = getColumnData(key);
        if (child.items.length)
          walk(key, nextSegments, nodePath, depth + 1, isLastPath);
        else if (slow[key])
          out.push({
            kind: "loading",
            key: `${key}::loading`,
            depth: depth + 1,
            node,
            nodePath,
            isLastPath: [...isLastPath, true],
            siblingIndex: 0,
          });
      });
    };
    walk(rootKey, [], [], 0, []);
    return out;
  }, [expanded, slow, getColumnData, keyOf, rootKey]);

  const selectedKey = path.length ? keyOf(path.map((n) => n.name)) : null;

  const toggle = useCallback(
    (key: string) => {
      setExpanded((e) => {
        if (e[key]) {
          const next = { ...e };
          delete next[key];
          return next;
        }
        return { ...e, [key]: true };
      });
      requestPath(key);
    },
    [requestPath],
  );

  // ── Drag ────────────────────────────────────────────────────────────────
  // The column layout can lean on "a column IS a level", so a whole column is a
  // drop target and its empty space means "become a child of this column's own
  // parent". Here every target is a single row, and "move to the root" has no
  // column to aim at — it falls to the panel's bare space.
  const [drag, setDrag] = useState<Row | null>(null);
  const [dropAt, setDropAt] = useState<
    { kind: "row"; key: string } | { kind: "root" } | null
  >(null);
  const dragRef = useRef<Row | null>(null);
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
    dragRef.current = null;
    setDrag(null);
    setDropAt(null);
  }, [cancelSpring]);

  const parentOf = (row: Row): BreadcrumbNode | null =>
    row.nodePath.length > 1 ? row.nodePath[row.nodePath.length - 2] : null;

  const dropAllowed = useCallback(
    (target: Row | null): boolean => {
      const src = dragRef.current;
      if (!src || !dnd) return false;
      // Itself, or anywhere inside its own subtree — the second would detach
      // the branch from the tree entirely.
      if (target && target.nodePath.some((n) => n.id === src.node.id))
        return false;
      const current = parentOf(src)?.id ?? null;
      if ((target?.node.id ?? null) === current) return false;
      return dnd.canDrop?.(src.node, targetFor(target)) ?? true;
    },
    [dnd],
  );

  const targetFor = (row: Row | null): BreadcrumbDropTarget =>
    row
      ? { parent: row.node, parentPath: row.nodePath, kind: "into" }
      : { parent: null, parentPath: [], kind: "level" };

  const commitMove = useCallback(
    (target: Row | null) => {
      const src = dragRef.current;
      const ok = src && dropAllowed(target);
      endDrag();
      if (src && ok)
        onMove({
          source: src.node,
          from: parentOf(src),
          fromPath: src.nodePath.slice(0, -1),
          to: targetFor(target),
        });
    },
    [dropAllowed, endDrag, onMove],
  );

  const handleRowDragOver = useCallback(
    (e: React.DragEvent, row: Row) => {
      if (!dragRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = dropAllowed(row) ? "move" : "none";
      setDropAt({ kind: "row", key: row.key });

      // Dwell expands, so a closed branch can still be dropped into — this
      // layout's answer to the column view's spring-loading.
      if (springRef.current?.key === row.key) return;
      cancelSpring();
      if (row.node.hasChildren === false) return;
      if (row.node.id === dragRef.current.node.id) return;
      if (expanded[row.key]) return;
      springRef.current = {
        key: row.key,
        timer: setTimeout(() => {
          springRef.current = null;
          toggle(row.key);
        }, dnd?.springDelayMs ?? 500),
      };
    },
    [dropAllowed, cancelSpring, expanded, toggle, dnd],
  );

  // Every row is the same height, so where the flow wraps is arithmetic — no
  // need to measure. Stating the width outright is not an optimisation: a
  // `column`-direction flex container that wraps does not reliably report the
  // width of its wrapped columns as its own max-content, so left to itself the
  // scroller decides there is nothing to scroll and the later columns become
  // unreachable. The trailing `PAD_X` is the scroller's right padding, which an
  // overflowing child would otherwise lose.
  const innerH = height - PAD_Y * 2;
  const perColumn = Math.max(
    1,
    Math.floor((innerH + ROW_GAP) / (ROW_H + ROW_GAP)),
  );
  const columnCount = Math.max(1, Math.ceil(rows.length / perColumn));
  const flowWidth = columnCount * ROW_W + (columnCount - 1) * COL_GAP + PAD_X;
  // Whatever the last row in a column does not use. A branch that continues
  // into the NEXT column has to carry its trunk across that slack — stopping
  // at the last row's bottom edge leaves the line hanging in mid-air with the
  // rest of the branch nowhere in sight.
  const columnSlack = innerH - (perColumn * ROW_H + (perColumn - 1) * ROW_GAP);

  const rootData = getColumnData(rootKey);
  const rootDropActive = !!drag && dropAt?.kind === "root" && dropAllowed(null);

  return (
    <div
      ref={scrollerRef}
      className="scroll-auto-hide h-full overflow-x-auto overflow-y-hidden pl-1.5 py-2"
      onDragOver={
        dnd && drag
          ? (e) => {
              // Bare panel space — the root. Rows stop their own dragover, so
              // reaching here means the cursor left them.
              e.preventDefault();
              e.dataTransfer.dropEffect = dropAllowed(null) ? "move" : "none";
              cancelSpring();
              setDropAt({ kind: "root" });
            }
          : undefined
      }
      onDrop={
        dnd && drag
          ? (e) => {
              e.preventDefault();
              commitMove(null);
            }
          : undefined
      }
    >
      <div
        className="flex flex-col flex-wrap content-start"
        style={{
          width: flowWidth,
          height: innerH,
          columnGap: COL_GAP,
          rowGap: ROW_GAP,
          ...(rootDropActive
            ? {
                borderRadius: "calc(var(--radius) + 3px)",
                outline: "1.5px solid var(--uikit-accent)",
                outlineOffset: "-4px",
              }
            : null),
        }}
      >
        {rootData.loading && rootData.items.length === 0 && (
          <div
            className="flex items-center justify-center pt-6"
            style={{ width: ROW_W }}
          >
            <Loader
              size={14}
              className="animate-spin text-uikit-muted opacity-50"
            />
          </div>
        )}

        {!rootData.loading && rows.length === 0 && (
          <div style={{ width: ROW_W }}>
            {renderEmpty ? (
              renderEmpty(null)
            ) : (
              <div className="py-6 px-2 text-center text-uikit-11 text-uikit-muted opacity-60">
                No items
              </div>
            )}
          </div>
        )}

        {rows.map((row, i) =>
          row.kind === "loading" ? (
            <div
              key={row.key}
              className="flex items-center shrink-0"
              style={{
                width: ROW_W,
                height: ROW_H,
                paddingLeft: 8 + row.depth * INDENT,
              }}
            >
              <Loader
                size={11}
                className="animate-spin text-uikit-muted opacity-50"
              />
            </div>
          ) : (
            <FlowRow
              key={row.key}
              // Only matters for the last row in a wrapped column; see
              // `columnSlack`.
              trailingSlack={
                (i + 1) % perColumn === 0 ? Math.max(0, columnSlack) : 0
              }
              row={row}
              firstSight={
                !seen.current.has(row.key) && (seen.current.add(row.key), true)
              }
              expanded={!!expanded[row.key]}
              selected={row.key === selectedKey}
              onTrail={!!hovered && hovered.startsWith(`${row.key}/`)}
              onHover={setHovered}
              onToggle={toggle}
              onClick={() => {
                onNavigate(row.node, row.nodePath);
                if (row.node.hasChildren !== false && !expanded[row.key])
                  toggle(row.key);
              }}
              draggable={!!dnd}
              isSource={drag?.key === row.key}
              dragActive={!!drag}
              dropState={
                dnd && drag && dropAt?.kind === "row" && dropAt.key === row.key
                  ? dropAllowed(row)
                    ? "into"
                    : "blocked"
                  : "none"
              }
              onDragStart={
                dnd
                  ? (e) => {
                      // Firefox refuses to start a drag without payload.
                      e.dataTransfer.setData("text/plain", row.node.id);
                      e.dataTransfer.effectAllowed = "move";
                      dragRef.current = row;
                      setDrag(row);
                    }
                  : undefined
              }
              onDragEnd={dnd ? endDrag : undefined}
              onDragOver={
                dnd && drag ? (e) => handleRowDragOver(e, row) : undefined
              }
              onDrop={
                dnd && drag
                  ? (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      commitMove(row);
                    }
                  : undefined
              }
            />
          ),
        )}
      </div>
    </div>
  );
}

function FlowRow({
  row,
  firstSight,
  expanded,
  selected,
  onTrail,
  onHover,
  onToggle,
  onClick,
  draggable = false,
  isSource = false,
  dragActive = false,
  dropState = "none",
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  trailingSlack = 0,
}: {
  row: Row;
  firstSight: boolean;
  expanded: boolean;
  selected: boolean;
  onTrail: boolean;
  onHover: (key: string | null) => void;
  onToggle: (key: string) => void;
  onClick: () => void;
  draggable?: boolean;
  isSource?: boolean;
  dragActive?: boolean;
  dropState?: "none" | "into" | "blocked";
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  /** Extra height for the guidelines below this row — the empty tail of a
   *  wrapped column, which a continuing trunk has to cross. */
  trailingSlack?: number;
}) {
  const hasChildren = row.node.hasChildren !== false;
  const isLast = row.isLastPath[row.depth];

  return (
    <div
      role="treeitem"
      aria-expanded={hasChildren ? expanded : undefined}
      aria-selected={selected || undefined}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={() => onHover(row.key)}
      onMouseLeave={() => onHover(null)}
      draggable={draggable || undefined}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      data-selected={selected || undefined}
      data-trail={onTrail || undefined}
      data-source={isSource || undefined}
      data-drop={dropState !== "none" ? dropState : undefined}
      data-dim={(dragActive && selected && dropState === "none") || undefined}
      className={cn(
        "group/row relative shrink-0 flex items-center rounded-[var(--radius)] cursor-pointer",
        "font-uikit-ui text-uikit-13 leading-[15.5px] tracking-uikit-snug",
        "transition-[background-color] duration-[120ms]",
        "text-uikit-ink bg-transparent font-normal",
        "hover:bg-uikit-ink-6",
        // Selection: tint and weight carry the state, the label stays ink, and
        // the glyph keeps the accent — the same rule the column rows follow.
        "data-[selected]:!bg-uikit-accent-12 data-[selected]:text-uikit-ink data-[selected]:font-medium",
        "data-[drop=blocked]:!bg-transparent data-[drop=blocked]:!opacity-40",
        "data-[drop=blocked]:cursor-no-drop",
        "data-[source]:!opacity-55",
        "data-[dim]:!opacity-45",
      )}
      style={{
        width: ROW_W,
        height: ROW_H,
        // Frozen at first sight. `uikit-row-in` starts at opacity 0 and is
        // applied inline, so any change to the string replays it — keying the
        // delay off the flattened index meant expanding a node blanked every
        // row below the one clicked.
        animation: firstSight
          ? `uikit-row-in 240ms ${row.depth * 45 + Math.min(row.siblingIndex, 12) * 20}ms cubic-bezier(0.2, 0.8, 0.2, 1) both`
          : undefined,
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
      {/* Guidelines. One slot per ancestor; the LAST slot is the one that
          matters — its vertical is the parent's own trunk, so the child hangs
          off it and the last child closes it with a rounded corner. The trunk
          is drawn as its own full-height rule rather than as the elbow's top
          half: letting the elbow carry it puts the corner's radius inside the
          trunk and notches it at every child with siblings below.

          It reaches UP across the row gap and stops at the row's own bottom
          edge, so consecutive rows' trunks meet exactly once. Overhanging both
          ends instead makes each pair overlap for 3px, and at 8% alpha a
          doubled segment is visibly darker — the trunk comes out beaded at
          every row boundary rather than drawn as one line. */}
      {row.depth > 0 && (
        <div
          aria-hidden="true"
          className="absolute z-0 flex items-stretch"
          style={{
            left: CHEVRON_CENTER,
            top: -ROW_GAP,
            bottom: -trailingSlack,
          }}
        >
          {Array.from({ length: row.depth }, (_, i) => {
            const isElbow = i === row.depth - 1;
            const continues = !row.isLastPath[i + 1];
            return (
              <div
                key={i}
                className="relative shrink-0"
                style={{ width: INDENT }}
              >
                {/* The trunk is ONE unbroken rule, whether it is an ancestor's
                    passing through or this row's own continuing below. Letting
                    the corner draw part of it is what put a break in the line:
                    a rounded corner's left border stops short of the bend by
                    its radius, and the arc's ink does not resume the vertical
                    exactly where it left off.

                    `--uikit-rail-stroke`, not `--faint`: the guidelines cross
                    and overlap themselves at every bend, and an alpha colour
                    compounds where it doubles — a hairline that is 8% black in
                    one place and 15% in another reads as a line drawn twice.
                    A flat hex cannot do that. The token exists for exactly
                    this and stays legible on `--panel-bg`. */}
                {continues && (
                  <div className="absolute top-0 bottom-0 left-0 border-l border-uikit-rail-stroke" />
                )}
                {isElbow && (
                  <>
                    {/* EVERY child curves out of the trunk — a branch leaves
                        its parent by bending away from it, not by crossing it.
                        A right-angled T reads as two lines that happen to
                        touch; the radius is what makes one line look like it
                        became the other. So the corner is drawn the same way
                        whether or not more siblings follow, and it carries the
                        trunk's upper half with it. */}
                    <div
                      className={cn(
                        "absolute left-0 border-b border-uikit-rail-stroke",
                        // A last child has no trunk to bend out of, so its
                        // corner has to supply the drop as well.
                        isLast && "border-l",
                      )}
                      style={{
                        width: STUB,
                        // Exactly the radius: the left edge is then all arc and
                        // no straight run, so the bend sits ON the trunk
                        // instead of alongside a second copy of it.
                        top: isLast ? 0 : ROW_GAP + ROW_H / 2 - CORNER_R,
                        height: isLast ? ROW_GAP + ROW_H / 2 : CORNER_R,
                        borderBottomLeftRadius: CORNER_R,
                      }}
                    />
                    {/* ...and a branch that continues picks the trunk back up
                        exactly where the corner's vertical ends — one radius
                        above the bend. Starting it at the bend instead leaves
                        a visible break in the line. */}
                    {continues && (
                      <div
                        className="absolute left-0 bottom-0 border-l border-uikit-rail-stroke"
                        style={{ top: ROW_GAP + ROW_H / 2 - CORNER_R }}
                      />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div
        className="relative z-10 flex w-full min-w-0 items-center"
        style={{ paddingLeft: 8 + row.depth * INDENT }}
      >
        <span
          className="shrink-0 inline-flex items-center justify-center"
          style={{ width: 14 }}
        >
          {hasChildren && (
            <button
              type="button"
              aria-label={expanded ? "Collapse" : "Expand"}
              onClick={(e) => {
                e.stopPropagation();
                onToggle(row.key);
              }}
              className={cn(
                "appearance-none border-0 outline-none bg-transparent p-0 cursor-pointer",
                "inline-flex text-uikit-muted opacity-60 hover:opacity-100 hover:text-uikit-accent",
                "transition-transform duration-[180ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                expanded && "rotate-90",
              )}
            >
              <ChevronRight size={11} strokeWidth={1.5} />
            </button>
          )}
        </span>

        <span
          className={cn(
            "shrink-0 ml-0.5 mr-2 text-uikit-muted inline-flex items-center",
            "group-data-[selected]/row:text-uikit-accent",
            "group-data-[drop=into]/row:!text-uikit-accent",
            // Ancestor of the hovered row: ink instead of muted. A trace on the
            // one element that already speaks for the row's state, and off the
            // fill channel, which hover has to itself.
            "group-data-[trail]/row:text-uikit-ink",
          )}
        >
          {row.node.icon ?? <Folder size={14} strokeWidth={1.5} />}
        </span>

        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap pr-2">
          {row.node.displayName ?? row.node.name}
        </span>
      </div>
    </div>
  );
}
