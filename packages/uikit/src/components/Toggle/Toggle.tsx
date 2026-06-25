import { type ButtonHTMLAttributes, forwardRef, useState } from 'react'
import { cn } from '../../lib/utils'

export type ToggleVariant = 'primary' | 'secondary'
export type ToggleSize = 'sm' | 'base' | 'lg'

const VARIANTS: Record<ToggleVariant, string> = {
  primary: 'text-uikit-ink hover:bg-uikit-ink-5 data-[state=on]:text-white data-[state=on]:bg-uikit-accent',
  secondary:
    'text-uikit-muted hover:bg-uikit-ink-5 data-[state=on]:text-uikit-ink data-[state=on]:bg-uikit-chip',
}

const SIZES: Record<ToggleSize, string> = {
  sm: "text-uikit-11 gap-1 p-1 rounded-uikit-badge [&_svg:not([class*='size-'])]:size-3",
  base: "text-uikit-12 gap-1.5 p-2 rounded-uikit-badge [&_svg:not([class*='size-'])]:size-4",
  lg: "text-uikit-14 gap-1.5 p-3 rounded-[10px] [&_svg:not([class*='size-'])]:size-5",
}

export interface ToggleVariantsOptions {
  variant?: ToggleVariant
  size?: ToggleSize
  className?: string
}

/** Class-string helper, exported for drop-in parity with the legacy `toggleVariants`. */
export function toggleVariants({ variant = 'primary', size = 'base', className }: ToggleVariantsOptions = {}) {
  return cn(
    'inline-flex items-center justify-center shrink-0 whitespace-nowrap font-normal outline-none cursor-pointer',
    'transition-all disabled:opacity-50 disabled:cursor-not-allowed',
    "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}

export interface ToggleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'type'> {
  pressed?: boolean
  defaultPressed?: boolean
  onPressedChange?: (pressed: boolean) => void
  variant?: ToggleVariant
  size?: ToggleSize
}

/**
 * A two-state toggle button (pressed / not). Ported from the legacy
 * `@vuer-ai/vuer-uikit` Toggle (Radix Toggle) as a plain `aria-pressed` button —
 * no Radix dep. Drop-in API: `pressed` / `defaultPressed` / `onPressedChange` /
 * `variant` / `size`, controlled or uncontrolled.
 */
export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { pressed, defaultPressed = false, onPressedChange, variant = 'primary', size = 'base', disabled, className, ...rest },
  ref,
) {
  const [internal, setInternal] = useState(defaultPressed)
  const isControlled = pressed !== undefined
  const on = isControlled ? pressed : internal

  const toggle = () => {
    if (disabled) return
    const next = !on
    if (!isControlled) setInternal(next)
    onPressedChange?.(next)
  }

  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={on}
      data-state={on ? 'on' : 'off'}
      disabled={disabled}
      onClick={toggle}
      className={toggleVariants({ variant, size, className })}
      {...rest}
    />
  )
})
