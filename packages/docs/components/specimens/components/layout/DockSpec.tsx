import { DockLayoutView } from "@dreamlake/uikit";

const Panel = ({ label }: { label: string }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px dashed var(--color-doc-template-faint)",
      borderRadius: 6,
      padding: "8px 12px",
      fontFamily: "var(--font-doc-template-mono)",
      fontSize: 11,
      color: "var(--color-doc-template-muted)",
      background: "var(--color-doc-template-panel)",
    }}
  >
    {label}
  </div>
);

export const DockSpec = () => (
  <div style={{ height: 280 }}>
    <DockLayoutView
      top={<Panel label="top toolbar" />}
      left={<Panel label="left dock" />}
      right={<Panel label="right dock" />}
      bottom={<Panel label="bottom bar" />}
    >
      <Panel label="canvas / content" />
    </DockLayoutView>
  </div>
);
