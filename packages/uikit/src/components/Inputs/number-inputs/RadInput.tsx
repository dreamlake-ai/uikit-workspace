import { forwardRef, useMemo } from "react";

import { InputNumbers, InputNumbersProps } from "../input-numbers";

interface RadInputProps extends Omit<
  InputNumbersProps,
  "value" | "onValuesChange" | "onChange"
> {
  value?: number;
  onChange?: (value: number) => void;
  display?: "deg" | "pi" | "rad";
}

const RadInput = forwardRef<HTMLDivElement, RadInputProps>(function RadInput(
  { value = 0, onChange, display = "rad", ...props },
  ref,
) {
  const displayValue = useMemo(() => {
    if (display === "deg") {
      return (value * 180) / Math.PI;
    } else if (display === "pi") {
      return value / Math.PI;
    }
    return value;
  }, [value, display]);

  const handleChange = (displayVal: number) => {
    let radValue = displayVal;
    if (display === "deg") {
      radValue = (displayVal * Math.PI) / 180;
    } else if (display === "pi") {
      radValue = displayVal * Math.PI;
    }
    onChange?.(radValue);
  };

  const suffix = useMemo(() => {
    if (display === "deg") return "°";
    if (display === "pi") return "π";
    return "rad";
  }, [display]);

  return (
    <InputNumbers
      ref={ref}
      value={[displayValue]}
      onValuesChange={(values) => handleChange(values[0])}
      suffix={[suffix]}
      {...props}
    />
  );
});

export { RadInput };
export type { RadInputProps };
