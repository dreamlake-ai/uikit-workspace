import { ChevronDown, ChevronRight } from "lucide-react";
import React, { type ReactNode, useMemo, useState } from "react";

import {
  cleanIndirectSelectedNodes,
  getAdjacentSelectionState,
  getMultiSelectState,
  getRangeIds,
} from "./hooks";
import { type TreeDataItem, type TreeDataItemWithMeta } from "./types";
import { cn } from "../../lib/utils";
import { ContextMenu, ContextMenuTrigger } from "../ContextMenu";

/**
 * Augment a selection (visual-only) so that a group whose entire subtree is
 * selected reads as selected too — this makes the multi-select ring wrap the
 * group node along with its children. The real `selectedItemIds` (used by click
 * handlers and the consumer) is left untouched.
 */
function withFullGroupsSelected<T extends TreeDataItem>(
  selectedIds: Set<string>,
  data: TreeDataItemWithMeta<T>[],
): Set<string> {
  if (selectedIds.size === 0) return selectedIds;
  const childrenMap = new Map<string, string[]>();
  for (const it of data) {
    const p = it.parentId;
    if (p == null) continue;
    if (!childrenMap.has(p)) childrenMap.set(p, []);
    childrenMap.get(p)!.push(it.id);
  }
  const augmented = new Set(selectedIds);
  // Flat order is parent-before-children (DFS pre-order), so iterating in
  // reverse decides every child before its parent — a clean bottom-up pass.
  // Only selectable groups auto-select (e.g. the non-selectable Scene/Staging
  // roots never get pulled in even when their whole subtree is selected).
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].selectable === false) continue;
    const kids = childrenMap.get(data[i].id);
    if (kids && kids.length > 0 && kids.every((k) => augmented.has(k))) {
      augmented.add(data[i].id);
    }
  }
  return augmented;
}

export type TreeViewProps<T extends TreeDataItem> = {
  data: TreeDataItemWithMeta<T>[];
  getIcon: (item: T, expanded?: boolean) => ReactNode;
  expandedItems?: Set<string>;
  onToggleItem?: (id: string) => void;
  onItemHover?: (id: string | null) => void;
  hoveredId?: string | null;
  isSelectable?: boolean;
  selectedItemIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  hideExpand?: boolean;
  hasDescendants?: (id: string) => boolean;
  renderLabel?: (label: string, itemId: string) => ReactNode;
  className?: string;
  renderContextMenu?: (item: T) => ReactNode;
  selectionMode?: "single" | "multi";
  /** Hovering a group also highlights its whole subtree as one block (the
   *  scene-graph behavior). Set false for plain row-only hover. */
  hoverSubtree?: boolean;
  /** How a LONE selected row (a single leaf with no adjacent selection)
   *  renders: 'fill' (default) = solid bg-uikit-tree-sel row; 'ring' = the
   *  same accent ring as group selections, with the row background left
   *  transparent. Group / multi-row selections always use the ring. */
  loneSelectionStyle?: "fill" | "ring";
  /** Where the expand chevron renders: 'leading' (default) — before the row
   *  icon; 'trailing' — a smaller, dimmed chevron right after the label text
   *  (collapsed points LEFT, toward the label it reveals under). */
  chevronPosition?: "leading" | "trailing";
  /** What selecting a GROUP row means: 'subtree' (default) marks the group
   *  plus all descendants as one selected block; 'row' marks only the
   *  clicked row — descendants are untouched and every row stands alone
   *  (a selected group renders like any lone selection). */
  groupSelection?: "subtree" | "row";
};

/**
 * A flat-rendered hierarchical tree (scene graph, file tree, …). Map over
 * `data` produced by `useTreeState`. For large trees use `VirtualTreeView`.
 *
 * Ported from the legacy `@vuer-ai/vuer-uikit` TreeView; restyled to DreamLake
 * tokens (selection/hover surfaces, hairline guidelines).
 */
export function TreeView<T extends TreeDataItem>({
  data,
  getIcon,
  expandedItems,
  onToggleItem,
  onItemHover,
  hoveredId,
  isSelectable = false,
  selectedItemIds,
  onSelectionChange,
  hideExpand = false,
  hasDescendants = () => false,
  renderLabel = (label) => label,
  className,
  renderContextMenu,
  selectionMode = "multi",
  hoverSubtree = true,
  loneSelectionStyle = "fill",
  chevronPosition = "leading",
  groupSelection = "subtree",
}: TreeViewProps<T>) {
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  // Hover is self-managed unless the consumer wires onItemHover (e.g. Waterfall
  // syncs hover with its timeline). This lets hover — including the subtree
  // highlight — work out of the box for consumers like the scene graph.
  const [internalHoveredId, setInternalHoveredId] = useState<string | null>(
    null,
  );
  const hoverControlled = onItemHover !== undefined;
  const effectiveHoveredId = hoverControlled
    ? (hoveredId ?? null)
    : internalHoveredId;
  const handleHover = onItemHover ?? setInternalHoveredId;
  // Visual selection: a fully-selected group also reads as selected, so the
  // ring wraps the group + its subtree. Click logic still uses the real set.
  const displaySelectedIds = useMemo(
    () =>
      selectedItemIds && groupSelection === "subtree"
        ? withFullGroupsSelected(selectedItemIds, data)
        : selectedItemIds,
    [selectedItemIds, data, groupSelection],
  );
  return (
    <div className={cn("flex-1 overflow-y-auto font-uikit-ui", className)}>
      {data.map((item) => (
        <TreeEntryItem
          key={item.id}
          item={item}
          hoveredId={effectiveHoveredId}
          onItemHover={handleHover}
          isSelectable={isSelectable}
          selectedItemIds={selectedItemIds}
          displaySelectedIds={displaySelectedIds}
          onSelectionChange={onSelectionChange}
          lastSelectedId={lastSelectedId}
          setLastSelectedId={setLastSelectedId}
          expandedItems={expandedItems}
          toggleItem={onToggleItem}
          hideExpand={hideExpand}
          hasDescendants={hasDescendants}
          getIcon={getIcon}
          renderLabel={renderLabel}
          dataWithMeta={data}
          renderContextMenu={renderContextMenu}
          selectionMode={selectionMode}
          hoverSubtree={hoverSubtree}
          loneSelectionStyle={loneSelectionStyle}
          chevronPosition={chevronPosition}
          groupSelection={groupSelection}
        />
      ))}
    </div>
  );
}

export function TreeEntryItem<T extends TreeDataItem>({
  item,
  hoveredId,
  onItemHover,
  isSelectable,
  selectedItemIds,
  displaySelectedIds,
  onSelectionChange,
  lastSelectedId,
  setLastSelectedId,
  expandedItems,
  toggleItem = () => {},
  hideExpand = false,
  hasDescendants = () => false,
  getIcon = () => null,
  renderLabel = (label) => label,
  dataWithMeta = [],
  renderContextMenu,
  selectionMode = "multi",
  hoverSubtree = true,
  loneSelectionStyle = "fill",
  chevronPosition = "leading",
  groupSelection = "subtree",
}: {
  item: TreeDataItemWithMeta<T>;
  hoveredId?: string | null;
  onItemHover?: (id: string | null) => void;
  isSelectable?: boolean;
  selectedItemIds?: Set<string>;
  /** Visual selection (real set + fully-selected groups). Defaults to
   *  selectedItemIds. Used only for hover/ring rendering, not click logic. */
  displaySelectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  lastSelectedId?: string | null;
  setLastSelectedId?: (id: string | null) => void;
  expandedItems?: Set<string>;
  toggleItem?: (id: string) => void;
  hideExpand?: boolean;
  hasDescendants?: (id: string) => boolean;
  getIcon?: (item: T, expanded?: boolean) => ReactNode;
  renderLabel?: (label: string, itemId: string) => ReactNode;
  dataWithMeta?: TreeDataItemWithMeta<T>[];
  renderContextMenu?: (item: T) => ReactNode;
  selectionMode?: "single" | "multi";
  hoverSubtree?: boolean;
  loneSelectionStyle?: "fill" | "ring";
  chevronPosition?: "leading" | "trailing";
  groupSelection?: "subtree" | "row";
}) {
  const handleItemSelect = (event: React.MouseEvent) => {
    if (!item.disable && isSelectable && item.selectable !== false) {
      const isMultiSelectMode =
        selectionMode === "multi" && (event.ctrlKey || event.metaKey);
      const isRangeSelectMode = selectionMode === "multi" && event.shiftKey;

      if (isMultiSelectMode && groupSelection === "subtree") {
        const selectState = getMultiSelectState(
          item.id,
          selectedItemIds || new Set(),
          dataWithMeta,
        );
        if (selectState === "indirect") return;
      }

      let newSelectedIds: Set<string>;
      if (isRangeSelectMode && lastSelectedId) {
        if (selectedItemIds) {
          newSelectedIds = new Set(selectedItemIds);
          getRangeIds(lastSelectedId, item.id, dataWithMeta).forEach((id) =>
            newSelectedIds.add(id),
          );
        } else {
          newSelectedIds = new Set([item.id]);
        }
      } else if (isMultiSelectMode) {
        if (selectedItemIds) {
          newSelectedIds = new Set(selectedItemIds);
          if (newSelectedIds.has(item.id)) newSelectedIds.delete(item.id);
          else newSelectedIds.add(item.id);
        } else {
          newSelectedIds = new Set([item.id]);
        }
      } else {
        newSelectedIds = new Set([item.id]);
      }

      // In 'row' mode a selected ancestor doesn't imply its descendants, so
      // directly-selected descendants must survive.
      const cleanedSelectedIds =
        groupSelection === "row"
          ? newSelectedIds
          : cleanIndirectSelectedNodes(newSelectedIds, dataWithMeta);
      if (onSelectionChange) {
        onSelectionChange(cleanedSelectedIds);
        setLastSelectedId?.(item.id);
      }
    }
  };

  const ancestors = item.ancestors || [];
  const indent = item.indent || 0;
  const isLast = item.isLast !== undefined ? item.isLast : false;

  // Visual selection (includes fully-selected groups); falls back to the real
  // set when not provided. In 'row' group-selection mode an ancestor's
  // selection does NOT mark its descendants — every row stands alone.
  const visualIds = displaySelectedIds || selectedItemIds || new Set<string>();
  const rowIndex = dataWithMeta.findIndex((d) => d.id === item.id);
  const selectState =
    groupSelection === "row"
      ? visualIds.has(item.id)
        ? "selected"
        : "unselected"
      : getMultiSelectState(item.id, visualIds, dataWithMeta);
  const isSelected = selectState === "selected";
  const isIndirectlySelected = selectState === "indirect";

  const { hasPrevSelected, hasNextSelected } =
    groupSelection === "row"
      ? {
          hasPrevSelected:
            rowIndex > 0 && visualIds.has(dataWithMeta[rowIndex - 1].id),
          hasNextSelected:
            rowIndex >= 0 &&
            rowIndex < dataWithMeta.length - 1 &&
            visualIds.has(dataWithMeta[rowIndex + 1].id),
        }
      : getAdjacentSelectionState(item.id, visualIds, dataWithMeta);

  const isLeaf = !hasDescendants(item.id);
  // Non-selectable rows (e.g. the top-level Scene/Staging groups) don't react
  // to selection.
  const isSelectableRow = isSelectable && item.selectable !== false;

  // Hover is independent of selection: any non-disabled, non-group-header row
  // reacts to hover — so read-only trees like the Waterfall (which don't enable
  // selection) still get row hover + the row↔bar hover link.
  const isHoverable = !item.disable && item.selectable !== false;

  // Hover follows the subtree: hovering a group highlights the group and all
  // of its descendants (per the ml-dash design) — unless hoverSubtree is off,
  // in which case only the row under the cursor highlights.
  const isHovered =
    isHoverable &&
    hoveredId != null &&
    (hoveredId === item.id ||
      (hoverSubtree && ancestors.some((a) => a.id === hoveredId)));

  // Adjacency within the hover block (hovered node + its descendants) so the
  // highlight rounds only its outer corners, like the selection block.
  const inHoverBlock = (row?: TreeDataItemWithMeta<T>) =>
    !!row &&
    hoveredId != null &&
    (row.id === hoveredId ||
      (hoverSubtree && (row.ancestors || []).some((a) => a.id === hoveredId)));
  const hasPrevHover = rowIndex > 0 && inHoverBlock(dataWithMeta[rowIndex - 1]);
  const hasNextHover =
    rowIndex >= 0 &&
    rowIndex < dataWithMeta.length - 1 &&
    inHoverBlock(dataWithMeta[rowIndex + 1]);

  // Selection visuals:
  //  - lone selected LEAF  → solid system-blue fill + white text
  //  - everything else selected (a run of ≥2, a group, or a group's indirect
  //    descendants) → a 2px accent ring tracing the merged block's outer edges
  //    (inner joined edges cleared) with the row background left unchanged.
  // In 'row' group-selection mode a selected GROUP also counts as a lone
  // row (there is no subtree block for it to anchor), so it takes the same
  // lone-selection treatment as a leaf.
  const isLoneLeafSelected =
    isSelectable &&
    isSelected &&
    (isLeaf || groupSelection === "row") &&
    !hasPrevSelected &&
    !hasNextSelected;
  const loneFill = loneSelectionStyle === "fill" && isLoneLeafSelected;
  const inRing =
    isSelectable && !loneFill && (isSelected || isIndirectlySelected);

  const ringShadow = (() => {
    if (!inRing) return undefined;
    const a = "var(--uikit-accent)";
    const sides = [`inset 2px 0 0 0 ${a}`, `inset -2px 0 0 0 ${a}`];
    if (!hasPrevSelected) sides.push(`inset 0 2px 0 0 ${a}`);
    if (!hasNextSelected) sides.push(`inset 0 -2px 0 0 ${a}`);
    return sides.join(", ");
  })();

  // Outer-corner rounding so a run of consecutive rows reads as one rounded
  // shape — selection block takes precedence, then the hover block.
  const blockRadius = (hasPrev: boolean, hasNext: boolean) => {
    if (hasPrev && hasNext) return "";
    if (hasPrev) return "rounded-b-[var(--radius)]";
    if (hasNext) return "rounded-t-[var(--radius)]";
    return "rounded-[var(--radius)]";
  };
  const getBorderRadiusClass = () => {
    if (isSelectable && (isLoneLeafSelected || inRing))
      return blockRadius(hasPrevSelected, hasNextSelected);
    if (isHovered) return blockRadius(hasPrevHover, hasNextHover);
    return "";
  };

  const handleContextMenuOpenChange = (open: boolean) => {
    if (
      open &&
      isSelectable &&
      item.selectable !== false &&
      !isSelected &&
      !isIndirectlySelected &&
      onSelectionChange
    ) {
      onSelectionChange(new Set([item.id]));
    }
  };

  const treeItemContent = (
    <div
      className={cn(
        "group relative flex h-[32px] items-center",
        getBorderRadiusClass(),
        // Every selected row — a lone leaf, a run member, or a group + its
        // indirect descendants — gets the neutral-grey fill, so the selection
        // reads the same whether one row or many are picked. A multi-row run
        // adds the accent ring on top (ringShadow) as the grouping cue.
        loneSelectionStyle === "fill" &&
          (isLoneLeafSelected || inRing) &&
          "bg-uikit-tree-sel hover:bg-uikit-tree-sel-hover",
        // hover (warm-amber light / cool-blue dark) for any non-filled row;
        // with the 'ring' style selected rows stay transparent, so the wash
        // keeps working on them too
        isHovered &&
          (loneSelectionStyle === "ring" || (!isLoneLeafSelected && !inRing)) &&
          "bg-uikit-tree-hover",
      )}
      style={ringShadow ? { boxShadow: ringShadow } : undefined}
      onMouseEnter={() => {
        if (isHoverable) onItemHover?.(item.id);
      }}
      onMouseLeave={() => onItemHover?.(null)}
      onClick={handleItemSelect}
      onMouseDown={(e) => {
        if (e.shiftKey || e.ctrlKey || e.metaKey) e.preventDefault();
      }}
    >
      {/* Guidelines */}
      <div className="absolute top-0 left-[-0.28rem] z-0 flex h-full items-center">
        {ancestors.map((ancestor, index) => {
          const parentIsLast = dataWithMeta.find(
            (d) => d.id === ancestor.id,
          )?.isLast;
          return (
            <div
              key={index}
              className={cn(
                "h-full w-[1.25rem]",
                parentIsLast ? "" : "border-l",
                "border-uikit-faint",
              )}
            />
          );
        })}
        {indent > 0 && (
          <div className="relative h-full w-[1.24rem]">
            <div
              className={cn(
                "absolute top-0 left-0 h-1/2 w-1/2 border-b border-l",
                isLast ? "rounded-bl-md" : "",
                "border-uikit-faint",
              )}
            />
            {!isLast && (
              <div className="border-uikit-faint absolute top-1/2 left-0 h-1/2 w-1/2 border-l" />
            )}
          </div>
        )}
      </div>

      <div
        className="text-uikit-12 z-10 flex w-full items-center justify-between gap-2 px-2 font-normal whitespace-nowrap"
        style={{ paddingLeft: `${indent * 1.25 + 0.5}rem` }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {!hideExpand &&
          hasDescendants(item.id) &&
          chevronPosition === "leading" ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
                className="flex size-4 cursor-pointer items-center justify-center"
              >
                {expandedItems && !expandedItems?.has(item.id) ? (
                  <ChevronRight
                    className={cn(
                      "size-4 transition-transform",
                      item.disable && "text-uikit-muted",
                    )}
                    strokeWidth={1.5}
                  />
                ) : (
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      item.disable && "text-uikit-muted",
                    )}
                    strokeWidth={1.5}
                  />
                )}
              </button>
              <div
                className={cn(
                  "flex size-4 items-center justify-center",
                  item.disable && "text-uikit-muted",
                )}
              >
                {getIcon(item, expandedItems?.has?.(item.id))}
              </div>
            </>
          ) : !hideExpand && hasDescendants(item.id) ? (
            <div
              className={cn(
                "flex size-4 items-center justify-center",
                item.disable && "text-uikit-muted",
              )}
            >
              {getIcon(item, expandedItems?.has?.(item.id))}
            </div>
          ) : (
            <div className="relative flex size-4 items-center justify-center">
              {item.isCollapsible && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleItem(item.id);
                  }}
                  className="absolute z-20 flex cursor-pointer items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
                >
                  {expandedItems && !expandedItems?.has(item.id) ? (
                    <ChevronRight
                      className={cn(
                        "size-4 transition-transform",
                        item.disable && "text-uikit-muted",
                      )}
                      strokeWidth={1.5}
                    />
                  ) : (
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform",
                        item.disable && "text-uikit-muted",
                      )}
                      strokeWidth={1.5}
                    />
                  )}
                </button>
              )}
              <div
                className={cn(
                  "cursor-pointer transition-opacity",
                  item.isCollapsible && "group-hover:opacity-0",
                  item.disable && "text-uikit-muted",
                )}
              >
                {getIcon(item, expandedItems?.has(item.id))}
              </div>
            </div>
          )}
          {(() => {
            const label = item.label;
            const keepEnd = 9;
            if (label.length <= keepEnd) {
              return (
                <span
                  className={cn(
                    "truncate select-none",
                    item.disable && "text-uikit-muted",
                  )}
                >
                  {renderLabel(label, item.id)}
                </span>
              );
            }
            const firstPart = label.substring(0, label.length - keepEnd);
            const lastPart = label.substring(label.length - keepEnd);
            return (
              <span
                className={cn(
                  // In trailing-chevron mode the label hugs its text so the
                  // chevron sits right after the visible characters; min-w-0
                  // still lets it shrink + truncate when the row is tight.
                  "flex min-w-0 select-none",
                  chevronPosition === "leading" && "flex-1",
                  item.disable && "text-uikit-muted",
                )}
                style={{ maxWidth: "100%" }}
              >
                <span className="min-w-0 truncate">{firstPart}</span>
                <span className="shrink-0">{lastPart}</span>
              </span>
            );
          })()}
          {!hideExpand &&
            hasDescendants(item.id) &&
            chevronPosition === "trailing" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
                className="flex size-4 shrink-0 cursor-pointer items-center justify-center"
              >
                {(() => {
                  // Quiet affordance: smaller + dimmed vs the leading
                  // chevron, so it doesn't outweigh the row icons.
                  const chevronClass = cn(
                    "size-3 opacity-50 transition-transform",
                    item.disable && "text-uikit-muted",
                  );
                  return expandedItems && !expandedItems?.has(item.id) ? (
                    <ChevronRight className={chevronClass} strokeWidth={1.5} />
                  ) : (
                    <ChevronDown className={chevronClass} strokeWidth={1.5} />
                  );
                })()}
              </button>
            )}
        </div>
        {item.actions && (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {item.actions}
          </div>
        )}
      </div>
    </div>
  );

  if (renderContextMenu && item.selectable !== false) {
    return (
      <ContextMenu onOpenChange={handleContextMenuOpenChange}>
        <ContextMenuTrigger asChild>{treeItemContent}</ContextMenuTrigger>
        {renderContextMenu(item)}
      </ContextMenu>
    );
  }

  return treeItemContent;
}
