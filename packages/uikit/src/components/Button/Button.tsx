import {
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
  cloneElement,
  forwardRef,
  isValidElement,
} from 'react'
import { cn } from '../../lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'destructive' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'value'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Shows a spinner and disables the button. */
  loading?: boolean
  leftIcon?: ReactNode
  /** Square icon-button padding. */
  icon?: boolean
  /** Active/selected state (accent text). */
  value?: boolean
  /** Render the single child element instead of a `<button>`, merging classes. */
  asChild?: boolean
  className?: string
  children?: ReactNode
}

const VARIANTS: Record<ButtonVariant, string> = {
  // Inverted fill — matches the app's existing primary action buttons.
  primary: 'bg-uikit-ink text-uikit-bg hover:opacity-90',
  secondary: 'bg-transparent border border-uikit-faint text-uikit-ink hover:bg-uikit-ink-5',
  ghost: 'bg-transparent text-uikit-ink opacity-80 hover:opacity-100 hover:bg-uikit-ink-5',
  danger: 'bg-uikit-danger text-white hover:opacity-90',
  // Drop-in alias for the legacy kit's `destructive`.
  destructive: 'bg-uikit-danger text-white hover:opacity-90',
  link: 'bg-transparent text-uikit-ink underline-offset-4 hover:underline !px-0',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'text-uikit-11 px-2.5 py-1 gap-1',
  md: 'text-uikit-12 px-3.5 py-1.5 gap-1.5',
  lg: 'text-uikit-14 px-4 py-2 gap-1.5',
}

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: '!px-0 !py-0 size-7 gap-0',
  md: '!px-0 !py-0 size-8 gap-0',
  lg: '!px-0 !py-0 size-9 gap-0',
}

export interface ButtonVariantsOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: boolean
  value?: boolean
  className?: string
}

/** Composes the Button class string. Exported for drop-in parity with the
 *  legacy kit's `buttonVariants`. */
export function buttonVariants({ variant = 'primary', size = 'md', icon = false, value = false, className }: ButtonVariantsOptions = {}) {
  return cn(
    'inline-flex items-center justify-center select-none whitespace-nowrap',
    'rounded-md font-uikit-ui font-medium tracking-uikit-snug cursor-pointer outline-none',
    'transition-[background-color,opacity,border-color] duration-[120ms]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    '[&_svg]:shrink-0 [&_svg]:pointer-events-none',
    SIZES[size],
    icon && ICON_SIZES[size],
    VARIANTS[variant],
    value && 'text-uikit-accent [&_svg]:text-uikit-accent',
    className,
  )
}

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const r of refs) {
      if (typeof r === 'function') r(node)
      else if (r) (r as { current: T | null }).current = node
    }
  }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'sm',
    loading = false,
    leftIcon,
    icon = false,
    value = false,
    asChild = false,
    disabled,
    children,
    className,
    type = 'button',
    ...rest
  },
  ref,
) {
  const classes = buttonVariants({ variant, size, icon, value, className })

  // asChild: render the provided element with button styling (legacy Slot behavior).
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string; ref?: Ref<HTMLButtonElement> }>
    return cloneElement(child, {
      ...rest,
      ref: mergeRefs(ref, child.props.ref),
      'data-slot': 'button',
      disabled: disabled || loading || undefined,
      className: cn(classes, child.props.className),
    } as Record<string, unknown>)
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      data-slot="button"
      className={classes}
      {...rest}
    >
      {loading && <LoadingDot />}
      {!loading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
      {children}
    </button>
  )
})

function LoadingDot() {
  return (
    <span
      aria-hidden
      className="inline-block size-3 rounded-full border-2 border-current border-r-transparent animate-spin"
    />
  )
}
