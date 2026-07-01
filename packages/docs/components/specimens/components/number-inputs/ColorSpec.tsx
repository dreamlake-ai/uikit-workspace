import { useState } from "react";
import { ColorInput } from "@dreamlake/uikit";

export const ColorSpec = () => {
  const [color, setColor] = useState("3b82f6");
  return (
    <div className="flex flex-col gap-4 w-full max-w-xs">
      <ColorInput size="sm" value={color} onValueChange={setColor} />
      <p className="text-sm text-uikit-muted">
        Hex: <code className="font-uikit-mono">#{color}</code>
      </p>
    </div>
  );
};
