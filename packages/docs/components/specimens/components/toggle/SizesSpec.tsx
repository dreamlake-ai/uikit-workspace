import { useState } from "react";
import { Toggle } from "@dreamlake/uikit";
import { ShapePair } from "../ShapePair";

// `size` scales the padding, text and icon: sm / base (default) / lg.
export const SizesSpec = () => {
  const [on, setOn] = useState({ sm: false, base: true, lg: false });
  return (
    <ShapePair>
      {(shape) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Toggle
            shape={shape}
            size="sm"
            pressed={on.sm}
            onPressedChange={(p) => setOn((s) => ({ ...s, sm: p }))}
          >
            Small
          </Toggle>
          <Toggle
            shape={shape}
            size="base"
            pressed={on.base}
            onPressedChange={(p) => setOn((s) => ({ ...s, base: p }))}
          >
            Base
          </Toggle>
          <Toggle
            shape={shape}
            size="lg"
            pressed={on.lg}
            onPressedChange={(p) => setOn((s) => ({ ...s, lg: p }))}
          >
            Large
          </Toggle>
        </div>
      )}
    </ShapePair>
  );
};
