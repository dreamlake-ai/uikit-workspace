import { useState } from "react";
import { Slider } from "@dreamlake/uikit";

export const StepsSpec = () => {
  const [value, setValue] = useState([50]);
  return (
    <div className="flex flex-col gap-4 w-full">
      <Slider
        value={value}
        onValueChange={setValue}
        min={0}
        max={100}
        step={10}
        showStep
      />
      <p className="text-sm text-uikit-muted">
        Value: <code className="font-uikit-mono">{value[0]}</code>
      </p>
    </div>
  );
};
