import {
  SyncScrollProvider,
  SyncScroll,
  SyncScrollSlave,
} from "@dreamlake/uikit";

const rows = Array.from({ length: 60 }, (_, i) => i + 1);

const paneStyle = {
  flex: 1,
  height: 200,
  border: "1px solid var(--color-doc-template-faint)",
  borderRadius: 6,
};

const rowStyle = {
  padding: "8px 12px",
  fontFamily: "var(--font-doc-template-mono)",
  fontSize: 12,
  borderBottom: "1px solid var(--color-doc-template-faint)",
};

export const BasicSpec = () => (
  <SyncScrollProvider>
    <div style={{ display: "flex", gap: 16 }}>
      <SyncScroll style={paneStyle}>
        {rows.map((n) => (
          <div key={n} style={rowStyle}>
            master · row {n}
          </div>
        ))}
      </SyncScroll>
      <SyncScrollSlave style={paneStyle}>
        {rows.map((n) => (
          <div key={n} style={rowStyle}>
            slave · row {n}
          </div>
        ))}
      </SyncScrollSlave>
    </div>
  </SyncScrollProvider>
);
