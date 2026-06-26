import { LiquidLayoutView } from "@dreamlake/uikit";

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

export const LiquidSpec = () => (
  <div style={{ height: 280 }}>
    <LiquidLayoutView
      top={<Panel label="floating top" />}
      left={<Panel label="floating left" />}
      right={<Panel label="floating right" />}
      bottom={<Panel label="floating bottom" />}
    >
      <Panel label="interactive canvas" />
    </LiquidLayoutView>
  </div>
);
