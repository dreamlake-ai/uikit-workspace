import { useState } from "react";
import {
  Button,
  Card,
  DockLayoutView,
  LiquidLayoutView,
} from "@dreamlake/uikit";

const Block = ({ label }: { label: string }) => (
  <Card size="sm" className="text-uikit-11 text-uikit-muted">
    {label}
  </Card>
);

/**
 * Both layout shells share the same `left/right/top/bottom` + center slot API,
 * so swapping between them is a one-line change. Click the button to switch:
 * the dock layout docks the panels onto solid full-height rails (cards go flat —
 * no border/shadow), while the liquid layout floats the same cards over the
 * (pointer-transparent) center content.
 */
export const SwitchSpec = () => {
  const [liquid, setLiquid] = useState(false);
  const View = liquid ? LiquidLayoutView : DockLayoutView;

  return (
    <div style={{ height: 360 }} className="flex flex-col gap-2">
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
          left={<Block label="left" />}
          right={<Block label="right" />}
          top={<Block label="top toolbar" />}
          bottom={<Block label="bottom bar" />}
        >
          <Block label="canvas / content" />
        </View>
      </div>
    </div>
  );
};
