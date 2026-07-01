import React, { useCallback, useMemo } from "react";

import { FormLayout, Label, type LayoutType } from "../../index";
import { DialPanel } from "../DialPanel";
import { DialProvider, useDialSchema } from "../DialProvider";
import { IconRenderer } from "../IconRenderer";
import { LabelPositionT } from "../types";

interface DialTupleInputProps {
  name: string;
  label?: string;
  labelPosition?: LabelPositionT;
  icon?: string;
}

/**
 * General tuple input component that handles mixed-type tuples
 * Similar to interface/object but displays elements in a more compact layout
 * Used for tuples containing strings, objects, or other complex types
 */
export const DialTupleInput: React.FC<DialTupleInputProps> = ({
  name,
  label,
  labelPosition = "top",
  icon,
}) => {
  const { getValue, setValue, schemas } = useDialSchema();

  const values = useMemo(() => getValue(name) || [], [getValue, name]);

  const handleElementChange = useCallback(
    (elementName: string, value: unknown) => {
      const newValues = Array.isArray(values) ? [...values] : [];

      // Extract index from element name (e.g., "[0]" -> 0 or "x" -> find by name)
      const schema = schemas.find((s) => s.name === name);
      if (!schema || !schema.typeDefinition?.schemas) {
        return;
      }

      const elementIndex = schema.typeDefinition.schemas.findIndex(
        (s) => s.name === elementName,
      );

      if (elementIndex >= 0) {
        newValues[elementIndex] = value;
        setValue(name, newValues);
      }
    },
    [name, setValue, values, schemas],
  );

  const schema = schemas.find((s) => s.name === name);

  if (!schema || !schema.typeDefinition?.schemas) {
    return null;
  }

  // Convert tuple array to object format for DialProvider
  const valuesObject: Record<string, unknown> = {};
  schema.typeDefinition.schemas.forEach((elemSchema, index) => {
    valuesObject[elemSchema.name] = Array.isArray(values)
      ? values[index]
      : undefined;
  });

  const tupleContent = (
    <div className="border-uikit-faint flex flex-col gap-2 rounded-uikit-badge border p-2">
      <DialProvider
        schemas={schema.typeDefinition.schemas}
        values={valuesObject}
        onValueChange={handleElementChange}
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
    return tupleContent;
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
            className="text-uikit-muted cursor-help text-uikit-11"
            title={schema.helpText as string}
          >
            ⓘ {schema.helpText}
          </span>
        )}
        {tupleContent}
      </div>
    </FormLayout>
  );
};
