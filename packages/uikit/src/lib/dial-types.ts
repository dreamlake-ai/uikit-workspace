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
  | undefined

/** Dial control data type. Kept open (string) since the upstream union is large
 *  and evolves; the common members are listed for editor hints. */
export type DialDtype =
  | 'boolean'
  | 'number'
  | 'number-int'
  | 'int'
  | 'string'
  | 'text'
  | 'number-rad'
  | 'number-deg'
  | 'vector'
  | 'array'
  | 'button'
  | 'select'
  | 'color'
  | (string & {})

/** A single Dial control schema. Permissive shape (index signature) for
 *  forward-compat with the upstream CLI-generated type. */
export interface DialSchema {
  name: string
  grouping?: string
  dtype?: DialDtype
  min?: number
  max?: number
  step?: number
  placeholder?: string
  tooltip?: string
  default?: string | number | boolean
  value?: unknown
  options?: string[] | unknown[]
  format?: 'rad' | 'deg' | 'pi'
  label?: string
  icon?: string
  helpText?: string
  labelPosition?: string
  order?: number
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'link'
  disabled?: boolean
  [key: string]: unknown
}

/** A grouping of Dial schemas. Permissive shape for forward-compat. */
export interface GroupSchema {
  name?: string
  label?: string
  description?: string
  schemas?: DialSchema[]
  groups?: GroupSchema[]
  [key: string]: unknown
}
