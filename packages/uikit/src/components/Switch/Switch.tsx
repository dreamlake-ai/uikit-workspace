import { type ButtonHTMLAttributes, forwardRef, useState } from 'react'
import { cn } from '../../lib/utils'

export interface SwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'type' | 'value'> {
  /** Controlled checked state. */
  checked?: boolean
  /** Initial state when uncontrolled. */
  defaultChecked?: boolean
  /** Fired with the next checked state on toggle. */
  onCheckedChange?: (checked: boolean) => void
  /** Extra classes on the moving thumb. */
  thumbClassName?: string
}

/**
 * Binary on/off toggle.
 *
 * Ported from the legacy `@vuer-ai/vuer-uikit` Switch, which wrapped Radix's
 * Switch primitive. Reimplemented here as a plain `role="switch"` button (no
 * Radix dependency, in keeping with this kit) while preserving the drop-in API:
 * `checked` / `defaultChecked` / `onCheckedChange` / `disabled` / `className` /
 * `thumbClassName`. Works controlled or uncontrolled. Track fills with the
 * accent token when on.
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, defaultChecked = false, onCheckedChange, disabled, className, thumbClassName, ...rest },
  ref,
) {
  const [internal, setInternal] = useState(defaultChecked)
  const isControlled = checked !== undefined
  const isOn = isControlled ? checked : internal

  const toggle = () => {
    if (disabled) return
    const next = !isOn
    if (!isControlled) setInternal(next)
    onCheckedChange?.(next)
  }

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={isOn}
      data-state={isOn ? 'checked' : 'unchecked'}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        'relative inline-flex h-4 w-8 shrink-0 items-center rounded-full',
        'transition-colors duration-200 cursor-pointer',
        'disabled:cursor-not-allowed disabled:opacity-50',
        isOn ? 'bg-uikit-accent' : 'bg-uikit-ink-12',
        className,
      )}
      {...rest}
    >
      <span
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block size-3 rounded-full bg-white shadow-sm',
          'transition-transform duration-200',
          isOn ? 'translate-x-[18px]' : 'translate-x-[2px]',
          thumbClassName,
        )}
      />
    </button>
  )
})
