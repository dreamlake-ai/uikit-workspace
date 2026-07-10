import { useState } from "react";
import { BookMarked, FolderGit2 } from "lucide-react";
import { TreeView, useTreeState, type TreeDataItem } from "@dreamlake/uikit";

const data: TreeDataItem[] = [
  { id: "studio", parentId: null, label: "studio", isCollapsible: true },
  { id: "studio-main", parentId: "studio", label: "main" },
  { id: "studio-panels", parentId: "studio", label: "panel-integrations" },
  { id: "uikit", parentId: null, label: "uikit", isCollapsible: true },
  { id: "uikit-docs", parentId: "uikit", label: "docs-restructure" },
];

const getIcon = (item: TreeDataItem) =>
  item.parentId === null ? (
    <BookMarked className="size-3 text-uikit-muted" strokeWidth={1.7} />
  ) : (
    <FolderGit2 className="size-3 text-uikit-muted" strokeWidth={1.7} />
  );

export const QuietSpec = () => {
  const { visibleData, expandedItems, toggleItem, hasDescendants } =
    useTreeState({ data });
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(),
  );

  return (
    <div className="w-full max-w-sm">
      <TreeView
        data={visibleData}
        getIcon={getIcon}
        expandedItems={expandedItems}
        onToggleItem={toggleItem}
        hasDescendants={hasDescendants}
        isSelectable
        selectionMode="single"
        selectedItemIds={selectedItemIds}
        onSelectionChange={setSelectedItemIds}
        hoverSubtree={false}
        loneSelectionStyle="ring"
        chevronPosition="trailing"
      />
    </div>
  );
};
