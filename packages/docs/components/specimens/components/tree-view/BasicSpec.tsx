import { useState } from "react";
import { Folder, FolderOpen, File } from "lucide-react";
import { TreeView, useTreeState, type TreeDataItem } from "@dreamlake/uikit";

const data: TreeDataItem[] = [
  { id: "src", parentId: null, label: "src", isCollapsible: true },
  {
    id: "components",
    parentId: "src",
    label: "components",
    isCollapsible: true,
  },
  { id: "button", parentId: "components", label: "Button.tsx" },
  { id: "input", parentId: "components", label: "Input.tsx" },
  { id: "hooks", parentId: "src", label: "hooks", isCollapsible: true },
  { id: "use-tree", parentId: "hooks", label: "useTree.ts" },
  { id: "index", parentId: "src", label: "index.ts" },
  { id: "readme", parentId: null, label: "README.md" },
];

const getIcon = (item: TreeDataItem, expanded?: boolean) =>
  item.isCollapsible ? (
    expanded ? (
      <FolderOpen className="size-4 text-uikit-muted" strokeWidth={1.5} />
    ) : (
      <Folder className="size-4 text-uikit-muted" strokeWidth={1.5} />
    )
  ) : (
    <File className="size-4 text-uikit-muted" strokeWidth={1.5} />
  );

export const BasicSpec = () => {
  const { visibleData, expandedItems, toggleItem, hasDescendants } =
    useTreeState({ data });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="w-full max-w-sm">
      <TreeView
        data={visibleData}
        getIcon={getIcon}
        expandedItems={expandedItems}
        onToggleItem={toggleItem}
        hasDescendants={hasDescendants}
        hoveredId={hoveredId}
        onItemHover={setHoveredId}
      />
    </div>
  );
};
