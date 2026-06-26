/**
 * Type-only re-exports for drop-in parity with the legacy `@vuer-ai/vuer-uikit`.
 *
 * vuer-web imports `DialSchema` and `GroupSchema` purely as type annotations.
 * The full Dial runtime (DialProvider/DialPanel) and its CLI schema system are
 * intentionally out of scope here, so these are faithful but permissive shapes
 * (an index signature keeps forward-compat with the richer upstream types).
 * `DialValue` and `DialDtype` are included because the others build on them.
 *
 * `LogItemType` lives with its consumer, the Waterfall component
 * (`components/Waterfall/types`), and is re-exported from the package root.
 */
import type { ReactNode } from "react";

/** A control's value in the Dial system. */
export type DialValue =
  | string
  | number
  | boolean
  | number[]
  | string[]
  | (boolean | number | string)[]
  | object
  | null
  | undefined;

/** Dial control data type. Kept open (string) since the upstream union is large
 *  and evolves; the common members are listed for editor hints. */
export type DialDtype =
  | "boolean"
  | "number"
  | "number-int"
  | "int"
  | "string"
  | "text"
  | "number-rad"
  | "number-deg"
  | "vector"
  | "array"
  | "button"
  | "select"
  | "color"
  | (string & {});

/** A single Dial control schema. Permissive shape (index signature) for
 *  forward-compat with the upstream CLI-generated type. */
export interface DialSchema {
  name: string;
  grouping?: string;
  dtype?: DialDtype;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  tooltip?: string;
  default?: string | number | boolean;
  value?: unknown;
  options?: string[] | unknown[];
  format?: "rad" | "deg" | "pi";
  label?: string;
  icon?: string;
  helpText?: string;
  labelPosition?: string;
  order?: number;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "link";
  disabled?: boolean;
  // Layout
  colSpan?: number;
  rowSpan?: number;
  // Custom (dtype: "custom")
  render?: DialCustomRenderFn;
  children?: ReactNode;
  // Vector / number-group controls
  dimensions?: number;
  placeholders?: ReactNode[];
  dtypes?: string[];
  steps?: number[];
  mins?: number[];
  maxs?: number[];
  vectorFlow?: "row" | "column";
  vectorCols?: number;
  vectorRows?: number;
  // Array control
  arrayElementType?: "string" | "number" | "boolean";
  // Interface / tuple controls
  typeDefinition?: NestedTypeDefinition;
  [key: string]: unknown;
}

/** A grouping of Dial schemas. Permissive shape for forward-compat. */
export interface GroupSchema {
  name?: string;
  label?: string;
  description?: string;
  schemas?: DialSchema[];
  groups?: GroupSchema[];
  // Layout
  layout?: "grid" | "flex";
  gridCols?: number;
  gridRows?: number;
  gridFlow?: "row" | "column";
  gridRowTemplate?: string;
  gridColTemplate?: string;
  flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
  flexJustifyContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
  [key: string]: unknown;
}

/** Context handed to a `dtype: "custom"` render function. */
export interface DialCustomRenderContext {
  getValue: (name: string) => DialValue;
  setValue: (name: string, value: DialValue) => void;
  schema: DialSchema;
}

/** Render function for `dtype: "custom"` controls. */
export type DialCustomRenderFn = (
  context: DialCustomRenderContext,
) => ReactNode;

/** Nested schema for complex (interface/tuple) Dial controls. */
export interface NestedTypeDefinition {
  name?: string;
  type?: string;
  kind: "interface" | "tuple";
  schemas: DialSchema[];
  groups?: GroupSchema[];
}
