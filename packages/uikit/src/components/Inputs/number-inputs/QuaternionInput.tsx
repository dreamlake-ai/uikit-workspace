import { forwardRef } from "react";

import { VectorInput, VectorInputProps } from "./VectorInput";

interface QuaternionInputProps extends Omit<
  VectorInputProps,
  "value" | "labels" | "onValuesChange"
> {
  value: [number, number, number, number];
  onValuesChange?: (value: [number, number, number, number]) => void;
}

const QuaternionInput = forwardRef<HTMLDivElement, QuaternionInputProps>(
  function QuaternionInput({ value, onValuesChange, ...props }, ref) {
    return (
      <VectorInput
        ref={ref}
        value={value}
        onValuesChange={onValuesChange as (value: number[]) => void}
        labels={["w", "x", "y", "z"]}
        {...props}
      />
    );
  },
);

export { QuaternionInput };
export type { QuaternionInputProps };
