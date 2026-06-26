import { useState } from "react";
import { Box, Boxes } from "lucide-react";
import { TreeView, useTreeState, type TreeDataItem } from "@dreamlake/uikit";

const data: TreeDataItem[] = [
  { id: "scene", parentId: null, label: "Scene", isCollapsible: true },
  { id: "lights", parentId: "scene", label: "Lights", isCollapsible: true },
  { id: "key", parentId: "lights", label: "KeyLight" },
  { id: "fill", parentId: "lights", label: "FillLight" },
  { id: "meshes", parentId: "scene", label: "Meshes", isCollapsible: true },
  { id: "robot", parentId: "meshes", label: "Robot" },
  { id: "ground", parentId: "meshes", label: "Ground" },
  { id: "camera", parentId: "scene", label: "Camera" },
];

const getIcon = (item: TreeDataItem) =>
  item.isCollapsible ? (
    <Boxes className="size-4 text-uikit-muted" strokeWidth={1.5} />
  ) : (
    <Box className="size-4 text-uikit-muted" strokeWidth={1.5} />
  );

export const SelectableSpec = () => {
  const { visibleData, expandedItems, toggleItem, hasDescendants } =
    useTreeState({ data });
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(["robot"]),
  );

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <TreeView
        data={visibleData}
        getIcon={getIcon}
        expandedItems={expandedItems}
        onToggleItem={toggleItem}
        hasDescendants={hasDescendants}
        isSelectable
        selectedItemIds={selectedItemIds}
        onSelectionChange={setSelectedItemIds}
      />
      <p className="text-sm text-uikit-muted">
        Selected:{" "}
        <code className="font-uikit-mono">
          {[...selectedItemIds].join(", ") || "none"}
        </code>
      </p>
    </div>
  );
};
