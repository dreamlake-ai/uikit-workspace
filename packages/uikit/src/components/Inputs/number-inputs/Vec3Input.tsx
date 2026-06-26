import { forwardRef } from "react";

import { VectorInput, VectorInputProps } from "./VectorInput";

interface Vec3InputProps extends Omit<
  VectorInputProps,
  "value" | "labels" | "onValuesChange"
> {
  value: [number, number, number];
  onValuesChange?: (value: [number, number, number]) => void;
}

const Vec3Input = forwardRef<HTMLDivElement, Vec3InputProps>(function Vec3Input(
  { value, onValuesChange, ...props },
  ref,
) {
  return (
    <VectorInput
      ref={ref}
      value={value}
      onValuesChange={onValuesChange as (value: number[]) => void}
      labels={["x", "y", "z"]}
      {...props}
    />
  );
});

export { Vec3Input };
export type { Vec3InputProps };
