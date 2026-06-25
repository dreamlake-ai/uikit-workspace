import {
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useMemo,
  useState,
} from 'react'
import {
  FloatingFocusManager,
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import { cn } from '../../lib/utils'

type Side = 'top' | 'right' | 'bottom' | 'left'
type Align = 'start' | 'center' | 'end'

interface PopoverContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  refs: ReturnType<typeof useFloating>['refs']
  floatingStyles: ReturnType<typeof useFloating>['floatingStyles']
  context: ReturnType<typeof useFloating>['context']
  getReferenceProps: (props?: Record<string, unknown>) => Record<string, unknown>
  getFloatingProps: (props?: Record<string, unknown>) => Record<string, unknown>
}
const PopoverContext = createContext<PopoverContextValue | null>(null)
function usePopoverContext(name: string) {
  const c = useContext(PopoverContext)
  if (!c) throw new Error(`<${name}> must be used inside <Popover>`)
  return c
}

export interface PopoverProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  side?: Side
  align?: Align
  /** Gap between trigger and panel, in px. Default 6. */
  sideOffset?: number
  children: ReactNode
}

/**
 * Click-triggered floating panel. Compose `PopoverTrigger` + `PopoverContent`
 * (and optional `PopoverClose`).
 *
 * Drop-in for the legacy `@vuer-ai/vuer-uikit` Popover (Radix). Reimplemented on
 * `@floating-ui/react` for anchored, viewport-aware positioning + focus
 * management.
 */
export function Popover({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  side = 'bottom',
  align = 'center',
  sideOffset = 6,
  children,
}: PopoverProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolled
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolled(next)
    onOpenChange?.(next)
  }

  const placement = (align === 'center' ? side : `${side}-${align}`) as
    | Side
    | `${Side}-${Exclude<Align, 'center'>}`

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    // Position via top/left, not transform — the panel's `uikit-panel-in`
    // entrance animation owns `transform`, which would otherwise clobber
    // floating-ui's transform-based positioning (panel jumps to 0,0).
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [offset(sideOffset), flip({ padding: 8 }), shift({ padding: 8 })],
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  const value = useMemo<PopoverContextValue>(
    () => ({ open, setOpen, refs, floatingStyles, context, getReferenceProps, getFloatingProps }),
    // setOpen identity isn't memoized but is safe to omit; openness drives renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, refs, floatingStyles, context, getReferenceProps, getFloatingProps],
  )

  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>
}

export interface PopoverTriggerProps extends ComponentProps<'button'> {
  asChild?: boolean
}
export function PopoverTrigger({ asChild = false, children, ...props }: PopoverTriggerProps) {
  const ctx = usePopoverContext('PopoverTrigger')
  const refProps = ctx.getReferenceProps({ ...props, 'data-state': ctx.open ? 'open' : 'closed' })
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<Record<string, unknown>>
    return cloneElement(child, { ref: ctx.refs.setReference, ...refProps })
  }
  return (
    <button ref={ctx.refs.setReference as never} type="button" {...refProps}>
      {children}
    </button>
  )
}

export type PopoverContentProps = ComponentProps<'div'>
export function PopoverContent({ className, children, style, ...props }: PopoverContentProps) {
  const ctx = usePopoverContext('PopoverContent')
  if (!ctx.open) return null
  return (
    <FloatingPortal>
      <FloatingFocusManager context={ctx.context} modal={false}>
        <div
          ref={ctx.refs.setFloating as never}
          style={{ ...ctx.floatingStyles, ...style }}
          className={cn(
            'uikit-panel-in z-[200] min-w-[180px] rounded-[10px] p-2 font-uikit-ui',
            'bg-uikit-panel text-uikit-ink border border-uikit-faint shadow-uikit-soft outline-none',
            className,
          )}
          {...ctx.getFloatingProps(props)}
        >
          {children}
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  )
}

export interface PopoverCloseProps extends ComponentProps<'button'> {
  asChild?: boolean
}
export function PopoverClose({ asChild = false, onClick, children, ...props }: PopoverCloseProps) {
  const ctx = usePopoverContext('PopoverClose')
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (e: unknown) => void }>
    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      onClick: (e: unknown) => {
        child.props.onClick?.(e)
        ctx.setOpen(false)
      },
    })
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e)
        ctx.setOpen(false)
      }}
      {...props}
    >
      {children}
    </button>
  )
}
