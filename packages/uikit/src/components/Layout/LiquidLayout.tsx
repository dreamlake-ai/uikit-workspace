import {
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  cloneElement,
  isValidElement,
} from 'react'
import { cn } from '../../lib/utils'

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

interface LiquidLayoutChildProps extends ComponentProps<'div'> {
  asChild?: boolean
}

export function LiquidLayout({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={cn(
        'pointer-events-none relative z-1 grid h-full w-full grid-cols-3 grid-rows-[1fr_auto] flex-col justify-between overflow-hidden p-4',
        className,
      )}
    />
  )
}

export function LiquidLayoutContent({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={cn('pointer-events-auto absolute inset-0 -z-1', className)} />
}

export function LiquidLayoutLeft({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={cn(
        'order-2 col-start-1 flex flex-col items-start gap-4 justify-self-start overflow-y-auto [&>*]:pointer-events-auto',
        className,
      )}
    />
  )
}

export function LiquidLayoutTop({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={cn('order-3 col-start-2 flex items-start justify-center [&>*]:pointer-events-auto', className)}
    />
  )
}

export function LiquidLayoutRight({ className, asChild, ...props }: LiquidLayoutChildProps) {
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp
      {...props}
      className={cn(
        'order-4 col-start-3 flex flex-col items-end gap-4 justify-self-end overflow-y-auto [&>*]:pointer-events-auto',
        className,
      )}
    />
  )
}

export function LiquidLayoutBottom({ className, asChild, ...props }: LiquidLayoutChildProps) {
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp
      {...props}
      className={cn('order-5 col-span-3 col-start-1 flex justify-center [&>*]:pointer-events-auto', className)}
    />
  )
}

export interface LiquidLayoutViewProps {
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
 * "Liquid" floating layout: a 3-column grid with pointer-transparent gutters so
 * the 3D canvas stays interactive behind floating panels. Ported from the legacy
 * `@vuer-ai/vuer-uikit`.
 */
export function LiquidLayoutView({
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
}: LiquidLayoutViewProps) {
  const uiVisibilityClass = hideUI ? 'invisible pointer-events-none' : ''
  return (
    <LiquidLayout className={cn(className)}>
      <LiquidLayoutContent className={cn('absolute inset-0 z-0 flex flex-col items-center justify-center', contentClassName)}>
        {children}
      </LiquidLayoutContent>
      {bottom && (
        <LiquidLayoutBottom className={cn('z-20 mt-4', bottomClassName, uiVisibilityClass)}>{bottom}</LiquidLayoutBottom>
      )}
      {right && (
        <LiquidLayoutRight className={cn('z-20 max-w-75', rightClassName, uiVisibilityClass)}>{right}</LiquidLayoutRight>
      )}
      {top && <LiquidLayoutTop className={cn('z-20', topClassName, uiVisibilityClass)}>{top}</LiquidLayoutTop>}
      {left && (
        <LiquidLayoutLeft className={cn('z-20 max-w-75', leftClassName, uiVisibilityClass)}>{left}</LiquidLayoutLeft>
      )}
    </LiquidLayout>
  )
}
