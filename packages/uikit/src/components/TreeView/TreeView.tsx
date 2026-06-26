import { ChevronDown } from "lucide-react";
import React, { type ReactNode, useState } from "react";

import {
  cleanIndirectSelectedNodes,
  getAdjacentSelectionState,
  getMultiSelectState,
  getRangeIds,
} from "./hooks";
import { type TreeDataItem, type TreeDataItemWithMeta } from "./types";
import { cn } from "../../lib/utils";
import { ContextMenu, ContextMenuTrigger } from "../ContextMenu";

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
}: TreeViewProps<T>) {
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  return (
    <div className={cn("flex-1 overflow-y-auto font-uikit-ui", className)}>
      {data.map((item) => (
        <TreeEntryItem
          key={item.id}
          item={item}
          hoveredId={hoveredId}
          onItemHover={onItemHover}
          isSelectable={isSelectable}
          selectedItemIds={selectedItemIds}
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
}: {
  item: TreeDataItemWithMeta<T>;
  hoveredId?: string | null;
  onItemHover?: (id: string | null) => void;
  isSelectable?: boolean;
  selectedItemIds?: Set<string>;
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
}) {
  const handleItemSelect = (event: React.MouseEvent) => {
    if (!item.disable && isSelectable && item.selectable !== false) {
      const isMultiSelectMode =
        selectionMode === "multi" && (event.ctrlKey || event.metaKey);
      const isRangeSelectMode = selectionMode === "multi" && event.shiftKey;

      if (isMultiSelectMode) {
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

      const cleanedSelectedIds = cleanIndirectSelectedNodes(
        newSelectedIds,
        dataWithMeta,
      );
      if (onSelectionChange) {
        onSelectionChange(cleanedSelectedIds);
        setLastSelectedId?.(item.id);
      }
    }
  };

  const ancestors = item.ancestors || [];
  const indent = item.indent || 0;
  const isLast = item.isLast !== undefined ? item.isLast : false;

  const selectState = selectedItemIds
    ? getMultiSelectState(item.id, selectedItemIds, dataWithMeta)
    : "unselected";
  const isSelected = selectState === "selected";
  const isIndirectlySelected = selectState === "indirect";

  const { hasPrevSelected, hasNextSelected } = getAdjacentSelectionState(
    item.id,
    selectedItemIds || new Set(),
    dataWithMeta,
  );

  const getBorderRadiusClass = () => {
    if (!isSelectable || (!isSelected && !isIndirectlySelected)) return "";
    if (hasPrevSelected && hasNextSelected) return "";
    if (hasPrevSelected) return "rounded-b-uikit-badge";
    if (hasNextSelected) return "rounded-t-uikit-badge";
    return "rounded-uikit-badge";
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
        hoveredId === item.id && !item.disable && "bg-uikit-ink-6",
        isSelectable &&
          isSelected &&
          "bg-uikit-accent-12 text-uikit-accent font-medium",
        isSelectable && isIndirectlySelected && "bg-uikit-ink-6 text-uikit-ink",
      )}
      onMouseEnter={() => onItemHover?.(item.id)}
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
          {!hideExpand && hasDescendants(item.id) ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
                className="flex size-4 cursor-pointer items-center justify-center"
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    expandedItems &&
                      !expandedItems?.has(item.id) &&
                      "-rotate-90",
                    item.disable && "text-uikit-muted",
                  )}
                  strokeWidth={1.5}
                />
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
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      expandedItems &&
                        !expandedItems?.has(item.id) &&
                        "-rotate-90",
                      item.disable && "text-uikit-muted",
                    )}
                    strokeWidth={1.5}
                  />
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
                  "flex min-w-0 flex-1 select-none",
                  item.disable && "text-uikit-muted",
                )}
                style={{ maxWidth: "100%" }}
              >
                <span className="min-w-0 truncate">{firstPart}</span>
                <span className="shrink-0">{lastPart}</span>
              </span>
            );
          })()}
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
