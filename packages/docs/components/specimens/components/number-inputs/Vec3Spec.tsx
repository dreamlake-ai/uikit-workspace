import { useState } from "react";
import { Vec3Input } from "@dreamlake/uikit";

export const Vec3Spec = () => {
  const [position, setPosition] = useState<[number, number, number]>([
    1.2, 0, -3.4,
  ]);
  return (
    <div className="flex flex-col gap-4 w-full max-w-xs">
      <Vec3Input
        size="sm"
        value={position}
        onValuesChange={setPosition}
        step={0.1}
      />
      <p className="text-sm text-uikit-muted">
        Position:{" "}
        <code className="font-uikit-mono">[{position.join(", ")}]</code>
      </p>
    </div>
  );
};
