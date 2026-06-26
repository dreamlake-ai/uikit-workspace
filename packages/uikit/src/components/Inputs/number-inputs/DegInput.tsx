import { forwardRef } from "react";

import { InputNumbers, InputNumbersProps } from "../input-numbers";

interface DegInputProps extends Omit<
  InputNumbersProps,
  "value" | "onValuesChange" | "onChange"
> {
  value?: number;
  onChange?: (value: number) => void;
}

const DegInput = forwardRef<HTMLDivElement, DegInputProps>(function DegInput(
  { value = 0, onChange, ...props },
  ref,
) {
  return (
    <InputNumbers
      ref={ref}
      value={[value]}
      onValuesChange={(values) => onChange?.(values[0])}
      suffix={["°"]}
      {...props}
    />
  );
});

export { DegInput };
export type { DegInputProps };
