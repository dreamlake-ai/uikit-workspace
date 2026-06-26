import { forwardRef } from "react";

import { VectorInput, VectorInputProps } from "./VectorInput";

interface EulerInputProps extends Omit<
  VectorInputProps,
  "value" | "labels" | "onValuesChange"
> {
  value: [number, number, number];
  onValuesChange?: (value: [number, number, number]) => void;
  unit?: "deg" | "rad";
}

const EulerInput = forwardRef<HTMLDivElement, EulerInputProps>(
  function EulerInput({ value, onValuesChange, unit = "deg", ...props }, ref) {
    const unitSymbol = unit === "deg" ? "°" : "rad";
    const labels = [`x${unitSymbol}`, `y${unitSymbol}`, `z${unitSymbol}`];

    return (
      <VectorInput
        ref={ref}
        value={value}
        onValuesChange={onValuesChange as (value: number[]) => void}
        labels={labels}
        {...props}
      />
    );
  },
);

export { EulerInput };
export type { EulerInputProps };
