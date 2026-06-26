import React from "react";

import { FormLayout, Label, type LayoutType } from "../../index";
import { PresetsInput } from "../../index";
import { useDialSchema } from "../DialProvider";
import { IconRenderer } from "../IconRenderer";
import { LabelPositionT } from "../types";

const DialInputWrapper: React.FC<{
  label?: string;
  labelPosition?: LabelPositionT;
  icon?: string;
  children: React.ReactElement;
}> = ({ label, labelPosition = "top", icon, children }) => {
  if (!label) {
    return <>{children}</>;
  }

  return (
    <FormLayout orientation={`label-${labelPosition}` as LayoutType}>
      <Label size="sm" className="flex items-center gap-1 pl-1.5">
        <IconRenderer iconName={icon} size={14} className="text-uikit-muted" />
        {label}
      </Label>
      {children}
    </FormLayout>
  );
};

export const DialPresetsInput: React.FC<{
  name: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  labelPosition?: LabelPositionT;
  icon?: string;
  options: Array<string | number | { label: string; value: string | number }>;
}> = ({ name, label, size = "sm", labelPosition = "top", icon, options }) => {
  const { getValue, setValue } = useDialSchema();
  const value = (getValue(name) ?? 0) as number;

  // Extract preset values from options
  const presets = options.slice(0, 3).map((opt) => {
    if (typeof opt === "number") return opt;
    if (typeof opt === "string") return parseFloat(opt);
    return typeof opt.value === "number"
      ? opt.value
      : parseFloat(opt.value as string);
  }) as [number, number, number];

  // Pad with zeros if less than 3 presets
  while (presets.length < 3) {
    presets.push(0);
  }

  if (labelPosition === "inline") {
    // this is suspicious - Ge
    return (
      <div className="flex items-center gap-2">
        {label && <Label size="sm">{label}</Label>}
        <PresetsInput
          value={value}
          onChange={(val) => setValue(name, val)}
          size={size}
          presets={presets}
        />
      </div>
    );
  } else {
    return (
      <DialInputWrapper label={label} labelPosition={labelPosition} icon={icon}>
        <PresetsInput
          value={value}
          onChange={(val) => setValue(name, val)}
          size={size}
          presets={presets}
        />
      </DialInputWrapper>
    );
  }
};
