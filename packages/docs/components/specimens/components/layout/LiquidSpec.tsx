import { Card, LiquidLayoutView, Toolbar, cn } from "@dreamlake/uikit";

const Block = ({ label, className }: { label: string; className?: string }) => (
  <Card
    size="sm"
    className={cn(
      "flex items-center justify-center text-uikit-11 text-uikit-muted",
      className,
    )}
  >
    {label}
  </Card>
);

const TopBar = () => (
  <Toolbar size="sm" className="shadow-uikit-sm text-uikit-11 text-uikit-muted">
    floating top
  </Toolbar>
);

export const LiquidSpec = () => (
  <div style={{ height: 340 }}>
    <LiquidLayoutView
      top={<TopBar />}
      left={<Block label="floating left" className="h-full w-40" />}
      right={<Block label="floating right" className="h-full w-44" />}
      bottom={<Block label="floating bottom" className="h-9 w-full" />}
    >
      <Block label="interactive canvas" className="h-full w-full" />
    </LiquidLayoutView>
  </div>
);
