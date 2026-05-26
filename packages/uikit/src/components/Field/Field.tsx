import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export interface FieldProps {
  label?: ReactNode
  /** Helper text shown below the control when there is no error. */
  hint?: ReactNode
  /** Error message; when set it replaces the hint and is shown in danger tone. */
  error?: ReactNode
  required?: boolean
  /** Associates the label with a control via htmlFor. */
  htmlFor?: string
  className?: string
  children: ReactNode
}

export function Field({ label, hint, error, required, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label != null && (
        <label
          htmlFor={htmlFor}
          className="font-uikit-mono text-uikit-9 uppercase tracking-uikit-wide text-uikit-muted"
        >
          {label}
          {required && <span className="text-uikit-danger ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error != null ? (
        <span className="font-uikit-ui text-uikit-11 text-uikit-danger">{error}</span>
      ) : hint != null ? (
        <span className="font-uikit-ui text-uikit-11 text-uikit-muted opacity-80">{hint}</span>
      ) : null}
    </div>
  )
}
