import { useState } from "react";
import { Check, ChevronRight, ExternalLink, Layers } from "lucide-react";
import {
  CollectionList,
  CollectionRow,
  TreeBranchGuides,
  TruncatedText,
  VirtualList,
  useHoverSlider,
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
  const hover = useHoverSlider<HTMLDivElement>();
  const [width, setWidth] = useState(420);
  const [expanded, setExpanded] = useState(
    new Set(["suite", "quality", "batch"]),
  );
  const [selected, setSelected] = useState("accuracy");
  const toggle = (id: string) => {
    hover.track(null);
    setExpanded((previous) => {
      const next = new Set(previous);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
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
          onChange={(event) => {
            hover.track(null);
            setWidth(Number(event.target.value));
          }}
        />
      </label>
      <div
        ref={hover.ref}
        data-uikit-hover-host=""
        className="relative isolate"
        style={{ width, maxWidth: "100%" }}
        onPointerLeave={() => hover.track(null)}
        onScrollCapture={() => hover.track(null)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            hover.track(null);
        }}
      >
        {hover.slider}
        <CollectionList
          role="list"
          aria-label="Recorded tests"
          columns={1}
          style={{ width: "100%", gap: 0 }}
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
                  data-selected={
                    (!row.entry.children && selected === row.entry.id) ||
                    undefined
                  }
                  style={
                    !row.entry.children && selected === row.entry.id
                      ? { background: "var(--selected-bg)" }
                      : undefined
                  }
                  onPointerMove={(event) =>
                    hover.track(
                      event.pointerType === "touch"
                        ? null
                        : event.currentTarget,
                    )
                  }
                  onFocusCapture={(event) => hover.track(event.currentTarget)}
                  onClick={() => {
                    hover.track(null);
                    row.entry.children
                      ? toggle(row.entry.id)
                      : setSelected(row.entry.id);
                  }}
                  icon={
                    row.entry.children ? (
                      <Layers size={13} aria-hidden />
                    ) : (
                      <Check
                        size={13}
                        aria-hidden
                        className="text-uikit-accent"
                      />
                    )
                  }
                  name={
                    <button
                      type="button"
                      aria-label={row.entry.title}
                      aria-pressed={
                        row.entry.children
                          ? undefined
                          : selected === row.entry.id
                      }
                      aria-expanded={
                        row.entry.children
                          ? expanded.has(row.entry.id)
                          : undefined
                      }
                      className="inline-flex max-w-full items-center gap-1 text-left after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-uikit-accent"
                    >
                      <TruncatedText
                        text={row.entry.title}
                        className="block min-w-0"
                      >
                        {row.entry.title}
                      </TruncatedText>
                      {row.entry.children && (
                        <ChevronRight
                          size={13}
                          aria-hidden
                          className={`shrink-0 ${expanded.has(row.entry.id) ? "rotate-90" : ""}`}
                        />
                      )}
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
      </div>
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
