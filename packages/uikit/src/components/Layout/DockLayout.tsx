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
      className={cn('relative flex h-full w-full flex-col justify-between overflow-hidden', className)}
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
      className={cn('bg-uikit-panel z-20 flex h-full flex-shrink-0 flex-col items-start gap-4', className)}
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
      className={cn('bg-uikit-panel z-20 flex h-full flex-shrink-0 flex-col items-end gap-4', className)}
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
      className={cn('bg-uikit-panel z-20 inline-flex w-full flex-shrink-0 justify-center', className)}
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
