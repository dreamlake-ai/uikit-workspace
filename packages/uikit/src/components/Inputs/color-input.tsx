import {
  ChangeEvent,
  forwardRef,
  useState,
  useEffect,
  useCallback,
} from "react";

import { normalizeColor } from "./color";
import { InputRoot, InputSlot, type InputRootProps } from "../Input";
import { cn } from "../../lib/utils";

interface ColorInputProps extends Omit<InputRootProps, "type" | "value"> {
  className?: string;
  /** Color value - supports hex strings, 0x-prefixed strings, numeric hex values, and CSS color names */
  value?: string | number;
  /** Called with normalized hex string (without #) when color changes */
  onValueChange?: (hexColor: string) => void;
}

const ColorInput = forwardRef<HTMLInputElement, ColorInputProps>(
  function ColorInput(
    { className, value, defaultValue, onChange, onValueChange, ...props },
    ref,
  ) {
    const [color, setColor] = useState(() =>
      normalizeColor(value || defaultValue),
    );

    // Update local state when prop value changes
    useEffect(() => {
      if (value !== undefined) {
        setColor(normalizeColor(value));
      }
    }, [value]);

    const handleChange = useCallback(
      (newColor: string, e: ChangeEvent<HTMLInputElement>) => {
        setColor(newColor);
        onValueChange?.(newColor);
        onChange?.(e);
      },
      [onChange, onValueChange],
    );

    return (
      <div className="gap-1.5 flex">
        <input
          ref={ref}
          type="color"
          value={`#${color}`}
          onChange={(e) =>
            handleChange(e.currentTarget.value.replace(/^#/, ""), e)
          }
          className={cn(
            [
              "h-6",
              "w-6",
              "flex-none",
              "cursor-pointer",
              "rounded-uikit-badge",
              "[appearance:none]",
              "[&::-webkit-color-swatch-wrapper]:p-0",
              "[&::-webkit-color-swatch]:border-uikit-faint",
              "[&::-webkit-color-swatch]:rounded-uikit-badge",
              "[&::-moz-color-swatch]:border-uikit-faint",
              "[&::-moz-color-swatch]:rounded-uikit-badge",
            ],
            className,
          )}
        />

        <InputRoot
          {...props}
          size="sm"
          type="text"
          className="flex-1"
          value={color}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleChange(e.currentTarget.value, e)
          }
        >
          <InputSlot>#</InputSlot>
        </InputRoot>
      </div>
    );
  },
);

export { ColorInput };
export type { ColorInputProps };
