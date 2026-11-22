import { useState } from "react";
import { Toggle } from "@dreamlake/uikit";
import { ShapePair } from "../ShapePair";

export const BasicSpec = () => {
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(true);
  return (
    <ShapePair>
      {(shape) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Toggle shape={shape} pressed={bold} onPressedChange={setBold}>
            Bold
          </Toggle>
          <Toggle
            shape={shape}
            variant="secondary"
            pressed={italic}
            onPressedChange={setItalic}
          >
            Italic
          </Toggle>
          <Toggle shape={shape} disabled>
            Disabled
          </Toggle>
        </div>
      )}
    </ShapePair>
  );
};
