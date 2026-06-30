import { Card, DockLayoutView } from "@dreamlake/uikit";

const Block = ({ label }: { label: string }) => (
  <Card size="sm" className="text-uikit-11 text-uikit-muted">
    {label}
  </Card>
);

export const DockSpec = () => (
  <div style={{ height: 280 }}>
    <DockLayoutView
      top={<Block label="top toolbar" />}
      left={<Block label="left dock" />}
      right={<Block label="right dock" />}
      bottom={<Block label="bottom bar" />}
    >
      <Block label="canvas / content" />
    </DockLayoutView>
  </div>
);
