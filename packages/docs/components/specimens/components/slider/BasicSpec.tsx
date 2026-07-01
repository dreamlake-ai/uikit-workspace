import { useState } from "react";
import { Slider } from "@dreamlake/uikit";

export const BasicSpec = () => {
  const [value, setValue] = useState([40]);
  return (
    <div className="flex flex-col gap-4 w-full">
      <Slider value={value} onValueChange={setValue} min={0} max={100} />
      <p className="text-sm text-uikit-muted">
        Value: <code className="font-uikit-mono">{value[0]}</code>
      </p>
    </div>
  );
};
