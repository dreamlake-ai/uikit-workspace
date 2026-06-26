import { forwardRef } from "react";

import { InputNumbers, InputNumbersProps } from "../input-numbers";

interface TimeInputProps extends Omit<
  InputNumbersProps,
  "value" | "onValuesChange" | "onChange"
> {
  value?: number;
  onChange?: (value: number) => void;
}

const TimeInput = forwardRef<HTMLDivElement, TimeInputProps>(function TimeInput(
  { value = 0, onChange, ...props },
  ref,
) {
  return (
    <InputNumbers
      ref={ref}
      value={[value]}
      onValuesChange={(values) => onChange?.(values[0])}
      suffix={["s"]}
      {...props}
    />
  );
});

export { TimeInput };
export type { TimeInputProps };
