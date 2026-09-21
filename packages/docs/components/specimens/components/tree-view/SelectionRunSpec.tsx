import { SelectionRun } from "@dreamlake/uikit";

const Row = ({ name, size }: { name: string; size: string }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 16,
      padding: "7px 10px",
      borderRadius: 8,
      background: "var(--panel-bg)",
      fontFamily: "var(--f-mono)",
      fontSize: 12,
      color: "var(--ink)",
    }}
  >
    <span>{name}</span>
    <span style={{ color: "var(--uikit-muted)", fontSize: 11 }}>{size}</span>
  </div>
);

/** Two runs, not one: the gap in the selection breaks the ring. */
export const SelectionRunSpec = () => (
  <div
    style={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 380 }}
  >
    <SelectionRun>
      <Row name="episode_0041.mcap" size="1.2 GB" />
      <Row name="episode_0042.mcap" size="980 MB" />
      <Row name="episode_0043.mcap" size="1.1 GB" />
    </SelectionRun>
    <Row name="episode_0044.mcap" size="1.4 GB" />
    <SelectionRun>
      <Row name="episode_0045.mcap" size="760 MB" />
      <Row name="episode_0046.mcap" size="1.0 GB" />
    </SelectionRun>
  </div>
);
