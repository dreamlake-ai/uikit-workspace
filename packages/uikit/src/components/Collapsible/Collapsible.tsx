import {
  type ComponentProps,
  type MouseEvent,
  type ReactElement,
  createContext,
  useContext,
  useState,
  cloneElement,
  isValidElement,
} from 'react'
import { cn } from '../../lib/utils'

interface CollapsibleContextValue {
  open: boolean
  toggle: () => void
  disabled?: boolean
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null)

function useCollapsibleContext(component: string) {
  const ctx = useContext(CollapsibleContext)
  if (!ctx) throw new Error(`<${component}> must be used inside <Collapsible>`)
  return ctx
}

export interface CollapsibleProps extends ComponentProps<'div'> {
  /** Controlled open state. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Fired with the next open state on toggle. */
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
}

/**
 * An expand/collapse region: a `Collapsible` wrapping a `CollapsibleTrigger`
 * and a `CollapsibleContent`.
 *
 * Ported from the legacy `@vuer-ai/vuer-uikit` Collapsible, which wrapped
 * Radix. Reimplemented with React context (no Radix dep); the content animates
 * height with a pure-CSS grid-rows technique instead of Radix's measured
 * keyframes. Drop-in API preserved: `open` / `defaultOpen` / `onOpenChange` /
 * `disabled`, plus `CollapsibleTrigger` (with `asChild`) and
 * `CollapsibleContent`.
 */
export function Collapsible({
  open,
  defaultOpen = false,
  onOpenChange,
  disabled,
  className,
  children,
  ...props
}: CollapsibleProps) {
  const [internal, setInternal] = useState(defaultOpen)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internal

  const toggle = () => {
    if (disabled) return
    const next = !isOpen
    if (!isControlled) setInternal(next)
    onOpenChange?.(next)
  }

  return (
    <CollapsibleContext.Provider value={{ open: isOpen, toggle, disabled }}>
      <div
        data-slot="collapsible"
        data-state={isOpen ? 'open' : 'closed'}
        className={className}
        {...props}
      >
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
}

export interface CollapsibleTriggerProps extends ComponentProps<'button'> {
  /** Render the single child element as the trigger instead of a `<button>`. */
  asChild?: boolean
}

/** Toggles the surrounding `Collapsible`. */
export function CollapsibleTrigger({
  asChild = false,
  onClick,
  children,
  className,
  ...props
}: CollapsibleTriggerProps) {
  const ctx = useCollapsibleContext('CollapsibleTrigger')

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented) ctx.toggle()
  }

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (e: MouseEvent) => void; className?: string }>
    const merged: Record<string, unknown> = {
      'data-slot': 'collapsible-trigger',
      'data-state': ctx.open ? 'open' : 'closed',
      'aria-expanded': ctx.open,
      onClick: (e: MouseEvent) => {
        child.props.onClick?.(e)
        if (!e.defaultPrevented) ctx.toggle()
      },
      className: cn(child.props.className, className),
    }
    return cloneElement(child, merged)
  }

  return (
    <button
      type="button"
      data-slot="collapsible-trigger"
      data-state={ctx.open ? 'open' : 'closed'}
      aria-expanded={ctx.open}
      disabled={ctx.disabled}
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}

export type CollapsibleContentProps = ComponentProps<'div'>

/**
 * Content that animates open/closed. The outer grid drives the height
 * transition (`grid-template-rows: 0fr → 1fr`); the inner element clips
 * overflow. `className` lands on the inner content element, so padding/spacing
 * doesn't bleed through while collapsed.
 */
export function CollapsibleContent({ className, children, ...props }: CollapsibleContentProps) {
  const ctx = useCollapsibleContext('CollapsibleContent')

  return (
    <div
      data-slot="collapsible-content"
      data-state={ctx.open ? 'open' : 'closed'}
      aria-hidden={!ctx.open}
      className={cn(
        'grid transition-[grid-template-rows] duration-200 ease-out',
        ctx.open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      )}
      {...props}
    >
      <div className={cn('min-h-0 overflow-hidden', className)}>{children}</div>
    </div>
  )
}
