import { useState } from "react";
import { Folder, FolderOpen, File } from "lucide-react";
import {
  TreeView,
  TreeSearchBar,
  useTreeState,
  useTreeSearch,
  type TreeDataItem,
} from "@dreamlake/uikit";

const data: TreeDataItem[] = [
  { id: "app", parentId: null, label: "app", isCollapsible: true },
  { id: "routes", parentId: "app", label: "routes", isCollapsible: true },
  { id: "home", parentId: "routes", label: "home.tsx" },
  { id: "about", parentId: "routes", label: "about.tsx" },
  { id: "settings", parentId: "routes", label: "settings.tsx" },
  { id: "lib", parentId: "app", label: "lib", isCollapsible: true },
  { id: "fetcher", parentId: "lib", label: "fetcher.ts" },
  { id: "format", parentId: "lib", label: "format.ts" },
  { id: "config", parentId: "app", label: "config.ts" },
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

export const SearchSpec = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isRegex, setIsRegex] = useState(false);

  const { filteredData, searchResultsCount, isRegexValid, renderLabel } =
    useTreeSearch({
      data,
      searchQuery,
      isCaseSensitive,
      isRegex,
    });

  const { visibleData, expandedItems, toggleItem, hasDescendants } =
    useTreeState({
      data: filteredData,
    });

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <TreeSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isCaseSensitive={isCaseSensitive}
        setIsCaseSensitive={setIsCaseSensitive}
        isRegex={isRegex}
        setIsRegex={setIsRegex}
        isRegexValid={isRegexValid}
        searchResultsCount={searchResultsCount}
      />
      <TreeView
        data={visibleData}
        getIcon={getIcon}
        expandedItems={expandedItems}
        onToggleItem={toggleItem}
        hasDescendants={hasDescendants}
        renderLabel={renderLabel}
      />
    </div>
  );
};
