import { Plus, X } from "lucide-react";
import React, { useCallback, useMemo } from "react";

import {
  Button,
  FormLayout,
  Input,
  Label,
  Switch,
  type LayoutType,
} from "../../index";
import { useDialSchema } from "../DialProvider";
import { IconRenderer } from "../IconRenderer";
import { LabelPositionT } from "../types";

interface DialArrayInputProps {
  name: string;
  label?: string;
  labelPosition?: LabelPositionT;
  icon?: string;
}

/**
 * Array input component for primitive types (string, number, boolean)
 * Supports add/remove operations for dynamic arrays
 *
 * Note: Currently only supports primitive element types.
 * Complex types (objects, nested arrays) are not supported.
 */
export const DialArrayInput: React.FC<DialArrayInputProps> = ({
  name,
  label,
  labelPosition = "top",
  icon,
}) => {
  const { getValue, setValue, schemas } = useDialSchema();

  const schema = schemas.find((s) => s.name === name);
  const arrayValue = useMemo(
    () => (getValue(name) || []) as Array<string | number | boolean>,
    [getValue, name],
  );
  const elementType = schema?.arrayElementType || "string";

  const handleAddItem = useCallback(() => {
    const newValue = [...arrayValue];
    // Add default value based on element type
    switch (elementType) {
      case "number":
        newValue.push(0);
        break;
      case "boolean":
        newValue.push(false);
        break;
      default: // string
        newValue.push("");
        break;
    }
    setValue(name, newValue);
  }, [arrayValue, elementType, name, setValue]);

  const handleRemoveItem = useCallback(
    (index: number) => {
      const newValue = arrayValue.filter((_, i) => i !== index);
      setValue(name, newValue);
    },
    [arrayValue, name, setValue],
  );

  const handleItemChange = useCallback(
    (index: number, value: string | number | boolean) => {
      const newValue = [...arrayValue];
      newValue[index] = value;
      setValue(name, newValue);
    },
    [arrayValue, name, setValue],
  );

  if (!schema) {
    return null;
  }

  const renderItemInput = (item: string | number | boolean, index: number) => {
    const itemKey = `${name}-${index}`;

    switch (elementType) {
      case "boolean":
        return (
          <Switch
            key={itemKey}
            checked={item as boolean}
            onCheckedChange={(checked) => handleItemChange(index, checked)}
          />
        );

      case "number":
        return (
          <Input
            key={itemKey}
            type="number"
            value={item as number}
            onChange={(e) => handleItemChange(index, Number(e.target.value))}
            className="flex-1"
            step={schema.step || 0.1}
            min={schema.min}
            max={schema.max}
          />
        );

      default: // string
        return (
          <Input
            key={itemKey}
            type="text"
            value={item as string}
            onChange={(e) => handleItemChange(index, e.target.value)}
            className="flex-1"
            placeholder={schema.placeholder}
          />
        );
    }
  };

  const arrayContent = (
    <div className="flex flex-col gap-2">
      {/* Array items */}
      {arrayValue.map((item, index) => (
        <div key={`${name}-item-${index}`} className="flex items-center gap-2">
          <span className="text-uikit-muted min-w-[20px] text-uikit-11">
            {index + 1}.
          </span>
          {renderItemInput(item, index)}
          <Button
            variant="ghost"
            size="sm"
            icon
            onClick={() => handleRemoveItem(index)}
            className="h-8 w-8"
            title="Remove item"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {/* Add button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleAddItem}
        className="self-start"
      >
        <Plus className="mr-1 h-4 w-4" />
        Add {elementType}
      </Button>

      {/* Empty state */}
      {arrayValue.length === 0 && (
        <div className="text-uikit-muted text-uikit-13 italic">
          No items. Click "Add {elementType}" to start.
        </div>
      )}
    </div>
  );

  if (!label) {
    return arrayContent;
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
        <div className="border-uikit-faint rounded-uikit-badge border p-2">
          {arrayContent}
        </div>
      </div>
    </FormLayout>
  );
};
