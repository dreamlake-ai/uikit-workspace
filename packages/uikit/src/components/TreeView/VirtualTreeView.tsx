import { type ReactNode, useState } from "react";

import { TreeEntryItem } from "./TreeView";
import { type TreeDataItem, type TreeDataItemWithMeta } from "./types";
import { cn } from "../../lib/utils";
import { VirtualList } from "../VirtualList";

const TREE_ITEM_HEIGHT = 32;

export type VirtualTreeViewProps<T extends TreeDataItem> = {
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
  /** See {@link TreeViewProps.hoverSubtree}. */
  hoverSubtree?: boolean;
  /** See {@link TreeViewProps.loneSelectionStyle}. */
  loneSelectionStyle?: "fill" | "ring";
  /** See {@link TreeViewProps.chevronPosition}. */
  chevronPosition?: "leading" | "trailing";
  /** See {@link TreeViewProps.groupSelection}. */
  groupSelection?: "subtree" | "row";
  /** Container height — required for virtualization (default '100%'). */
  height?: number | string;
  /** Extra rows rendered outside the viewport (default 5). */
  overscan?: number;
};

/**
 * Virtualized {@link TreeView} — only renders visible rows. Use for trees with
 * thousands of nodes. Restyled to DreamLake; built on the kit's VirtualList.
 */
export function VirtualTreeView<T extends TreeDataItem>({
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
  height = "100%",
  overscan = 5,
}: VirtualTreeViewProps<T>) {
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  return (
    <VirtualList
      items={data}
      itemHeight={TREE_ITEM_HEIGHT}
      height={height}
      overscan={overscan}
      getItemKey={(item) => item.id}
      className={cn("flex-1 font-uikit-ui", className)}
    >
      {(item, _index, style) => (
        <div style={style}>
          <TreeEntryItem
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
            hoverSubtree={hoverSubtree}
            loneSelectionStyle={loneSelectionStyle}
            chevronPosition={chevronPosition}
            groupSelection={groupSelection}
          />
        </div>
      )}
    </VirtualList>
  );
}
