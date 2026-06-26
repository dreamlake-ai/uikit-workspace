import { forwardRef } from "react";

import { InputNumbers, InputNumbersProps } from "../input-numbers";

interface CmInputProps extends Omit<
  InputNumbersProps,
  "value" | "onValuesChange" | "onChange"
> {
  value?: number;
  onChange?: (value: number) => void;
}

const CmInput = forwardRef<HTMLDivElement, CmInputProps>(function CmInput(
  { value = 0, onChange, ...props },
  ref,
) {
  return (
    <InputNumbers
      ref={ref}
      value={[value]}
      onValuesChange={(values) => onChange?.(values[0])}
      suffix={["cm"]}
      {...props}
    />
  );
});

export { CmInput };
export type { CmInputProps };
