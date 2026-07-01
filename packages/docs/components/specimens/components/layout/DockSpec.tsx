import { Card, DockLayoutView, Toolbar, cn } from "@dreamlake/uikit";

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

// The top slot is a Toolbar (not a Card), so the dock layout's "flatten docked
// cards" rule never touches it — it keeps its border + shadow and stays
// floating over the content, exactly like the studio's tool bar.
const TopBar = () => (
  <Toolbar size="sm" className="shadow-uikit-sm text-uikit-11 text-uikit-muted">
    top toolbar
  </Toolbar>
);

export const DockSpec = () => (
  <div style={{ height: 340 }}>
    <DockLayoutView
      top={<TopBar />}
      left={<Block label="left dock" className="h-full w-40" />}
      right={<Block label="right dock" className="h-full w-44" />}
      bottom={<Block label="bottom bar" className="h-9 w-full" />}
    >
      <Block label="canvas / content" className="h-full w-full" />
    </DockLayoutView>
  </div>
);
