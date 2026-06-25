import { type ComponentProps, type ReactElement, cloneElement, isValidElement } from 'react'
import { cn } from '../../lib/utils'

export type BadgeVariant =
  | 'default'
  | 'outline'
  | 'secondary'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'purple'
  | 'neutral'
export type BadgeType = 'default' | 'circle' | 'dot'

const BASE =
  'inline-flex items-center justify-center w-fit shrink-0 whitespace-nowrap align-middle ' +
  'rounded-uikit-badge px-1.5 py-0.5 text-uikit-10 font-medium leading-none overflow-hidden ' +
  'transition-colors [&>svg]:size-3 [&>svg]:pointer-events-none'

// variant → fill/border. Filled variants use white text; mapped onto the full
// 6-color semantic palette from the Style Guide (blue/green/amber/red/purple/
// warm-gray), with `secondary`/`outline` staying neutral.
const VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-uikit-accent text-white',
  outline: 'bg-transparent text-uikit-ink border border-uikit-faint',
  secondary: 'bg-uikit-chip text-uikit-ink',
  destructive: 'bg-uikit-danger text-white',
  success: 'bg-uikit-tone-green text-white',
  warning: 'bg-uikit-tone-amber text-white',
  purple: 'bg-uikit-tone-purple text-white',
  neutral: 'bg-uikit-tone-warm-gray text-white',
}

const TYPES: Record<BadgeType, string> = {
  default: '',
  circle: 'size-[18px] !rounded-full !px-0 !py-0',
  dot: 'size-[6px] !rounded-full !px-0 !py-0 text-transparent',
}

export interface BadgeVariantsOptions {
  variant?: BadgeVariant
  type?: BadgeType
  className?: string
}

/**
 * Compose the Badge class string. Kept as a named export for drop-in parity
 * with the legacy `@vuer-ai/vuer-uikit` `badgeVariants` (which was a CVA fn) —
 * call sites that build badge-styled elements by hand keep working.
 */
export function badgeVariants({ variant = 'default', type = 'default', className }: BadgeVariantsOptions = {}) {
  return cn(BASE, VARIANTS[variant], TYPES[type], className)
}

export interface BadgeProps extends ComponentProps<'span'> {
  variant?: BadgeVariant
  type?: BadgeType
  /** Render the single child element instead of a `<span>`, merging classes. */
  asChild?: boolean
}

/**
 * Small inline status/category badge.
 *
 * Ported from the legacy `@vuer-ai/vuer-uikit` Badge. The original used CVA +
 * Radix `Slot`; this reimplements both with a plain class map and a minimal
 * `asChild` (single-child clone) so the kit keeps no extra deps, while
 * preserving the drop-in API (`variant`, `type`, `asChild`, `badgeVariants`).
 */
export function Badge({ className, variant = 'default', type = 'default', asChild = false, children, ...props }: BadgeProps) {
  const classes = badgeVariants({ variant, type, className })

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>
    const merged: Record<string, unknown> = {
      ...props,
      'data-slot': 'badge',
      className: cn(classes, child.props.className),
    }
    return cloneElement(child, merged)
  }

  return (
    <span data-slot="badge" className={classes} {...props}>
      {children}
    </span>
  )
}
