import { useState } from "react";
import { SelectionRun } from "@dreamlake/uikit";

const FILES = [
  { name: "episode_0041.mcap", size: "1.2 GB" },
  { name: "episode_0042.mcap", size: "980 MB" },
  { name: "episode_0043.mcap", size: "1.1 GB" },
  { name: "episode_0044.mcap", size: "1.4 GB" },
  { name: "episode_0045.mcap", size: "760 MB" },
  { name: "episode_0046.mcap", size: "1.0 GB" },
];

/** Group the list into consecutive stretches that share a selection state —
 *  the same pass a real list does before it can wrap its runs. */
function runsOf(selected: Set<string>) {
  const out: { on: boolean; items: typeof FILES }[] = [];
  for (const file of FILES) {
    const on = selected.has(file.name);
    const last = out[out.length - 1];
    if (last && last.on === on) last.items.push(file);
    else out.push({ on, items: [file] });
  }
  return out;
}

export const SelectionRunSpec = () => {
  const [selected, setSelected] = useState(
    () =>
      new Set(["episode_0041.mcap", "episode_0042.mcap", "episode_0043.mcap"]),
  );

  const toggle = (name: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const Row = ({ name, size }: { name: string; size: string }) => (
    <button
      type="button"
      onClick={() => toggle(name)}
      aria-pressed={selected.has(name)}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        width: "100%",
        padding: "7px 10px",
        border: 0,
        // Matches the run's radius. The ring is outset, so its INNER curve is
        // the run's corner — a row rounded any tighter pulls away from it and
        // leaves a sliver at each corner.
        borderRadius: "var(--radius)",
        background: "var(--panel-bg)",
        fontFamily: "var(--f-mono)",
        fontSize: 12,
        color: "var(--ink)",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span>{name}</span>
      <span style={{ color: "var(--uikit-muted)", fontSize: 11 }}>{size}</span>
    </button>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxWidth: 380,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {runsOf(selected).map((run, i) =>
          run.on ? (
            <SelectionRun key={i}>
              {run.items.map((f) => (
                <Row key={f.name} {...f} />
              ))}
            </SelectionRun>
          ) : (
            run.items.map((f) => <Row key={f.name} {...f} />)
          ),
        )}
      </div>
      <span
        style={{
          fontFamily: "var(--f-mono)",
          fontSize: 10.5,
          color: "var(--uikit-muted)",
          opacity: 0.8,
        }}
      >
        click a row — {selected.size} selected
      </span>
    </div>
  );
};
