import {
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  FloatingFocusManager,
  FloatingList,
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
  useListItem,
  useListNavigation,
  useRole,
  safePolygon,
} from '@floating-ui/react'
import { cn } from '../../lib/utils'

type Side = 'top' | 'right' | 'bottom' | 'left'
type Align = 'start' | 'center' | 'end'

interface MenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  refs: ReturnType<typeof useFloating>['refs']
  floatingStyles: ReturnType<typeof useFloating>['floatingStyles']
  context: ReturnType<typeof useFloating>['context']
  getReferenceProps: (p?: Record<string, unknown>) => Record<string, unknown>
  getFloatingProps: (p?: Record<string, unknown>) => Record<string, unknown>
  getItemProps: (p?: Record<string, unknown>) => Record<string, unknown>
  activeIndex: number | null
  elementsRef: React.MutableRefObject<Array<HTMLElement | null>>
}
const MenuContext = createContext<MenuContextValue | null>(null)
function useMenuContext(name: string) {
  const c = useContext(MenuContext)
  if (!c) throw new Error(`<${name}> must be used inside <DropdownMenu>`)
  return c
}

export interface DropdownMenuProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  side?: Side
  align?: Align
  sideOffset?: number
  children: ReactNode
}

function useMenuFloating(
  controlledOpen: boolean | undefined,
  defaultOpen: boolean,
  onOpenChange: ((o: boolean) => void) | undefined,
  side: Side,
  align: Align,
  sideOffset: number,
  isSubmenu: boolean,
) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolled
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolled(next)
    onOpenChange?.(next)
  }
  const placement = (align === 'center' ? side : `${side}-${align}`) as Side

  const elementsRef = useRef<Array<HTMLElement | null>>([])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [offset(sideOffset), flip({ padding: 8 }), shift({ padding: 8 })],
  })

  const click = useClick(context, { event: 'mousedown', toggle: !isSubmenu, ignoreMouse: isSubmenu })
  const hover = useHover(context, {
    enabled: isSubmenu,
    delay: { open: 60 },
    handleClose: safePolygon({ blockPointerEvents: true }),
  })
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'menu' })
  const listNav = useListNavigation(context, {
    listRef: elementsRef,
    activeIndex,
    onNavigate: setActiveIndex,
    loop: true,
  })
  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    click,
    hover,
    dismiss,
    role,
    listNav,
  ])

  return {
    open,
    setOpen,
    refs,
    floatingStyles,
    context,
    getReferenceProps,
    getFloatingProps,
    getItemProps,
    activeIndex,
    elementsRef,
  }
}

/**
 * Click-triggered menu of actions. Compose `DropdownMenuTrigger` +
 * `DropdownMenuContent` with `DropdownMenuItem`, `DropdownMenuLabel`,
 * `DropdownMenuSeparator`, radio items, and nested submenus.
 *
 * Drop-in for the legacy `@vuer-ai/vuer-uikit` DropdownMenu (Radix).
 * Reimplemented on `@floating-ui/react` (anchored positioning, keyboard list
 * navigation, hover-open submenus).
 */
export function DropdownMenu({
  open,
  defaultOpen = false,
  onOpenChange,
  side = 'bottom',
  align = 'start',
  sideOffset = 4,
  children,
}: DropdownMenuProps) {
  const value = useMenuFloating(open, defaultOpen, onOpenChange, side, align, sideOffset, false)
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

export interface DropdownMenuTriggerProps extends ComponentProps<'button'> {
  asChild?: boolean
}
export function DropdownMenuTrigger({ asChild = false, children, ...props }: DropdownMenuTriggerProps) {
  const ctx = useMenuContext('DropdownMenuTrigger')
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

export type DropdownMenuContentProps = ComponentProps<'div'>
export function DropdownMenuContent({ className, children, style, ...props }: DropdownMenuContentProps) {
  const ctx = useMenuContext('DropdownMenuContent')
  if (!ctx.open) return null
  return (
    <FloatingPortal>
      <FloatingFocusManager context={ctx.context} modal={false} initialFocus={-1}>
        <div
          ref={ctx.refs.setFloating as never}
          style={{ ...ctx.floatingStyles, ...style }}
          className={cn(
            'uikit-panel-in z-[200] min-w-[180px] rounded-[10px] p-1 font-uikit-ui',
            'bg-uikit-panel text-uikit-ink border border-uikit-faint shadow-uikit-soft outline-none',
            className,
          )}
          {...ctx.getFloatingProps(props)}
        >
          <FloatingList elementsRef={ctx.elementsRef}>{children}</FloatingList>
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  )
}

const itemClass =
  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-uikit-12 leading-uikit-snug cursor-pointer select-none outline-none data-[active=true]:bg-uikit-ink-5 disabled:opacity-50 disabled:pointer-events-none'

export interface DropdownMenuItemProps extends Omit<ComponentProps<'div'>, 'onSelect'> {
  /** Fired on activation; the menu closes afterward unless prevented. */
  onSelect?: () => void
  disabled?: boolean
}
export function DropdownMenuItem({ className, onClick, onSelect, disabled, children, ...props }: DropdownMenuItemProps) {
  const ctx = useMenuContext('DropdownMenuItem')
  const { ref, index } = useListItem()
  const active = ctx.activeIndex === index
  const itemProps = ctx.getItemProps({
    onClick: (e: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(e)
      onSelect?.()
      ctx.setOpen(false)
    },
  })
  return (
    <div
      ref={ref as never}
      role="menuitem"
      tabIndex={active ? 0 : -1}
      data-active={active}
      aria-disabled={disabled}
      className={cn(itemClass, className)}
      {...props}
      {...(disabled ? {} : itemProps)}
    >
      {children}
    </div>
  )
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('px-2 py-1 text-uikit-10 uppercase tracking-uikit-wide text-uikit-muted select-none', className)}
      {...props}
    />
  )
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<'div'>) {
  return <div role="separator" className={cn('my-1 h-px bg-uikit-faint', className)} {...props} />
}

/** Portal is folded into Content; passthrough kept for drop-in. */
export function DropdownMenuPortal({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

// --- radio group ---
interface RadioContextValue {
  value?: string
  onValueChange?: (value: string) => void
}
const RadioContext = createContext<RadioContextValue>({})

export interface DropdownMenuRadioGroupProps extends ComponentProps<'div'> {
  value?: string
  onValueChange?: (value: string) => void
}
export function DropdownMenuRadioGroup({ value, onValueChange, children, ...props }: DropdownMenuRadioGroupProps) {
  const ctx = useMemo(() => ({ value, onValueChange }), [value, onValueChange])
  return (
    <RadioContext.Provider value={ctx}>
      <div role="radiogroup" {...props}>
        {children}
      </div>
    </RadioContext.Provider>
  )
}

export interface DropdownMenuRadioItemProps extends ComponentProps<'div'> {
  value: string
  disabled?: boolean
}
export function DropdownMenuRadioItem({ className, value, disabled, children, ...props }: DropdownMenuRadioItemProps) {
  const menu = useMenuContext('DropdownMenuRadioItem')
  const radio = useContext(RadioContext)
  const { ref, index } = useListItem()
  const active = menu.activeIndex === index
  const checked = radio.value === value
  const itemProps = menu.getItemProps({
    onClick: () => {
      radio.onValueChange?.(value)
      menu.setOpen(false)
    },
  })
  return (
    <div
      ref={ref as never}
      role="menuitemradio"
      aria-checked={checked}
      tabIndex={active ? 0 : -1}
      data-active={active}
      className={cn(itemClass, className)}
      {...props}
      {...(disabled ? {} : itemProps)}
    >
      <span className="flex w-3.5 justify-center text-uikit-accent">{checked ? '●' : ''}</span>
      {children}
    </div>
  )
}

// --- submenu ---
export interface DropdownMenuSubProps {
  defaultOpen?: boolean
  children: ReactNode
}
export function DropdownMenuSub({ defaultOpen = false, children }: DropdownMenuSubProps) {
  const value = useMenuFloating(undefined, defaultOpen, undefined, 'right', 'start', 0, true)
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

export interface DropdownMenuSubTriggerProps extends ComponentProps<'div'> {
  disabled?: boolean
}
export function DropdownMenuSubTrigger({ className, children, ...props }: DropdownMenuSubTriggerProps) {
  const ctx = useMenuContext('DropdownMenuSubTrigger')
  const refProps = ctx.getReferenceProps({ 'data-state': ctx.open ? 'open' : 'closed' })
  return (
    <div
      ref={ctx.refs.setReference as never}
      role="menuitem"
      aria-haspopup="menu"
      aria-expanded={ctx.open}
      className={cn(itemClass, 'justify-between', className)}
      {...props}
      {...refProps}
    >
      {children}
      <span className="text-uikit-muted">›</span>
    </div>
  )
}

export type DropdownMenuSubContentProps = ComponentProps<'div'>
export function DropdownMenuSubContent({ className, children, style, ...props }: DropdownMenuSubContentProps) {
  const ctx = useMenuContext('DropdownMenuSubContent')
  if (!ctx.open) return null
  return (
    <FloatingPortal>
      <div
        ref={ctx.refs.setFloating as never}
        style={{ ...ctx.floatingStyles, ...style }}
        className={cn(
          'uikit-panel-in z-[201] min-w-[160px] rounded-[10px] p-1 font-uikit-ui',
          'bg-uikit-panel text-uikit-ink border border-uikit-faint shadow-uikit-soft outline-none',
          className,
        )}
        {...ctx.getFloatingProps(props)}
      >
        <FloatingList elementsRef={ctx.elementsRef}>{children}</FloatingList>
      </div>
    </FloatingPortal>
  )
}
