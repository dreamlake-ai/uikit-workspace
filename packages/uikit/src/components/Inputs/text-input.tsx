import { forwardRef } from "react";

import { InputRoot, InputRootProps, InputSlot } from "../Input";

export interface TextInputProps extends Omit<
  InputRootProps,
  "type" | "value" | "onChange"
> {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  maxLength?: number;
}

/**
 * Text input component for string values.
 * Provides a simple text input with optional prefix/suffix.
 *
 * @param value - The current text value
 * @param onChange - Callback when text changes
 * @param placeholder - Placeholder text
 * @param prefix - Optional prefix text/icon
 * @param suffix - Optional suffix text/icon
 * @param maxLength - Maximum character length
 */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    { value = "", onChange, prefix, suffix, placeholder, maxLength, ...props },
    ref,
  ) {
    return (
      <InputRoot
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        {...props}
      >
        {prefix && <InputSlot side="left">{prefix}</InputSlot>}
        {suffix && <InputSlot side="right">{suffix}</InputSlot>}
      </InputRoot>
    );
  },
);
