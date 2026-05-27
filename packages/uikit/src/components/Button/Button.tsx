import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Shows a spinner and disables the button. */
  loading?: boolean
  leftIcon?: ReactNode
  className?: string
  children?: ReactNode
}

const VARIANTS: Record<ButtonVariant, string> = {
  // Inverted fill — matches the app's existing primary action buttons.
  primary: 'bg-uikit-ink text-uikit-bg hover:opacity-90',
  secondary: 'bg-transparent border border-uikit-faint text-uikit-ink hover:bg-uikit-ink-5',
  ghost: 'bg-transparent text-uikit-ink opacity-80 hover:opacity-100 hover:bg-uikit-ink-5',
  danger: 'bg-uikit-danger text-white hover:opacity-90',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'text-uikit-11 px-2.5 py-1 gap-1',
  md: 'text-uikit-12 px-3.5 py-1.5 gap-1.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'sm', loading = false, leftIcon, disabled, children, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center select-none whitespace-nowrap',
        'rounded-md font-uikit-ui font-medium tracking-uikit-snug cursor-pointer',
        'transition-[background-color,opacity,border-color] duration-[120ms]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {loading && <Spinner />}
      {!loading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
      {children}
    </button>
  )
})

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block size-3 rounded-full border-2 border-current border-r-transparent animate-spin"
    />
  )
}
