import { useState } from "react";
import { DialProvider, DialPanel } from "@dreamlake/uikit";
import type { DialSchema } from "@dreamlake/uikit";

const schemas: DialSchema[] = [
  { name: "opacity", dtype: "number", min: 0, max: 1, step: 0.01, value: 0.75 },
  { name: "segments", dtype: "number-int", min: 1, max: 64, value: 12 },
  { name: "wireframe", dtype: "boolean", value: false },
  { name: "tint", dtype: "color", value: "3b82f6" },
  { name: "position", dtype: "vector3", step: 0.01, value: [0, 1, 0] },
  {
    name: "label",
    dtype: "string",
    placeholder: "node name",
    value: "camera_main",
  },
  {
    name: "reset",
    dtype: "button",
    label: "Reset",
    variant: "secondary",
    onClick: () => alert("reset clicked"),
  },
];

export const BasicSpec = () => {
  const [values, setValues] = useState<Record<string, unknown>>({
    opacity: 0.75,
    segments: 12,
    wireframe: false,
    tint: "3b82f6",
    position: [0, 1, 0],
    label: "camera_main",
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
        <DialPanel schemas={schemas} labelLayout="left" />
      </DialProvider>
      <pre className="text-xs text-uikit-muted font-uikit-mono whitespace-pre-wrap">
        {JSON.stringify(values, null, 2)}
      </pre>
    </div>
  );
};
