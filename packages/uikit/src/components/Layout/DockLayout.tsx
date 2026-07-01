import {
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  cloneElement,
  forwardRef,
  isValidElement,
} from 'react'
import { cn } from '../../lib/utils'

/** Minimal Slot: renders the single child element, merging className/props. */
function Slot({ children, className, ...props }: ComponentProps<'div'>) {
  if (isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>
    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      ...props,
      className: cn(className, child.props.className),
    })
  }
  return <>{children}</>
}

export const DockLayout = forwardRef<HTMLDivElement, ComponentProps<'div'>>(function DockLayout(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        'relative flex h-full w-full flex-col justify-between overflow-hidden',
        // The rails are a solid panel surface, so cards docked on them are the
        // same colour — drop their border + shadow so they read as flat content
        // on the rail rather than floating cards (liquid layout keeps both).
        '[&_[data-slot=card]]:border-transparent [&_[data-slot=card]]:shadow-none',
        // Flat cards stack their full vertical padding into the gap between them
        // (card A's bottom + card B's top), doubling the apparent spacing. Halve
        // each card's vertical padding (lg p-6 → py-3) so the docked column reads
        // as evenly-spaced sections instead of large empty bands.
        '[&_[data-slot=card]]:py-3',
        className,
      )}
    />
  )
})

interface DockLayoutChildProps extends ComponentProps<'div'> {
  asChild?: boolean
}

export function DockLayoutContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={cn('absolute inset-0 z-0 flex flex-1 flex-col items-center justify-center overflow-auto', className)}
    />
  )
}

export function DockLayoutLeft({ className, asChild, ...props }: DockLayoutChildProps) {
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp
      {...props}
      className={cn(
        'bg-uikit-panel z-20 flex h-full flex-shrink-0 flex-col items-start gap-4',
        // Hairline divider between the docked rail and the center content.
        'border-r border-uikit-faint',
        className,
      )}
    />
  )
}

export function DockLayoutTop({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={cn(
        'absolute top-4 left-1/2 z-20 flex -translate-x-1/2 transform items-start justify-center',
        className,
      )}
    />
  )
}

export function DockLayoutRight({ className, asChild, ...props }: DockLayoutChildProps) {
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp
      {...props}
      className={cn(
        'bg-uikit-panel z-20 flex h-full flex-shrink-0 flex-col items-end gap-4',
        // Hairline divider between the docked rail and the center content.
        'border-l border-uikit-faint',
        className,
      )}
    />
  )
}

export const DockLayoutBottom = forwardRef<HTMLDivElement, DockLayoutChildProps>(function DockLayoutBottom(
  { className, asChild, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp
      ref={ref as never}
      {...props}
      className={cn(
        'bg-uikit-panel z-20 inline-flex w-full flex-shrink-0 justify-center',
        // Hairline divider between the docked bottom bar and the center content.
        'border-t border-uikit-faint',
        // Docked content sits flat on the rail: strip the border + shadow from
        // any card or toolbar inside (e.g. the playback bar) so the rail divider
        // above is the only separator. The top toolbar lives in its own slot and
        // is intentionally left floating.
        '[&_[data-slot=card]]:border-transparent [&_[data-slot=card]]:shadow-none',
        '[&_[role=toolbar]]:border-transparent [&_[role=toolbar]]:shadow-none',
        className,
      )}
    />
  )
})

export interface DockLayoutViewProps {
  left?: ReactNode
  right?: ReactNode
  top?: ReactNode
  bottom?: ReactNode
  children?: ReactNode
  className?: string
  leftClassName?: string
  rightClassName?: string
  topClassName?: string
  bottomClassName?: string
  contentClassName?: string
  hideUI?: boolean
}

/**
 * Edge-docked layout: center content with optional left/right/top/bottom panels.
 * Ported from the legacy `@vuer-ai/vuer-uikit`; panel surfaces use the DreamLake
 * panel token.
 */
export function DockLayoutView({
  left,
  right,
  top,
  bottom,
  children,
  className,
  leftClassName,
  rightClassName,
  topClassName,
  bottomClassName,
  contentClassName,
  hideUI = false,
}: DockLayoutViewProps) {
  const uiVisibilityClass = hideUI ? 'invisible pointer-events-none' : ''
  return (
    <DockLayout className={className}>
      <DockLayoutContent className={contentClassName}>{children}</DockLayoutContent>
      {top && <DockLayoutTop className={cn(topClassName, uiVisibilityClass)}>{top}</DockLayoutTop>}
      <div className={cn('flex h-full flex-row justify-between overflow-hidden', uiVisibilityClass)}>
        {left && <DockLayoutLeft className={leftClassName}>{left}</DockLayoutLeft>}
        {right && <DockLayoutRight className={rightClassName}>{right}</DockLayoutRight>}
      </div>
      {bottom && <DockLayoutBottom className={cn(bottomClassName, uiVisibilityClass)}>{bottom}</DockLayoutBottom>}
    </DockLayout>
  )
}
