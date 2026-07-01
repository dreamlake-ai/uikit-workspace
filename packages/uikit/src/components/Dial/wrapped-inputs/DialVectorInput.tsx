import React, { useCallback } from "react";

import {
  FormLayout,
  Label,
  type LayoutType,
  VectorInput,
  Switch,
} from "../../index";
import { useDialSchema } from "../DialProvider";
import { IconRenderer } from "../IconRenderer";

interface DialVectorInputProps {
  name: string;
  label?: string;
  column?: boolean;
  size?: "sm" | "md" | "lg";
  labelPosition?: "left" | "top";
  icon?: string;
}

/**
 * Variable-dimension vector input component that supports any number of dimensions
 * and mixed types (number, boolean, etc.)
 * Used for vector-6, number-group, or any multi-dimensional input
 */
export const DialVectorInput: React.FC<DialVectorInputProps> = ({
  name,
  label,
  size = "sm",
  labelPosition = "top",
  icon,
}) => {
  const { getValue, setValue, schemas } = useDialSchema();

  const handleValueChange = useCallback(
    (
      index: number,
      newValue: number | boolean,
      currentValues: (number | boolean)[],
    ) => {
      const newValues = [...currentValues];
      newValues[index] = newValue;
      setValue(name, newValues);
    },
    [name, setValue],
  );

  const handleNumberValuesChange = useCallback(
    (
      newNumberValues: number[],
      currentValues: (number | boolean)[],
      numberIndices: number[],
    ) => {
      const newValues = [...currentValues];
      numberIndices.forEach((originalIndex, i) => {
        newValues[originalIndex] = newNumberValues[i];
      });
      setValue(name, newValues);
    },
    [name, setValue],
  );

  const schema = schemas.find((s) => s.name === name);
  if (!schema) {
    return null;
  }

  const value = getValue(name) || [];

  // Get metadata from schema
  const dimensions =
    schema.dimensions ||
    schema.placeholders?.length ||
    schema.dtypes?.length ||
    (Array.isArray(value) ? value.length : 6);
  const placeholders = schema.placeholders || [];
  const dtypes = schema.dtypes || [];
  const steps = schema.steps || [];
  const mins = schema.mins || [];
  const maxs = schema.maxs || [];
  const defaults = Array.isArray(schema.value) ? schema.value : [];

  // Ensure value is an array with correct dimensions
  const vectorValue = Array.isArray(value)
    ? value.concat(
        Array.from(
          { length: Math.max(0, dimensions - value.length) },
          (_, i) =>
            defaults[value.length + i] !== undefined
              ? defaults[value.length + i]
              : 0,
        ),
      )
    : Array.from({ length: dimensions }, (_, i) =>
        defaults[i] !== undefined ? defaults[i] : 0,
      );

  // Check if we have mixed types (contains boolean)
  const hasMixedTypes = dtypes.some((dtype) => dtype === "boolean");

  // Determine layout from tags
  const gridAutoFlow = schema.vectorFlow === "row" ? "row" : "column";
  const gridColumns =
    typeof schema.vectorCols === "number" ? schema.vectorCols : undefined;
  const gridRows =
    typeof schema.vectorRows === "number" ? schema.vectorRows : undefined;

  if (hasMixedTypes) {
    // Separate number and boolean indices and values
    const numberIndices: number[] = [];
    const booleanIndices: number[] = [];
    const numberValues: number[] = [];
    const numberSteps: number[] = [];
    const numberMins: number[] = [];
    const numberMaxs: number[] = [];
    const numberLabels: (React.ReactNode | undefined)[] = [];

    dtypes.forEach((dtype, i) => {
      if (dtype === "boolean") {
        booleanIndices.push(i);
      } else {
        numberIndices.push(i);
        numberValues.push((vectorValue[i] as number) || 0);

        const step =
          steps[i] !== undefined
            ? steps[i]
            : dtype === "number-int"
              ? 1
              : 0.001;
        numberSteps.push(step);

        if (mins[i] !== undefined) {
          numberMins.push(mins[i]);
        }
        if (maxs[i] !== undefined) {
          numberMaxs.push(maxs[i]);
        }

        if (placeholders[i]) {
          numberLabels.push(
            <span className="text-uikit-11">{placeholders[i]}</span>,
          );
        } else {
          numberLabels.push(undefined);
        }
      }
    });

    const mixedInputComponent = (
      <div className="flex flex-col gap-2">
        {/* Render VectorInput for all number types */}
        {numberIndices.length > 0 && (
          <div>
            <VectorInput
              value={numberValues}
              onValuesChange={(newValues) =>
                handleNumberValuesChange(newValues, vectorValue, numberIndices)
              }
              size={size}
              step={numberSteps}
              min={numberMins.length > 0 ? numberMins : undefined}
              max={numberMaxs.length > 0 ? numberMaxs : undefined}
              labels={numberLabels}
              gridAutoFlow={gridAutoFlow}
              columns={gridColumns}
              rows={gridRows}
            />
          </div>
        )}

        {/* Render Switch components for boolean types */}
        {booleanIndices.length > 0 && (
          <div className="gap-1 flex flex-wrap">
            {booleanIndices.map((originalIndex) => {
              const placeholder = placeholders[originalIndex];
              const currentValue = vectorValue[originalIndex];

              return (
                <div key={originalIndex} className="flex items-center gap-2">
                  {placeholder && (
                    <span className="text-uikit-ink text-uikit-11">
                      {placeholder}
                    </span>
                  )}
                  <Switch
                    checked={Boolean(currentValue)}
                    onCheckedChange={(checked) =>
                      handleValueChange(originalIndex, checked, vectorValue)
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );

    if (!label) {
      return mixedInputComponent;
    }

    return (
      <FormLayout orientation={`label-${labelPosition}` as LayoutType}>
        <Label size="sm" className="flex items-center gap-1">
          <IconRenderer
            iconName={icon}
            size={14}
            className="text-uikit-muted"
          />
          {label}
        </Label>
        <div className="flex flex-row items-start gap-2">
          {schema.helpText && (
            <span
              className="text-uikit-muted mt-1 cursor-help text-uikit-11"
              title={schema.helpText as string}
            >
              ⓘ
            </span>
          )}
          {mixedInputComponent}
        </div>
      </FormLayout>
    );
  }

  // If all types are numbers, use the original VectorInput
  const inputSteps = Array.from({ length: dimensions }, (_, i) => {
    if (steps[i] !== undefined) {
      return steps[i];
    }
    const dtype = dtypes[i];
    return dtype === "number-int" ? 1 : 0.001;
  });

  const labels =
    placeholders.length > 0
      ? placeholders.map((p) => <span className="text-uikit-11">{p}</span>)
      : undefined;

  const inputComponent = (
    <VectorInput
      value={vectorValue as number[]}
      onValuesChange={(newValues) => setValue(name, newValues)}
      size={size}
      step={inputSteps}
      min={mins.length > 0 ? mins : undefined}
      max={maxs.length > 0 ? maxs : undefined}
      labels={labels}
      gridAutoFlow={gridAutoFlow}
      columns={gridColumns}
      rows={gridRows}
    />
  );

  if (!label) {
    return inputComponent;
  }

  return (
    <FormLayout orientation={`label-${labelPosition}` as LayoutType}>
      <Label size="sm" className="flex items-center gap-1 pl-1.5">
        <IconRenderer iconName={icon} size={14} className="text-uikit-muted" />
        {label}
      </Label>
      <div className="flex flex-row items-center gap-2">
        {schema.helpText && (
          <span
            className="text-uikit-muted cursor-help text-uikit-11"
            title={schema.helpText as string}
          >
            ⓘ
          </span>
        )}
        {inputComponent}
      </div>
    </FormLayout>
  );
};
