import { useState } from "react";
import {
  CollectionList,
  CollectionRow,
  ListDivider,
  VirtualListFlow,
  useListSelection,
} from "@dreamlake/uikit";
import { MessageSquare } from "lucide-react";

const rows = [
  {
    id: "reconnect",
    name: "Fix terminal reconnect",
    day: "Today",
    time: "just now",
  },
  {
    id: "uikit",
    name: "Update UIKit examples",
    day: "Today",
    time: "5min ago",
  },
  { id: "deploy", name: "Review deployment", day: "Today", time: "1:27 pm" },
  {
    id: "navigation",
    name: "Improve session navigation",
    day: "Yesterday",
    time: "3:42 pm",
  },
  {
    id: "archives",
    name: "Investigate archive loading",
    day: "Yesterday",
    time: "1:10 pm",
  },
  {
    id: "workspace",
    name: "Fix workspace switching",
    day: "Nov 21",
    time: "4:05 pm",
  },
];
type Entry =
  | { kind: "divider"; id: string; label: string }
  | { kind: "row"; id: string; index: number };
const entries: Entry[] = rows.flatMap((row, index): Entry[] => [
  ...(rows[index - 1]?.day !== row.day
    ? [{ kind: "divider" as const, id: `day:${row.day}`, label: row.day }]
    : []),
  { kind: "row", id: row.id, index },
]);

export function Demo({ virtualized = false }: { virtualized?: boolean }) {
  const [selected, setSelected] = useState<typeof rows>([]);
  const selection = useListSelection({
    selected,
    onSelectionChange: setSelected,
  });
  const render = (entry: Entry) => {
    if (entry.kind === "divider")
      return <ListDivider key={entry.id} label={entry.label} />;
    const row = rows[entry.index];
    return (
      <CollectionRow
        key={row.id}
        role="button"
        tabIndex={0}
        aria-label={row.name}
        aria-pressed={selection.isSelected(row.id)}
        data-demo-row=""
        style={{ height: 36, boxSizing: "border-box", paddingBlock: 8 }}
        icon={<MessageSquare size={16} />}
        name={row.name}
        meta={row.time}
        onClick={(event) => selection.handleRowClick(entry.index, rows, event)}
        onPointerDown={(event) =>
          selection.handleRowPointerDown(entry.index, rows, event)
        }
        onPointerEnter={(event) =>
          selection.handleRowPointerEnter(entry.index, rows, event)
        }
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selection.handleRowClick(entry.index, rows, event);
          }
        }}
      />
    );
  };
  return (
    <div
      onKeyDown={(event) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === "a"
        ) {
          event.preventDefault();
          selection.selectAll(rows);
          return;
        }
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        const targets = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            "[data-demo-row]",
          ),
        ];
        const current = targets.indexOf(document.activeElement as HTMLElement);
        const next = Math.max(
          0,
          Math.min(
            targets.length - 1,
            current + (event.key === "ArrowDown" ? 1 : -1),
          ),
        );
        event.preventDefault();
        targets[next]?.focus();
      }}
    >
      {virtualized ? (
        <VirtualListFlow
          items={entries}
          itemHeight={36}
          height={216}
          getItemKey={(entry) => entry.id}
          aria-label="Virtualized grouped sessions"
        >
          {render}
        </VirtualListFlow>
      ) : (
        <CollectionList aria-label="Grouped sessions">
          {entries.map(render)}
        </CollectionList>
      )}
      <p role="status" style={{ fontSize: 12, color: "var(--muted)" }}>
        {selected.length} sessions selected
      </p>
    </div>
  );
}
