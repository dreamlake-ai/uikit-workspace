import {
  SyncScrollProvider,
  SyncDragX,
  SyncDragSlaveX,
} from "@dreamlake/uikit";

const cols = Array.from({ length: 40 }, (_, i) => i + 1);

const trackStyle = {
  display: "flex",
  gap: 8,
  width: "max-content",
  padding: 8,
};

const cellStyle = {
  flex: "0 0 auto",
  width: 80,
  height: 56,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "var(--font-doc-template-mono)",
  fontSize: 12,
  border: "1px solid var(--color-doc-template-faint)",
  borderRadius: 6,
};

const paneStyle = {
  border: "1px solid var(--color-doc-template-faint)",
  borderRadius: 6,
};

export const DragSpec = () => (
  <SyncScrollProvider>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SyncDragX style={paneStyle}>
        <div style={trackStyle}>
          {cols.map((n) => (
            <div key={n} style={cellStyle}>
              drag {n}
            </div>
          ))}
        </div>
      </SyncDragX>
      <SyncDragSlaveX style={paneStyle}>
        <div style={trackStyle}>
          {cols.map((n) => (
            <div key={n} style={cellStyle}>
              slave {n}
            </div>
          ))}
        </div>
      </SyncDragSlaveX>
    </div>
  </SyncScrollProvider>
);
