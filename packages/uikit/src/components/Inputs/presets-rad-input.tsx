import { forwardRef, useState } from "react";

import { Button } from "../Button";
import { RadInput, RadInputProps } from "./number-inputs/RadInput";
import { cn } from "../../lib/utils";

interface PresetsRadInputProps extends Omit<
  RadInputProps,
  "value" | "onChange"
> {
  presets: [number, number, number];
  value?: number;
  onChange?: (value: number) => void;
  display?: "deg" | "pi" | "rad";
  className?: string;
}

export const PresetsRadInput = forwardRef<HTMLDivElement, PresetsRadInputProps>(
  function PresetsRadInput(
    {
      presets,
      value = 0,
      onChange,
      display = "rad",
      size,
      className,
      ...props
    },
    ref,
  ) {
    const [preset, setPreset] = useState(value);

    const handleValueChange = (newValue: number) => {
      setPreset(newValue);
      onChange?.(newValue);
    };

    const handlePresetClick = (presetValue: number) => {
      setPreset(presetValue);
      onChange?.(presetValue);
    };

    const getDisplayValue = (radValue: number) => {
      if (display === "deg") {
        return (radValue * 180) / Math.PI;
      } else if (display === "pi") {
        return radValue / Math.PI;
      }
      return radValue;
    };

    const formatDisplayValue = (radValue: number) => {
      const displayValue = getDisplayValue(radValue);
      if (display === "pi") {
        return `${displayValue.toFixed(2)}π`;
      } else if (display === "deg") {
        return `${displayValue.toFixed(0)}°`;
      }
      return displayValue.toFixed(2);
    };

    return (
      <div className={cn("gap-1 grid grid-cols-5", className)}>
        <div className="col-span-full">
          <RadInput
            {...props}
            ref={ref}
            size={size}
            value={preset}
            onChange={handleValueChange}
            display={display}
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
              {formatDisplayValue(p)}
            </Button>
          );
        })}
      </div>
    );
  },
);
