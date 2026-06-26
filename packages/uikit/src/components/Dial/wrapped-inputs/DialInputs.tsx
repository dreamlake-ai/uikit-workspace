import { LockKeyhole, LockOpen } from "lucide-react";
import React, { PropsWithChildren, useCallback, useMemo } from "react";

import {
  Button,
  CmInput,
  DegInput,
  EulerDegInput,
  EulerInput,
  EulerRadInput,
  FormLayout,
  InchInput,
  IntInput,
  Label,
  type LayoutType,
  QuaternionInput,
  RadInput,
  TextInput,
  TimeInput,
  Vec3Input,
  VectorInput,
} from "../../index";
import { useDialSchema } from "../DialProvider";
import { IconRenderer } from "../IconRenderer";
import type { LabelPositionT } from "../types";

// Base props for all dial-wrapped inputs
interface DialWrapperProps {
  name: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  step?: number;
  min?: number;
  max?: number;
  labelPosition?: LabelPositionT;
  icon?: string;
  /** Display format for angle values: rad (default), deg, or pi */
  format?: "rad" | "deg" | "pi";
}

// Helper component for wrapping inputs with labels
const DialInputWrapper: React.FC<PropsWithChildren<DialWrapperProps>> = ({
  label,
  labelPosition = "top",
  icon,
  children,
}) => {
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
      <>{children}</>
    </FormLayout>
  );
};

// Dial-wrapped Vec3Input
export const DialVec3Input: React.FC<DialWrapperProps> = ({
  name,
  label,
  size = "sm",
  step,
  min,
  max,
  labelPosition,
  icon,
}) => {
  const { getValue, setValue } = useDialSchema();
  const value = (getValue(name) ?? [0, 0, 0]) as [number, number, number];

  const minArray = min !== undefined ? [min, min, min] : undefined;
  const maxArray = max !== undefined ? [max, max, max] : undefined;

  const isLockable = ["position", "rotation", "scale"].includes(name);

  // Get disabled fields from the schema values
  const disabledFields = (getValue("disabledFields") as string[]) ?? [];

  // Create disabled array for each axis
  const disabled = useMemo(() => {
    if (!isLockable) return undefined;
    return [
      disabledFields.includes(`${name}.0`),
      disabledFields.includes(`${name}.1`),
      disabledFields.includes(`${name}.2`),
    ];
  }, [isLockable, name, disabledFields]);

  // Handle suffix batch action (drag to lock/unlock multiple inputs)
  const handleSuffixBatchAction = useCallback(
    (indices: number[]) => {
      if (indices.length === 0) return;

      const firstIndex = indices[0];
      const firstFieldName = `${name}.${firstIndex}`;
      const shouldLock = !disabledFields.includes(firstFieldName);

      const newDisabledFields = [...disabledFields];

      indices.forEach((index) => {
        const fieldName = `${name}.${index}`;
        const fieldIndex = newDisabledFields.indexOf(fieldName);

        if (shouldLock && fieldIndex === -1) {
          // Lock this field
          newDisabledFields.push(fieldName);
        } else if (!shouldLock && fieldIndex > -1) {
          // Unlock this field
          newDisabledFields.splice(fieldIndex, 1);
        }
      });

      setValue("disabledFields", newDisabledFields);
    },
    [name, disabledFields, setValue],
  );

  // Create lock button suffix array
  const suffix = useMemo(() => {
    if (!isLockable) return undefined;
    return [0, 1, 2].map((index) => {
      const isLocked = disabled?.[index] ?? false;

      return (
        <Button
          variant="ghost"
          size="sm"
          icon
          className="hover:bg-uikit-ink-5 size-4 p-0"
          title={
            isLocked
              ? `Unlock ${["X", "Y", "Z"][index]}`
              : `Lock ${["X", "Y", "Z"][index]}`
          }
        >
          {isLocked ? (
            <LockKeyhole
              strokeWidth={1.5}
              className="text-uikit-muted size-2.5"
            />
          ) : (
            <LockOpen strokeWidth={1.5} className="text-uikit-muted size-2.5" />
          )}
        </Button>
      );
    });
  }, [isLockable, disabled]);

  // Handle value change - filter out locked values
  const handleValueChange = useCallback(
    (newValue: [number, number, number]) => {
      if (!isLockable || !disabled) {
        setValue(name, newValue);
        return;
      }
      const filteredValue = newValue.map((v, i) =>
        disabled[i] ? value[i] : v,
      ) as [number, number, number];
      setValue(name, filteredValue);
    },
    [name, setValue, value, isLockable, disabled],
  );

  if (labelPosition === "inline") {
    return (
      <Vec3Input
        value={value}
        onValuesChange={handleValueChange}
        size={size}
        step={step}
        min={minArray}
        max={maxArray}
        disabledItems={disabled}
        suffix={suffix}
        onSuffixBatchAction={isLockable ? handleSuffixBatchAction : undefined}
        prefix={label ? [label, "", ""] : undefined}
      />
    );
  } else {
    return (
      <DialInputWrapper name={name} label={label} icon={icon}>
        <Vec3Input
          value={value}
          onValuesChange={handleValueChange}
          size={size}
          step={step}
          min={minArray}
          max={maxArray}
          disabledItems={disabled}
          suffix={suffix}
          onSuffixBatchAction={isLockable ? handleSuffixBatchAction : undefined}
        />
      </DialInputWrapper>
    );
  }
};

// Dial-wrapped EulerInput (radians)
export const DialEulerInput: React.FC<DialWrapperProps> = ({
  name,
  label,
  size = "sm",
  step,
  labelPosition,
  icon,
}) => {
  const { getValue, setValue } = useDialSchema();
  const value = (getValue(name) ?? [0, 0, 0]) as [number, number, number];

  if (labelPosition === "inline") {
    return (
      <EulerInput
        value={value}
        onValuesChange={(val) => setValue(name, val)}
        size={size}
        step={step}
        prefix={label ? [label, "", ""] : undefined}
      />
    );
  } else {
    return (
      <DialInputWrapper name={name} label={label} icon={icon}>
        <EulerInput
          value={value}
          onValuesChange={(val) => setValue(name, val)}
          size={size}
          step={step}
        />
      </DialInputWrapper>
    );
  }
};

// Dial-wrapped EulerDegInput (degrees)
export const DialEulerDegInput: React.FC<DialWrapperProps> = ({
  name,
  label,
  size = "sm",
  step,
  labelPosition,
  icon,
}) => {
  const { getValue, setValue } = useDialSchema();
  const value = (getValue(name) ?? [0, 0, 0]) as [number, number, number];

  if (labelPosition === "inline") {
    return (
      <EulerDegInput
        value={value}
        onValuesChange={(val) => setValue(name, val)}
        size={size}
        step={step}
        prefix={label ? [label, "", ""] : undefined}
      />
    );
  } else {
    return (
      <DialInputWrapper name={name} label={label} icon={icon}>
        <EulerDegInput
          value={value}
          onValuesChange={(val) => setValue(name, val)}
          size={size}
          step={step}
        />
      </DialInputWrapper>
    );
  }
};

// Dial-wrapped QuaternionInput
export const DialQuaternionInput: React.FC<DialWrapperProps> = ({
  name,
  label,
  size = "sm",
  step,
  labelPosition,
  icon,
}) => {
  const { getValue, setValue } = useDialSchema();
  const value = (getValue(name) ?? [1, 0, 0, 0]) as [
    number,
    number,
    number,
    number,
  ];

  if (labelPosition === "inline") {
    return (
      <QuaternionInput
        value={value}
        onValuesChange={(val) => setValue(name, val)}
        size={size}
        step={step}
        prefix={label ? [label, "", "", ""] : undefined}
      />
    );
  } else {
    return (
      <DialInputWrapper name={name} label={label} icon={icon}>
        <QuaternionInput
          value={value}
          onValuesChange={(val) => setValue(name, val)}
          size={size}
          step={step}
        />
      </DialInputWrapper>
    );
  }
};

// Dial-wrapped VectorInput (generic N-dimensional)
export const DialVectorInput: React.FC<
  DialWrapperProps & { dimensions?: number }
> = ({
  name,
  label,
  size = "sm",
  step,
  dimensions = 3,
  labelPosition,
  icon,
}) => {
  const { getValue, setValue } = useDialSchema();
  const value = (getValue(name) ?? new Array(dimensions).fill(0)) as number[];

  if (labelPosition === "inline") {
    return (
      <VectorInput
        value={value}
        onValuesChange={(val) => setValue(name, val)}
        size={size}
        step={step}
        prefix={
          label ? [label, ...new Array(value.length - 1).fill("")] : undefined
        }
      />
    );
  } else {
    return (
      <DialInputWrapper name={name} label={label} icon={icon}>
        <VectorInput
          value={value}
          onValuesChange={(val) => setValue(name, val)}
          size={size}
          step={step}
        />
      </DialInputWrapper>
    );
  }
};

// Dial-wrapped IntInput
export const DialIntInput: React.FC<DialWrapperProps> = ({
  name,
  label,
  size = "sm",
  step = 1,
  min,
  max,
  labelPosition,
  icon,
}) => {
  const { getValue, setValue } = useDialSchema();
  const value = (getValue(name) ?? 0) as number;

  if (labelPosition === "inline") {
    return (
      <IntInput
        value={value}
        prefix={label ? [label] : undefined}
        onChange={(val) => setValue(name, val)}
        size={size}
        step={step}
        min={min}
        max={max}
      />
    );
  } else {
    return (
      <DialInputWrapper name={name} label={label} icon={icon}>
        <IntInput
          value={value}
          onChange={(val) => setValue(name, val)}
          size={size}
          step={step}
          min={min}
          max={max}
        />
      </DialInputWrapper>
    );
  }
};

// Dial-wrapped DegInput
export const DialDegInput: React.FC<DialWrapperProps> = ({
  name,
  label,
  size = "sm",
  step,
  labelPosition,
  icon,
}) => {
  const { getValue, setValue } = useDialSchema();
  const value = (getValue(name) ?? 0) as number;

  if (labelPosition === "inline") {
    return (
      <DegInput
        value={value}
        onChange={(val) => setValue(name, val)}
        size={size}
        step={step}
        prefix={label ? [label] : undefined}
      />
    );
  } else {
    return (
      <DialInputWrapper name={name} label={label} icon={icon}>
        <DegInput
          value={value}
          onChange={(val) => setValue(name, val)}
          size={size}
          step={step}
        />
      </DialInputWrapper>
    );
  }
};

// Dial-wrapped RadInput
export const DialRadInput: React.FC<DialWrapperProps> = ({
  name,
  label,
  size = "sm",
  step,
  labelPosition,
  icon,
}) => {
  const { getValue, setValue } = useDialSchema();
  const value = (getValue(name) ?? 0) as number;

  if (labelPosition === "inline") {
    return (
      <RadInput
        value={value}
        onChange={(val) => setValue(name, val)}
        size={size}
        step={step}
        prefix={label ? [label] : undefined}
      />
    );
  } else {
    return (
      <DialInputWrapper name={name} label={label} icon={icon}>
        <RadInput
          value={value}
          onChange={(val) => setValue(name, val)}
          size={size}
          step={step}
        />
      </DialInputWrapper>
    );
  }
};

// Dial-wrapped CmInput
export const DialCmInput: React.FC<DialWrapperProps> = ({
  name,
  label,
  size = "sm",
  step,
  labelPosition,
  icon,
}) => {
  const { getValue, setValue } = useDialSchema();
  const value = (getValue(name) ?? 0) as number;

  if (labelPosition === "inline") {
    return (
      <CmInput
        value={value}
        onChange={(val) => setValue(name, val)}
        size={size}
        step={step}
        prefix={label ? [label] : undefined}
      />
    );
  } else {
    return (
      <DialInputWrapper name={name} label={label} icon={icon}>
        <CmInput
          value={value}
          onChange={(val) => setValue(name, val)}
          size={size}
          step={step}
        />
      </DialInputWrapper>
    );
  }
};

// Dial-wrapped InchInput
export const DialInchInput: React.FC<DialWrapperProps> = ({
  name,
  label,
  size = "sm",
  step,
  labelPosition,
  icon,
}) => {
  const { getValue, setValue } = useDialSchema();
  const value = (getValue(name) ?? 0) as number;

  if (labelPosition === "inline") {
    return (
      <InchInput
        value={value}
        onChange={(val) => setValue(name, val)}
        size={size}
        step={step}
        prefix={label ? [label] : undefined}
      />
    );
  } else {
    return (
      <DialInputWrapper name={name} label={label} icon={icon}>
        <InchInput
          value={value}
          onChange={(val) => setValue(name, val)}
          size={size}
          step={step}
        />
      </DialInputWrapper>
    );
  }
};

// Dial-wrapped TimeInput
export const DialTimeInput: React.FC<DialWrapperProps> = ({
  name,
  label,
  size = "sm",
  step,
  labelPosition,
  icon,
}) => {
  const { getValue, setValue } = useDialSchema();
  const value = (getValue(name) ?? 0) as number;

  if (labelPosition === "inline") {
    return (
      <TimeInput
        value={value}
        onChange={(val) => setValue(name, val)}
        size={size}
        step={step}
        prefix={label ? [label] : undefined}
      />
    );
  } else {
    return (
      <DialInputWrapper name={name} label={label} icon={icon}>
        <TimeInput
          value={value}
          onChange={(val) => setValue(name, val)}
          size={size}
          step={step}
        />
      </DialInputWrapper>
    );
  }
};

// Dial-wrapped TextInput
export const DialTextInput: React.FC<
  DialWrapperProps & { placeholder?: string }
> = ({ name, label, size = "sm", labelPosition, placeholder, icon }) => {
  const { getValue, setValue } = useDialSchema();
  const value = (getValue(name) ?? "") as string;

  if (labelPosition === "inline") {
    return (
      <TextInput
        value={value}
        onChange={(val) => setValue(name, val)}
        size={size}
        placeholder={placeholder}
        prefix={label}
      />
    );
  } else {
    return (
      <DialInputWrapper
        name={name}
        label={label}
        icon={icon}
        labelPosition={labelPosition}
      >
        <TextInput
          value={value}
          onChange={(val) => setValue(name, val)}
          size={size}
          placeholder={placeholder}
        />
      </DialInputWrapper>
    );
  }
};

// Dial-wrapped EulerRadInput (radians with configurable display format)
export const DialEulerRadInput: React.FC<DialWrapperProps> = ({
  name,
  label,
  size = "sm",
  step,
  labelPosition,
  icon,
  format = "rad", // Default to radians
}) => {
  const { getValue, setValue } = useDialSchema();
  const value = (getValue(name) ?? [0, 0, 0]) as [number, number, number];

  if (labelPosition === "inline") {
    return (
      <EulerRadInput
        value={value}
        onValuesChange={(val) => setValue(name, val)}
        size={size}
        step={step}
        display={format}
        prefix={label ? [label, "", ""] : undefined}
      />
    );
  } else {
    return (
      <DialInputWrapper name={name} label={label} icon={icon}>
        <EulerRadInput
          value={value}
          onValuesChange={(val) => setValue(name, val)}
          size={size}
          step={step}
          display={format}
        />
      </DialInputWrapper>
    );
  }
};

// Dial-wrapped number-rad input (stores radians, configurable display format)
export const DialNumberRadInput: React.FC<DialWrapperProps> = ({
  name,
  label,
  size = "sm",
  step,
  labelPosition,
  icon,
  format = "rad", // Default to radians
}) => {
  const { getValue, setValue } = useDialSchema();
  const value = (getValue(name) ?? 0) as number;

  if (labelPosition === "inline") {
    return (
      <RadInput
        value={value}
        onChange={(val) => setValue(name, val)}
        display={format}
        size={size}
        step={step}
        prefix={label ? [label] : undefined}
      />
    );
  } else {
    return (
      <DialInputWrapper name={name} label={label} icon={icon}>
        <RadInput
          value={value}
          onChange={(val) => setValue(name, val)}
          display={format}
          size={size}
          step={step}
        />
      </DialInputWrapper>
    );
  }
};
