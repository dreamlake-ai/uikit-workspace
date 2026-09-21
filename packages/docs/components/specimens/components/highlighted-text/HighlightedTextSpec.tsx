import { useState } from "react";
import { HighlightedText, InputRoot } from "@dreamlake/uikit";

const ROWS = [
  "lakeshore-prod / fleet-2024-06",
  "Lakeside manipulation takes, sorted by lake depth",
  "kitchen-bimanual-v3",
  "A lake is a lake is a lake",
];

export const HighlightedTextSpec = () => {
  const [query, setQuery] = useState("lake");
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxWidth: 420,
      }}
    >
      <InputRoot
        value={query}
        placeholder="type to match…"
        onChange={(e) => setQuery(e.target.value)}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {ROWS.map((row) => (
          <span
            key={row}
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 12,
              color: "var(--ink)",
            }}
          >
            <HighlightedText text={row} query={query} />
          </span>
        ))}
      </div>
    </div>
  );
};
