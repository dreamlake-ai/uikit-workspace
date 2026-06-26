import { forwardRef, useState } from "react";

import { Button } from "../Button";
import { InputNumbers, InputNumbersProps } from "./input-numbers";
import { cn } from "../../lib/utils";

interface PresetsInputProps extends Omit<
  InputNumbersProps,
  "presets" | "value" | "onChange" | "onValuesChange"
> {
  presets: [number, number, number];
  value?: number;
  onChange?: (value: number) => void;
  className?: string;
}

export const PresetsInput = forwardRef<HTMLDivElement, PresetsInputProps>(
  function PresetsInput(
    { presets, value = 0, onChange, size, className, ...props },
    ref,
  ) {
    const [preset, setPreset] = useState(value);

    const handleValueChange = (values: number[]) => {
      const newValue = values[0];
      setPreset(newValue);
      onChange?.(newValue);
    };

    const handlePresetClick = (presetValue: number) => {
      setPreset(presetValue);
      onChange?.(presetValue);
    };

    return (
      <div className={cn("gap-1 grid grid-cols-5", className)}>
        <div className="col-span-full">
          <InputNumbers
            {...props}
            ref={ref}
            size={size}
            value={[preset]}
            onValuesChange={handleValueChange}
          />
        </div>

        {presets.map((p: number, i: number) => {
          return (
            <Button
              key={i}
              size={size}
              variant="secondary"
              className="h-6"
              onClick={() => handlePresetClick(p)}
            >
              {p}
            </Button>
          );
        })}
      </div>
    );
  },
);
