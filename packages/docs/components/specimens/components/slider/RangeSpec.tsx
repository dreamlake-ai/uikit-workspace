import { useState } from "react";
import { Slider } from "@dreamlake/uikit";

export const RangeSpec = () => {
  const [value, setValue] = useState([20, 70]);
  return (
    <div className="flex flex-col gap-4 w-full">
      <Slider value={value} onValueChange={setValue} min={0} max={100} />
      <p className="text-sm text-uikit-muted">
        Range:{" "}
        <code className="font-uikit-mono">
          {value[0]} – {value[1]}
        </code>
      </p>
    </div>
  );
};
