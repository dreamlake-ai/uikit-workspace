import { useState } from "react";
import { Switch } from "@dreamlake/uikit";
import { ShapePair } from "../ShapePair";

export const ControlledSpec = () => {
  const [on, setOn] = useState(true);
  return (
    <ShapePair>
      {(shape) => (
        <label
          style={{
            display: "inline-flex",
            gap: 8,
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <Switch shape={shape} checked={on} onCheckedChange={setOn} />
          <span
            style={{
              font: "12px var(--f-ui, sans-serif)",
              color: "var(--ink)",
            }}
          >
            Notifications {on ? "on" : "off"}
          </span>
        </label>
      )}
    </ShapePair>
  );
};
