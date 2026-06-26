import React, { useCallback } from "react";

import { FormLayout, Label, type LayoutType } from "../../index";
import { DialPanel } from "../DialPanel";
import { DialProvider, useDialSchema } from "../DialProvider";
import { IconRenderer } from "../IconRenderer";
import { LabelPositionT } from "../types";

interface DialInterfaceInputProps {
  name: string;
  label?: string;
  labelPosition?: LabelPositionT;
  icon?: string;
}

export const DialInterfaceInput: React.FC<DialInterfaceInputProps> = ({
  name,
  label,
  labelPosition = "top",
  icon,
}) => {
  const { getValue, setValue, schemas } = useDialSchema();

  const values: Record<string, unknown> = getValue(name) as Record<
    string,
    unknown
  >;

  const handlePropertyChange = useCallback(
    (propName: string, value: unknown) => {
      const newValues = { ...values };
      newValues[propName] = value;
      setValue(name, newValues);
    },
    [name, setValue, values],
  );

  const schema = schemas.find((s) => s.name === name);

  if (!schema || !schema.typeDefinition?.schemas) {
    return null;
  }

  const interfaceContent = (
    <div className="border-uikit-faint flex flex-col gap-2 rounded-md border p-2">
      <DialProvider
        schemas={schema.typeDefinition.schemas}
        values={values}
        onValueChange={handlePropertyChange}
      >
        <DialPanel
          schemas={schema.typeDefinition.schemas}
          groups={schema.typeDefinition.groups}
          labelLayout={schema.labelPosition as LabelPositionT}
        />
      </DialProvider>
    </div>
  );

  if (!label) {
    return interfaceContent;
  }

  return (
    <FormLayout orientation={`label-${labelPosition}` as LayoutType}>
      <Label size="sm" className="flex items-center gap-1 pl-1.5">
        <IconRenderer iconName={icon} size={14} className="text-uikit-muted" />
        {label}
      </Label>
      <div className="flex flex-col gap-2 pl-1.5">
        {schema.helpText && (
          <span
            className="text-uikit-muted cursor-help text-xs"
            title={schema.helpText as string}
          >
            ⓘ {schema.helpText}
          </span>
        )}
        {interfaceContent}
      </div>
    </FormLayout>
  );
};
