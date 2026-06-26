import { forwardRef } from "react";

import { InputNumbers, InputNumbersProps } from "../input-numbers";

interface InchInputProps extends Omit<
  InputNumbersProps,
  "value" | "onValuesChange" | "onChange"
> {
  value?: number;
  onChange?: (value: number) => void;
}

const InchInput = forwardRef<HTMLDivElement, InchInputProps>(function InchInput(
  { value = 0, onChange, ...props },
  ref,
) {
  return (
    <InputNumbers
      ref={ref}
      value={[value]}
      onValuesChange={(values) => onChange?.(values[0])}
      suffix={["in"]}
      {...props}
    />
  );
});

export { InchInput };
export type { InchInputProps };
