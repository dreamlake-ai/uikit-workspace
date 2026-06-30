import { Card, LiquidLayoutView } from "@dreamlake/uikit";

const Block = ({ label }: { label: string }) => (
  <Card size="sm" className="text-uikit-11 text-uikit-muted">
    {label}
  </Card>
);

export const LiquidSpec = () => (
  <div style={{ height: 280 }}>
    <LiquidLayoutView
      top={<Block label="floating top" />}
      left={<Block label="floating left" />}
      right={<Block label="floating right" />}
      bottom={<Block label="floating bottom" />}
    >
      <Block label="interactive canvas" />
    </LiquidLayoutView>
  </div>
);
