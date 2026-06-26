import React from "react";

import { DialButton, DialCustom } from "./components";
import type { GroupSchema, DialSchema, LabelPositionT } from "./types";
import {
  DialArrayInput,
  DialBooleanInput,
  DialColorInput,
  DialEulerDegInput,
  DialEulerRadInput,
  DialIntInput,
  DialNumberInput,
  DialNumberRadInput,
  DialPresetsInput,
  DialSelectInput,
  DialSliderInput,
  DialTextInput,
  DialTupleInput,
  DialVec3Input,
  DialVectorInput,
} from "./wrapped-inputs";
import { DialInterfaceInput } from "./wrapped-inputs/DialInterfaceInput";

interface DialSchemaRendererProps {
  schemas: DialSchema[];
  groups?: GroupSchema[];
  labelLayout?: LabelPositionT;
}

/**
 * Generate dynamic styles based on GroupSchema
 * Default layout: grid with 1 column
 */
const generateGroupStyle = (config?: GroupSchema): React.CSSProperties => {
  const layout = config?.layout ?? "grid";

  if (layout === "grid") {
    return {
      display: "grid",
      gap: "0.5rem",
      gridAutoFlow: config?.gridFlow,
      gridTemplateColumns: config?.gridColTemplate
        ? config.gridColTemplate
        : config?.gridCols
          ? `repeat(${config.gridCols}, 1fr)`
          : "1fr",
      gridTemplateRows: config?.gridRowTemplate
        ? config.gridRowTemplate
        : config?.gridRows
          ? `repeat(${config.gridRows}, 1fr)`
          : undefined,
    };
  }

  // Flex layout
  return {
    display: "flex",
    gap: "0.5rem",
    flexWrap: config?.flexWrap ?? "wrap",
    justifyContent: config?.flexJustifyContent,
  };
};

export const DialPanel: React.FC<DialSchemaRendererProps> = ({
  schemas,
  groups: groupConfigs,
  labelLayout,
}) => {
  // Create a map of group configurations for easy lookup
  const groupConfigMap: Record<string, GroupSchema> = {};

  // First, populate from explicit groups prop if provided
  if (groupConfigs) {
    groupConfigs.forEach((config) => {
      if (config.name) groupConfigMap[config.name] = config;
    });
  }

  // Group schemas by their grouping tag
  const groupedSchemas: Record<string, DialSchema[]> = {};
  const ungrouped: DialSchema[] = [];

  schemas.forEach((schema) => {
    const grouping = schema?.grouping;
    if (grouping) {
      if (!groupedSchemas[grouping]) {
        groupedSchemas[grouping] = [];
      }
      groupedSchemas[grouping].push(schema);
    } else {
      ungrouped.push(schema);
    }
  });

  // Render a single schema item as an input component
  const renderSchemaInput = (schema: DialSchema) => {
    const { name, dtype, icon, min, max, step, options } = schema;
    // Use schema's label position if specified, otherwise fall back to panel's labelLayout prop
    const effectiveLabelPosition =
      (schema?.labelPosition as LabelPositionT) || labelLayout;
    const label = schema.label || name.charAt(0).toUpperCase() + name.slice(1);

    // Choose the right input component based on dtype
    switch (dtype) {
      case "tuple":
        // General tuple with mixed types
        return (
          <DialTupleInput
            key={name}
            name={name}
            label={label}
            labelPosition={effectiveLabelPosition}
            icon={icon}
          />
        );

      case "array":
        // Array of primitive types
        return (
          <DialArrayInput
            key={name}
            name={name}
            label={label}
            labelPosition={effectiveLabelPosition}
            icon={icon}
          />
        );

      case "interface":
      case "object":
        return (
          <DialInterfaceInput
            key={name}
            name={name}
            label={label}
            labelPosition={effectiveLabelPosition}
            icon={icon}
          />
        );

      case "vector3":
        return (
          <DialVec3Input
            key={name}
            name={name}
            label={label}
            min={min}
            max={max}
            step={step || 0.001}
            labelPosition={effectiveLabelPosition}
            icon={icon}
          />
        );

      case "euler":
      case "euler-rad": // Alias for euler (both default to radians)
        return (
          <DialEulerRadInput
            key={name}
            name={name}
            label={label}
            step={step || 0.001}
            labelPosition={effectiveLabelPosition}
            icon={icon}
          />
        );

      case "euler-deg":
        return (
          <DialEulerDegInput
            key={name}
            name={name}
            label={label}
            step={step || 0.001}
            labelPosition={effectiveLabelPosition}
            icon={icon}
          />
        );

      case "euler-pi":
        return (
          <DialEulerRadInput
            key={name}
            name={name}
            label={label}
            step={step || 0.001}
            labelPosition={effectiveLabelPosition}
            icon={icon}
            format="pi"
          />
        );

      case "vector":
      case "vector-6":
      case "number-group":
        // For generic vector or number-group, use VectorN input
        return (
          <DialVectorInput key={name} name={name} label={label} icon={icon} />
        );

      case "boolean":
        return (
          <DialBooleanInput
            key={name}
            name={name}
            label={label}
            labelPosition={effectiveLabelPosition}
            icon={icon}
          />
        );

      case "number-slider":
        // Integer input
        return (
          <DialSliderInput
            key={name}
            name={name}
            label={label}
            min={min}
            max={max}
            step={step || 0.001}
            labelPosition={effectiveLabelPosition}
            icon={icon}
          />
        );

      case "number-int":
        // Integer input
        return (
          <DialIntInput
            key={name}
            name={name}
            min={min}
            max={max}
            label={label}
            step={step || 1}
            labelPosition={effectiveLabelPosition}
            icon={icon}
          />
        );

      case "number-rad":
        // Radian input displayed as degrees
        return (
          <DialNumberRadInput
            key={name}
            name={name}
            label={label}
            step={step || 0.001}
            labelPosition={effectiveLabelPosition}
            icon={icon}
          />
        );

      case "number":
        // Use slider if min and max are defined, otherwise use number input
        if (min !== undefined && max !== undefined && !options) {
          return (
            <DialNumberInput
              key={name}
              name={name}
              label={label}
              min={min}
              max={max}
              step={step || 0.001}
              labelPosition={effectiveLabelPosition}
              icon={icon}
            />
          );
        }

        // Use select if options are provided
        if (options && options.length > 0) {
          return (
            <DialPresetsInput
              key={name}
              name={name}
              label={label}
              options={options as string[]}
              labelPosition={effectiveLabelPosition}
              icon={icon}
            />
          );
        }

        // Default to number input
        return (
          <DialNumberInput
            key={name}
            name={name}
            label={label}
            min={min}
            max={max}
            step={step}
            labelPosition={effectiveLabelPosition}
            icon={icon}
          />
        );

      case "color":
        return (
          <DialColorInput key={name} name={name} label={label} icon={icon} />
        );

      case "string":
      case "text":
      case "select":
        // If options are provided, use select
        if (options && options.length > 0) {
          return (
            <DialSelectInput
              key={name}
              name={name}
              label={label}
              options={options}
              labelPosition={effectiveLabelPosition}
              icon={icon}
            />
          );
        }
        // Use text input for pure string values
        return (
          <DialTextInput
            key={name}
            name={name}
            label={label}
            placeholder={`Enter ${label.toLowerCase()}`}
            labelPosition={effectiveLabelPosition}
            icon={icon}
          />
        );

      case "button":
        return (
          <DialButton
            key={name}
            name={name}
            label={label}
            icon={icon}
            onClick={schema.onClick}
            variant={schema.variant}
            disabled={schema.disabled}
          />
        );

      case "custom":
        // Either render function or children must be provided
        if (!schema.render && !schema.children) {
          console.warn(
            `DialPanel: dtype="custom" requires either render or children for "${name}"`,
          );
          return null;
        }
        return (
          <DialCustom
            key={name}
            schema={schema}
            render={schema.render}
            children={schema.children}
          />
        );

      default:
        return null;
    }
  };

  // Wrapper function to apply span styles
  const wrapWithStyle = (schema: DialSchema, component: React.ReactNode) => {
    const spanStyle: React.CSSProperties = {};
    if (schema.colSpan) {
      spanStyle.gridColumn = `span ${schema.colSpan}`;
    }
    if (schema.rowSpan) {
      spanStyle.gridRow = `span ${schema.rowSpan}`;
    }

    if (Object.keys(spanStyle).length > 0) {
      return (
        <div key={schema.name} style={spanStyle}>
          {component}
        </div>
      );
    }
    return component;
  };

  // Sort groups: Transform first, then alphabetically
  const sortedGroups = Object.entries(groupedSchemas).sort(
    ([nameA], [nameB]) => {
      const lowerA = nameA.toLowerCase();
      const lowerB = nameB.toLowerCase();

      if (lowerA === "transform") return -1;
      if (lowerB === "transform") return 1;

      return lowerA.localeCompare(lowerB);
    },
  );

  return (
    <div className="dial-schema-renderer space-y-4">
      {/* Render grouped schemas */}
      {sortedGroups.map(([name, schemaList]) => {
        // Use group configuration
        const groupConfig = groupConfigMap[name];
        const groupStyle = generateGroupStyle(groupConfig);

        return (
          <div key={name} className="dial-group">
            <div className="text-uikit-ink mb-2 pl-1.5 font-medium capitalize">
              {name}
            </div>
            <div className="dial-row" style={groupStyle}>
              {schemaList.map((schema) =>
                wrapWithStyle(schema, renderSchemaInput(schema)),
              )}
            </div>
          </div>
        );
      })}

      {/* Render ungrouped schemas - use grid with 3 columns */}
      {ungrouped.length > 0 && (
        <div className="dial-group">
          {/*<h3 className="text-sm font-semibold text-uikit-ink mb-2">*/}
          {/*  General*/}
          {/*</h3>*/}
          <div className="dial-row grid grid-cols-1 gap-2">
            {ungrouped.map((schema) =>
              wrapWithStyle(schema, renderSchemaInput(schema)),
            )}
          </div>
        </div>
      )}
    </div>
  );
};
