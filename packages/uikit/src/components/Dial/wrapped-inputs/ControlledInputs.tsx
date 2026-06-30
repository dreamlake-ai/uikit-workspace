import React, {
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useCallback,
} from "react";

import {
  ColorInput,
  FormLayout,
  InputNumbers,
  Label,
  type LayoutType,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
} from "../../index";
import { useDialSchema } from "../DialProvider";
import { IconRenderer } from "../IconRenderer";
import type { LabelPositionT } from "../types";

// Helper component for wrapping inputs with labels
const DialInputWrapper: React.FC<{
  label?: string;
  labelPosition?: LabelPositionT;
  icon?: string;
  children: ReactNode;
}> = ({ label, labelPosition = "top", icon, children }) => {
  if (!label) {
    return <>{children}</>;
  }

  return (
    <FormLayout
      orientation={`label-${labelPosition}` as LayoutType}
      className="overflow-x-hidden"
    >
      <Label size="sm" className="flex items-center gap-1 pl-1.5">
        <IconRenderer iconName={icon} size={14} className="text-uikit-muted" />
        {label}
      </Label>
      {children as ReactElement}
    </FormLayout>
  );
};

export interface DialNumInputProps extends PropsWithChildren {
  name: string;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: unknown[];
  label?: string;
  labelPosition?: LabelPositionT;
  size?: "sm" | "md" | "lg";
  icon?: string;
}

// Base input component that connects to the dial store using InputNumbers for drag support
export const DialNumberInput: React.FC<DialNumInputProps> = ({
  name,
  min,
  max,
  step = 1,
  label,
  labelPosition = "top",
  size = "sm",
  icon,
  ...props
}) => {
  const { getValue, setValue } = useDialSchema();
  const value = (getValue(name) ?? 0) as number;

  const handleValuesChange = useCallback(
    (values: number[]) => {
      const newValue = values[0];
      if (!isNaN(newValue)) {
        setValue(name, newValue);
      }
    },
    [name, setValue],
  );

  const inputNumbersProps = {
    value: [value],
    onValuesChange: handleValuesChange,
    min,
    max,
    step,
    size,
    prefix: labelPosition === "inline" && label ? [label] : undefined,
  };

  if (labelPosition === "inline") {
    return <InputNumbers {...inputNumbersProps} />;
  } else {
    return (
      <DialInputWrapper
        label={label}
        labelPosition={labelPosition}
        icon={icon}
        {...props}
      >
        <InputNumbers {...inputNumbersProps} />
      </DialInputWrapper>
    );
  }
};

export const DialBooleanInput: React.FC<DialNumInputProps> = ({
  name,
  label,
  labelPosition,
  icon,
  ...props
}) => {
  const { getValue, setValue } = useDialSchema();
  const value = (getValue(name) ?? false) as boolean;

  const handleChange = useCallback(
    (checked: boolean) => setValue(name, checked),
    [name, setValue],
  );

  const switchProps = {
    checked: value,
    onCheckedChange: handleChange,
  };

  if (!label || labelPosition === "inline") {
    return <Switch className="ml-1.5" {...switchProps} />;
  }

  return (
    <DialInputWrapper
      label={label}
      labelPosition={labelPosition}
      icon={icon}
      {...props}
    >
      <Switch className="ml-1.5" {...switchProps} />
    </DialInputWrapper>
  );
};

// Dial-wrapped ColorInput
export const DialColorInput: React.FC<DialNumInputProps> = ({
  name,
  label,
  icon,
  ...props
}) => {
  const { getValue, setValue } = useDialSchema();
  // Value can be string or number (0xffffff format)
  const value = getValue(name) as string | number | undefined;

  const handleValueChange = useCallback(
    (hexColor: string) => setValue(name, `#${hexColor}`),
    [name, setValue],
  );

  const inputComp = (
    <ColorInput
      className="ml-1.5"
      value={value ?? ""}
      onValueChange={handleValueChange}
    />
  );

  return (
    <DialInputWrapper label={label} icon={icon} {...props}>
      {inputComp}
    </DialInputWrapper>
  );
};

export const DialSelectInput: React.FC<DialNumInputProps> = ({
  name,
  options = [],
  label,
  size = "sm",
  icon,
  ...props
}) => {
  const { getValue, setValue } = useDialSchema();
  const value = getValue(name);

  const handleValueChange = useCallback(
    (val: string) => {
      // Try to parse as number if possible
      const parsed = !isNaN(Number(val)) ? Number(val) : val;
      setValue(name, parsed);
    },
    [name, setValue],
  );

  const selectComponent = (
    <Select value={String(value)} onValueChange={handleValueChange}>
      {/* Match the number-input box (bg-chip / rounded / h-6 / px-2) so the
          value reads as a left-aligned field like the rest of the panel,
          instead of a bare w-fit button whose text clips at the panel edge. */}
      <SelectTrigger
        size={size}
        className="h-6 w-full rounded-[var(--radius)] bg-uikit-chip px-2 opacity-100"
      >
        <SelectValue
          className="min-w-0 flex-1 text-left"
          placeholder="Select an option"
        />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt, i) => (
          <SelectItem key={i} value={String(opt)}>
            {String(opt)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <DialInputWrapper label={label} icon={icon} {...props}>
      {selectComponent}
    </DialInputWrapper>
  );
};

export const DialSliderInput: React.FC<DialNumInputProps> = ({
  name,
  min = 0,
  max = 100,
  step = 1,
  label,
  icon,
  ...props
}) => {
  const { getValue, setValue } = useDialSchema();
  const value = (getValue(name) ?? min) as number;

  const handleValueChange = useCallback(
    ([val]: number[]) => setValue(name, val),
    [name, setValue],
  );

  const sliderProps = {
    value: [value],
    onValueChange: handleValueChange,
    min,
    max,
    step,
    className: "flex-1 pl-1.5",
  };

  return (
    <DialInputWrapper label={label} icon={icon} {...props}>
      <div className={"flex"}>
        <Slider {...sliderProps} />
        <span className="text-uikit-muted w-12 text-right text-uikit-13">
          {value}
        </span>
      </div>
    </DialInputWrapper>
  );
};
