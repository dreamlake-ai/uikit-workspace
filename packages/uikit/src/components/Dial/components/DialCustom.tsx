import React, { ReactNode } from "react";

import { useDialSchema } from "../DialProvider";
import type { DialCustomRenderFn, DialSchema } from "../types";

export interface DialCustomProps {
  schema: DialSchema;
  /** Render function with access to getValue/setValue context */
  render?: DialCustomRenderFn;
  /** Direct ReactNode (no context access) */
  children?: ReactNode;
}

/**
 * Custom component that renders user-provided React components
 *
 * Supports two modes:
 * 1. `render` function: Receives getValue/setValue context for dial integration
 * 2. `children`: Direct ReactNode for simple/static components
 *
 * @example
 * ```tsx
 * // Mode 1: Render function with context (recommended for dial integration)
 * const customRender = useMemo(() => ({ getValue, setValue }) => (
 *   <div className="flex gap-2">
 *     <span>Value: {getValue('myField')}</span>
 *     <button onClick={() => setValue('myField', 0)}>Reset</button>
 *   </div>
 * ), []);
 *
 * // Mode 2: Direct ReactNode (for static or self-managed components)
 * const myComponent = useMemo(() => <MyStaticComponent />, []);
 * ```
 */
export const DialCustom: React.FC<DialCustomProps> = ({
  schema,
  render,
  children,
}) => {
  const { getValue, setValue } = useDialSchema();

  // Priority: render function > children
  if (render) {
    return <>{render({ getValue, setValue, schema })}</>;
  }

  // Fallback to children (direct ReactNode)
  return <>{children}</>;
};
