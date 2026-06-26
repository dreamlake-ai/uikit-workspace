import { forwardRef, useCallback } from "react";

import { InputNumbers, InputNumbersProps } from "../input-numbers";

interface IntInputProps extends Omit<
  InputNumbersProps,
  "value" | "onValuesChange" | "onChange"
> {
  value?: number;
  onChange?: (value: number) => void;
}

const IntInput = forwardRef<HTMLDivElement, IntInputProps>(function IntInput(
  { value = 0, onChange, ...props },
  ref,
) {
  const handleValuesChange = useCallback(
    (values: number[]) => {
      const newValue = values[0];

      if (newValue === ("" as unknown as number)) {
        onChange?.(newValue as unknown as number);
        return;
      }

      if (isNaN(newValue) || newValue === undefined || newValue === null) {
        onChange?.(0);
        return;
      }

      const intValue = Math.round(newValue);
      onChange?.(intValue);
    },
    [onChange],
  );

  return (
    <InputNumbers
      ref={ref}
      value={[value]}
      onValuesChange={handleValuesChange}
      step={1}
      {...props}
    />
  );
});

export { IntInput };
export type { IntInputProps };
