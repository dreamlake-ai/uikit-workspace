import {
  type ComponentProps,
  type MouseEvent,
  type ReactElement,
  createContext,
  useContext,
  useEffect,
  useRef,
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
 * Content that animates its height open/closed. Mirrors the legacy Radix
 * Collapsible's visual: the content's natural height is measured (via a
 * ResizeObserver, so it tracks dynamic content) and the wrapper animates
 * between `0` and that height. `className` lands on the inner content element,
 * so padding/spacing doesn't bleed through while collapsed.
 */
export function CollapsibleContent({
  className,
  children,
  style,
  ...props
}: CollapsibleContentProps) {
  const ctx = useCollapsibleContext('CollapsibleContent')
  const innerRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | null>(null)

  useEffect(() => {
    const el = innerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const measure = () => setContentHeight(el.scrollHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Before the first measurement, render at natural height when open (no
  // animation on mount — like Radix, which only animates on state change).
  // Once measured, animate the pixel height between 0 and the content height.
  const measured = contentHeight != null

  return (
    <div
      data-slot="collapsible-content"
      data-state={ctx.open ? 'open' : 'closed'}
      aria-hidden={!ctx.open}
      style={{
        overflow: 'hidden',
        height: ctx.open ? (measured ? contentHeight! : 'auto') : 0,
        transition: measured ? 'height 200ms ease-out' : undefined,
        ...style,
      }}
      {...props}
    >
      <div ref={innerRef} className={className}>
        {children}
      </div>
    </div>
  )
}
