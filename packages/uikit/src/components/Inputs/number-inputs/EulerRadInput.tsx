import { forwardRef, useMemo } from "react";

import { VectorInput, VectorInputProps } from "./VectorInput";

interface EulerRadInputProps extends Omit<
  VectorInputProps,
  "value" | "labels" | "onValuesChange"
> {
  value: [number, number, number];
  onValuesChange?: (value: [number, number, number]) => void;
  display?: "deg" | "pi" | "rad";
}

const EulerRadInput = forwardRef<HTMLDivElement, EulerRadInputProps>(
  function EulerRadInput(
    { value, onValuesChange, display = "rad", ...props },
    ref,
  ) {
    const displayValues = useMemo(() => {
      if (display === "deg") {
        return value.map((v) => (v * 180) / Math.PI) as [
          number,
          number,
          number,
        ];
      } else if (display === "pi") {
        return value.map((v) => v / Math.PI) as [number, number, number];
      }
      return value;
    }, [value, display]);

    const handleChange = (displayVals: number[]) => {
      let radValues: [number, number, number];
      if (display === "deg") {
        radValues = displayVals.map((v) => (v * Math.PI) / 180) as [
          number,
          number,
          number,
        ];
      } else if (display === "pi") {
        radValues = displayVals.map((v) => v * Math.PI) as [
          number,
          number,
          number,
        ];
      } else {
        radValues = displayVals as [number, number, number];
      }
      onValuesChange?.(radValues);
    };

    const unitSymbol = useMemo(() => {
      if (display === "deg") return "°";
      if (display === "pi") return "π";
      return "rad";
    }, [display]);

    const labels = [`x${unitSymbol}`, `y${unitSymbol}`, `z${unitSymbol}`];

    return (
      <VectorInput
        ref={ref}
        value={displayValues}
        onValuesChange={handleChange}
        labels={labels}
        {...props}
      />
    );
  },
);

export { EulerRadInput };
export type { EulerRadInputProps };
