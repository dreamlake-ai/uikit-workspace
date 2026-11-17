import { useState } from "react";
import { VirtualList, useListSelection } from "@dreamlake/uikit";

const rows = Array.from({ length: 1000 }, (_, index) => ({
  id: `experiment-${index + 1}`,
  label: `Experiment ${index + 1}`,
}));

export function SelectionSpec() {
  const [selected, setSelected] = useState<(typeof rows)[number][]>([]);
  const selection = useListSelection({
    selected,
    onSelectionChange: setSelected,
    listenForEscape: false,
  });
  return (
    <section
      aria-label="Selectable experiments example"
      className="max-w-md mx-auto text-uikit-ink"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented) {
          event.preventDefault();
          selection.clear();
        }
      }}
    >
      <p className="text-xs mb-2">
        Click or drag to replace. Cmd/Ctrl adds; Shift selects a range. Tab then
        Enter selects a row; Escape clears.
      </p>
      <div className="rounded border border-uikit-faint overflow-hidden">
        <VirtualList
          items={rows}
          itemHeight={32}
          height={256}
          getItemKey={(row) => row.id}
        >
          {(row, index, style) => (
            <button
              type="button"
              style={style}
              data-selection-row={index}
              aria-pressed={selection.isSelected(row.id)}
              className="w-full text-left px-3 text-sm select-none border-l-2 border-transparent aria-pressed:border-uikit-accent aria-pressed:bg-uikit-elevated focus-visible:outline-2 focus-visible:outline-uikit-accent"
              onPointerDown={(event) =>
                selection.handleRowPointerDown(index, rows, event)
              }
              onPointerEnter={(event) =>
                selection.handleRowPointerEnter(index, rows, event)
              }
              onClick={(event) => selection.handleRowClick(index, rows, event)}
            >
              {row.label}
            </button>
          )}
        </VirtualList>
      </div>
      <output className="block text-xs mt-2" data-selection-output>
        {selected.length
          ? selected.map((row) => row.label).join(", ")
          : "No experiments selected"}
      </output>
    </section>
  );
}
