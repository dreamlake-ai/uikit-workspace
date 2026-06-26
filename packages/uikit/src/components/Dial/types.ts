/**
 * Dial Provider Types
 * Runtime types for the Dial UI system, extending base types from dial-cli
 */

import type { DialSchema, GroupSchema } from "../../lib/dial-types";

// ============= Label Position =============

export type LabelPositionT = "left" | "top" | "inline" | undefined;

/**
 * Runtime schema group - extends ComponentSchema with DialSchema
 */
export interface DialSchemaGroup {
  component: string;
  description?: string;
  schemas: DialSchema[];
  groups?: GroupSchema[];
}

// Re-export base types for convenience
export type {
  // Schema types (final output)
  DialCustomRenderContext,
  DialCustomRenderFn,
  DialDtype,
  DialSchema,
  DialValue,
  NestedTypeDefinition,
  GroupSchema,
} from "../../lib/dial-types";
