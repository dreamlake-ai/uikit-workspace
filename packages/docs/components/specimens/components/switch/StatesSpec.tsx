import { Switch } from "@dreamlake/uikit";
import { ShapePair } from "../ShapePair";

// Square is the default; `shape="round"` (or `SwitchRound`) keeps the pill.
export const StatesSpec = () => (
  <ShapePair>
    {(shape) => (
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <Switch shape={shape} defaultChecked={false} />
        <Switch shape={shape} defaultChecked />
        <Switch shape={shape} defaultChecked disabled />
        <Switch shape={shape} defaultChecked={false} disabled />
      </div>
    )}
  </ShapePair>
);
