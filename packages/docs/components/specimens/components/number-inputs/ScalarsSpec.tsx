import { useState } from "react";
import { IntInput, DegInput, RadInput } from "@dreamlake/uikit";

export const ScalarsSpec = () => {
  const [count, setCount] = useState(8);
  const [angle, setAngle] = useState(45);
  const [phase, setPhase] = useState(Math.PI / 2);
  return (
    <div className="flex flex-col gap-4 w-full max-w-xs">
      <div className="flex flex-col gap-2">
        <IntInput size="sm" value={count} onChange={setCount} min={0} />
        <DegInput size="sm" value={angle} onChange={setAngle} step={1} />
        <RadInput size="sm" value={phase} onChange={setPhase} step={0.01} />
      </div>
      <p className="text-sm text-uikit-muted">
        Count: <code className="font-uikit-mono">{count}</code> &middot; Angle:{" "}
        <code className="font-uikit-mono">{angle}&deg;</code> &middot; Phase:{" "}
        <code className="font-uikit-mono">{phase.toFixed(3)} rad</code>
      </p>
    </div>
  );
};
