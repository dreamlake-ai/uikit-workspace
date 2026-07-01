import { useState } from "react";
import {
  Button,
  Card,
  DockLayoutView,
  LiquidLayoutView,
  Toolbar,
  cn,
} from "@dreamlake/uikit";

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

// A Toolbar (not a Card) for the top slot: it carries its own border + shadow,
// so it floats over the content in BOTH layouts — the dock layout's
// flatten-docked-cards rule only targets Cards, never the toolbar.
const TopBar = () => (
  <Toolbar size="sm" className="shadow-uikit-sm text-uikit-11 text-uikit-muted">
    top toolbar
  </Toolbar>
);

/**
 * Both layout shells share the same `left/right/top/bottom` + center slot API,
 * so swapping between them is a one-line change. Click the button to switch:
 * the dock layout docks the side panels onto solid rails (cards go flat, with a
 * hairline divider against the content), while the liquid layout floats the same
 * cards over the (pointer-transparent) center content. The top toolbar floats in
 * both, because it's a Toolbar rather than a Card.
 */
export const SwitchSpec = () => {
  const [liquid, setLiquid] = useState(false);
  const View = liquid ? LiquidLayoutView : DockLayoutView;

  return (
    <div style={{ height: 384 }} className="flex flex-col gap-2">
      <Button
        size="sm"
        variant="secondary"
        className="self-start"
        onClick={() => setLiquid((v) => !v)}
      >
        {liquid ? "Liquid layout" : "Dock layout"} — switch
      </Button>

      <div className="relative flex-1 overflow-hidden rounded-[var(--radius)] border border-uikit-faint">
        <View
          top={<TopBar />}
          left={<Block label="left" className="h-full w-40" />}
          right={<Block label="right" className="h-full w-44" />}
          bottom={<Block label="bottom bar" className="h-9 w-full" />}
        >
          <Block label="canvas / content" className="h-full w-full" />
        </View>
      </div>
    </div>
  );
};
