import { useState } from "react";
import { CollectionEntry, TreeBranchGuides } from "@dreamlake/uikit";

/** The same per-row guides work when only a virtual list's visible rows mount. */
export function DrawerBranchesSpec() {
  const [expanded, setExpanded] = useState(true);
  const [nested, setNested] = useState(true);
  const [selected, setSelected] = useState("child-a");
  const row = (
    id: string,
    label: string,
    depth: number,
    last: boolean,
    ancestors: boolean[] = [],
  ) => (
    <div
      key={id}
      className="relative h-8"
      data-demo-row={id}
      style={{ paddingLeft: depth * 20 }}
    >
      <TreeBranchGuides
        ancestors={ancestors}
        branch={depth > 0}
        isLast={last}
        emphasis="strong"
      />
      <button
        type="button"
        aria-pressed={selected === id}
        className="relative flex h-8 w-full items-center rounded-md px-2 text-left text-uikit-12 hover:bg-uikit-tree-hover aria-pressed:bg-uikit-tree-sel"
        onClick={() => setSelected(id)}
      >
        {label}
      </button>
    </div>
  );
  return (
    <div className="w-full max-w-md" data-drawer-branches-demo>
      {row("parent", "Review session", 0, true)}
      <CollectionEntry
        size="sm"
        label="Child sessions"
        expanded={expanded}
        onExpandedChange={setExpanded}
        meta="2 loaded"
        showCount={false}
      />
      {expanded && (
        <div role="group" aria-label="Child sessions">
          {row("child-a", "Spawned · investigate parser", 1, false)}
          <div className="relative h-8 pl-5">
            <TreeBranchGuides branch emphasis="strong" />
            <CollectionEntry
              size="sm"
              label="Nested agents"
              expanded={nested}
              onExpandedChange={setNested}
              meta="1 loaded"
              showCount={false}
            />
          </div>
          {nested &&
            row("nested", "Contains agent · evidence reader", 2, true, [true])}
          {row("child-b", "Forked · alternative approach", 1, true)}
        </div>
      )}
      <div
        className="mt-3 rounded-md px-2 py-2 text-uikit-12"
        data-demo-unresolved
      >
        Parent not in current results · orphan session
      </div>
      <p className="mt-3 text-uikit-12 text-uikit-muted">
        Tab to a drawer and press Enter or Space to collapse it. Select a child;
        its selection survives collapsing the drawer. Unresolved parents do not
        receive an invented connector.
      </p>
    </div>
  );
}
