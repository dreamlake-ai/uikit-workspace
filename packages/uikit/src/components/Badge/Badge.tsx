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

// Geometry and type are the docs-topbar version chip, copied value for value
// from UIKitBadge: mono at 10px, 600, 0.02em, and a 15px leading rather than
// `leading-none` — the leading is what gives the chip its height (19px bare,
// 21px framed) instead of the 14px sliver this used to be. 4px radius, not the
// 6px `--radius-uikit-badge`: at 14px tall a 6px corner is already most of a
// stadium, which is why these read as candy pills next to every other chip.
//
// A transparent 1px border is always present so `outline` can turn it on
// without the box growing 2px and shifting its neighbours.
const BASE =
  'inline-flex items-center justify-center w-fit shrink-0 whitespace-nowrap align-middle ' +
  'font-uikit-mono text-uikit-10 font-semibold tracking-[0.02em] leading-[15px] ' +
  'rounded-[4px] border border-transparent px-1.5 py-0.5 overflow-hidden ' +
  'transition-colors [&>svg]:size-3 [&>svg]:pointer-events-none'

// variant → ink. The container stays neutral in every variant and the tone
// lives in the text, which is the rule Tag already states out loud ("no line
// and no fill, in any state — the colour does all of it") and the rule this
// component's sibling states too ("if the badge were filled with
// `--uikit-accent` it would read as a signal next to components where blue
// genuinely means something"). Badge was the last thing in the kit still
// painting a saturated block and setting white on top of it.
//
// The three container treatments are UIKitBadge's three, nothing new:
//   fill  + ink   → its version segment
//   fill  + muted → the same chip, spoken quieter
//   frame + muted → its outer frame
//
// `secondary` takes the fill rather than UIKitBadge's bare name segment: that
// segment only holds together because the shared frame is around it, and on its
// own in a row of chips it reads as text someone forgot to style.
const VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-uikit-ink-5-solid text-uikit-ink',
  outline: 'border-uikit-faint text-uikit-muted',
  secondary: 'bg-uikit-ink-5-solid text-uikit-muted',
  destructive: 'bg-uikit-ink-5-solid text-uikit-tone-red',
  success: 'bg-uikit-ink-5-solid text-uikit-tone-green',
  warning: 'bg-uikit-ink-5-solid text-uikit-tone-amber',
  purple: 'bg-uikit-ink-5-solid text-uikit-tone-purple',
  neutral: 'bg-uikit-ink-5-solid text-uikit-tone-warm-gray',
}

// `dot` is the one place a tone is still a fill, because a dot has no label to
// carry it — take the colour away and nothing is left to read.
const DOT_FILL: Record<BadgeVariant, string> = {
  default: 'bg-uikit-accent',
  outline: 'bg-uikit-muted',
  secondary: 'bg-uikit-muted',
  destructive: 'bg-uikit-tone-red',
  success: 'bg-uikit-tone-green',
  warning: 'bg-uikit-tone-amber',
  purple: 'bg-uikit-tone-purple',
  neutral: 'bg-uikit-tone-warm-gray',
}

// No `!` overrides: TYPES is composed after VARIANTS, so tailwind-merge already
// lets the later utility win.
const TYPES: Record<BadgeType, string> = {
  default: '',
  // Square-ish, which is what this component's own docs always claimed it was
  // while the code said `rounded-full`. A round count bubble is the one shape
  // the kit has no other example of.
  circle: 'size-[18px] rounded-[4px] px-0 py-0',
  dot: 'size-[6px] rounded-full px-0 py-0 border-transparent text-transparent',
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
  return cn(BASE, type === 'dot' ? DOT_FILL[variant] : VARIANTS[variant], TYPES[type], className)
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
