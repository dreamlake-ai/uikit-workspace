import { useState } from "react";
import { Check, ChevronRight, ExternalLink } from "lucide-react";
import {
  CollectionList,
  CollectionRow,
  TreeBranchGuides,
  VirtualList,
} from "@dreamlake/uikit";

type Entry = { id: string; title: string; children?: Entry[] };
const entries: Entry[] = [
  {
    id: "suite",
    title: "Recorded evaluation",
    children: [
      {
        id: "quality",
        title: "Quality checks",
        children: [
          {
            id: "accuracy",
            title: "Accuracy across the complete validation dataset",
          },
          { id: "calibration", title: "Calibration" },
        ],
      },
      { id: "latency", title: "Latency" },
      {
        id: "batch",
        title: "Repeated trials",
        children: Array.from({ length: 40 }, (_, i) => ({
          id: `trial-${i}`,
          title: `Recorded trial ${i + 1}`,
        })),
      },
    ],
  },
];

/** These are caller-owned identities, not a tree inferred from names or status. */
function visibleRows(
  nodes: Entry[],
  expanded: Set<string>,
  depth = 0,
  ancestors: boolean[] = [],
) {
  const result: {
    entry: Entry;
    depth: number;
    ancestors: boolean[];
    isLast: boolean;
  }[] = [];
  nodes.forEach((entry, index) => {
    const isLast = index === nodes.length - 1;
    result.push({ entry, depth, ancestors, isLast });
    if (entry.children && expanded.has(entry.id))
      result.push(
        ...visibleRows(
          entry.children,
          expanded,
          depth + 1,
          depth === 0 ? [] : [...ancestors, !isLast],
        ),
      );
  });
  return result;
}

export function Demo() {
  const [width, setWidth] = useState(420);
  const [expanded, setExpanded] = useState(
    new Set(["suite", "quality", "batch"]),
  );
  const [selected, setSelected] = useState("accuracy");
  const rows = visibleRows(entries, expanded);
  return (
    <section aria-label="Compact tree example" className="min-w-0 p-4">
      <label className="mb-3 block text-uikit-12">
        Panel width: {width}px
        <input
          aria-label="Tree panel width"
          className="ml-3 align-middle"
          type="range"
          min={180}
          max={520}
          value={width}
          onChange={(event) => setWidth(Number(event.target.value))}
        />
      </label>
      <CollectionList
        role="list"
        aria-label="Recorded tests"
        columns={1}
        style={{ width, maxWidth: "100%", gap: 0 }}
      >
        <VirtualList
          items={rows}
          itemHeight={32}
          height={224}
          getItemKey={(row) => row.entry.id}
        >
          {(row, _index, style) => (
            <div
              key={row.entry.id}
              role="listitem"
              data-demo-row={row.entry.id}
              style={{ ...style, paddingLeft: row.depth * 20 }}
            >
              <TreeBranchGuides
                ancestors={row.ancestors}
                branch={row.depth > 0}
                isLast={row.isLast}
                step={20}
                branchOffset={16}
                style={{ left: 19 }}
              />
              <CollectionRow
                compact
                fillName
                nameText={row.entry.title}
                onClick={() => setSelected(row.entry.id)}
                iconInteractive={!!row.entry.children}
                icon={
                  row.entry.children ? (
                    <button
                      type="button"
                      aria-label={`Toggle ${row.entry.title}`}
                      aria-expanded={expanded.has(row.entry.id)}
                      className="relative inline-flex size-[18px] items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-uikit-accent"
                      onClick={() =>
                        setExpanded((previous) => {
                          const next = new Set(previous);
                          next.has(row.entry.id)
                            ? next.delete(row.entry.id)
                            : next.add(row.entry.id);
                          return next;
                        })
                      }
                    >
                      <ChevronRight
                        size={13}
                        className={
                          expanded.has(row.entry.id) ? "rotate-90" : ""
                        }
                      />
                    </button>
                  ) : (
                    <Check size={13} className="text-uikit-accent" />
                  )
                }
                name={
                  <button
                    type="button"
                    aria-pressed={selected === row.entry.id}
                    className="block whitespace-nowrap text-left after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-uikit-accent"
                    onClick={() => setSelected(row.entry.id)}
                  >
                    {row.entry.title}
                  </button>
                }
                meta={
                  row.entry.children
                    ? `${row.entry.children.length} entries`
                    : "complete"
                }
                actions={
                  !row.entry.children && (
                    <a
                      href="#recorded-source"
                      aria-label={`Open source for ${row.entry.title}`}
                      className="inline-flex size-[18px] items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-uikit-accent"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )
                }
              />
            </div>
          )}
        </VirtualList>
      </CollectionList>
      <p role="status" className="mt-3 text-uikit-12">
        Selected entry: {selected}
      </p>
      <div id="recorded-source" className="mt-3 text-uikit-12 text-uikit-muted">
        Source links in this example are local document fragments. A product
        supplies the actual recorded destination.
      </div>
    </section>
  );
}
