import { useState } from "react";
import { DialProvider, DialPanel } from "@dreamlake/uikit";
import type { DialSchema } from "@dreamlake/uikit";

// `grouping` tags each control into a section. The `groups` config below
// then describes how each section lays its controls out.
const schemas: DialSchema[] = [
  {
    name: "position",
    grouping: "transform",
    dtype: "vector3",
    step: 0.01,
    value: [0, 0, 0],
  },
  {
    name: "rotation",
    grouping: "transform",
    dtype: "euler-deg",
    step: 1,
    value: [0, 0, 0],
  },
  {
    name: "scale",
    grouping: "transform",
    dtype: "number",
    min: 0.1,
    max: 4,
    step: 0.1,
    value: 1,
  },
  { name: "color", grouping: "material", dtype: "color", value: "f59e0b" },
  {
    name: "metalness",
    grouping: "material",
    dtype: "number",
    min: 0,
    max: 1,
    step: 0.01,
    value: 0.2,
  },
  {
    name: "roughness",
    grouping: "material",
    dtype: "number",
    min: 0,
    max: 1,
    step: 0.01,
    value: 0.8,
  },
];

const groups = [
  { name: "transform", layout: "grid" as const, gridCols: 1 },
  { name: "material", layout: "grid" as const, gridCols: 2 },
];

export const GroupedSpec = () => {
  const [values, setValues] = useState<Record<string, unknown>>({
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 1,
    color: "f59e0b",
    metalness: 0.2,
    roughness: 0.8,
  });

  const handleValueChange = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col gap-4" style={{ width: 320 }}>
      <DialProvider
        schemas={schemas}
        values={values}
        onValueChange={handleValueChange}
      >
        <DialPanel schemas={schemas} groups={groups} labelLayout="left" />
      </DialProvider>
      <pre className="text-xs text-uikit-muted font-uikit-mono whitespace-pre-wrap">
        {JSON.stringify(values, null, 2)}
      </pre>
    </div>
  );
};
