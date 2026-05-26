import {
  forwardRef,
  type ReactNode,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '../../lib/utils'

type NativeProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value' | 'size' | 'prefix' | 'className'
>

export interface TextFieldProps extends NativeProps {
  value: string
  /** Called with the raw string value (works directly with RHF field.onChange). */
  onChange: (value: string) => void
  /** Leading adornment inside the field, e.g. an "@" for slugs. */
  prefix?: ReactNode
  /** Renders a <textarea> instead of <input>. */
  multiline?: boolean
  rows?: number
  /** Red border + aria-invalid when the field has an error. */
  invalid?: boolean
  /** Use the monospace face (slugs, handles, ids). */
  mono?: boolean
  className?: string
}

const FIELD_BASE =
  'w-full bg-transparent outline-none text-uikit-13 text-uikit-ink placeholder:text-uikit-muted placeholder:opacity-70 disabled:opacity-50'

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { value, onChange, prefix, multiline, rows = 4, invalid, mono, disabled, className, ...rest },
  ref,
) {
  const shell = cn(
    'flex items-center gap-1.5 rounded-md border bg-uikit-bg px-2.5 py-1.5',
    'transition-[border-color] duration-[120ms]',
    invalid ? 'border-uikit-danger' : 'border-uikit-faint focus-within:border-uikit-accent',
    disabled && 'opacity-60 cursor-not-allowed',
    className,
  )
  const fieldCls = cn(FIELD_BASE, mono && 'font-uikit-mono', !mono && 'font-uikit-ui')

  if (multiline) {
    return (
      <div className={cn(shell, 'items-start')}>
        <textarea
          rows={rows}
          value={value}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cn(fieldCls, 'resize-none leading-[1.5] py-0.5')}
          {...(rest as unknown as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      </div>
    )
  }

  return (
    <div className={shell}>
      {prefix != null && (
        <span className="shrink-0 font-uikit-mono text-uikit-12 text-uikit-muted opacity-70 select-none">
          {prefix}
        </span>
      )}
      <input
        ref={ref}
        value={value}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
        className={fieldCls}
        {...rest}
      />
    </div>
  )
})
