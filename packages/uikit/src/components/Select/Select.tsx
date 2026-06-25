import {
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
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
  size as sizeMiddleware,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListItem,
  useListNavigation,
  useRole,
  useTypeahead,
} from '@floating-ui/react'
import { cn } from '../../lib/utils'

interface SelectContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  value: string | undefined
  setValue: (value: string) => void
  setLabel: (label: ReactNode) => void
  label: ReactNode
  refs: ReturnType<typeof useFloating>['refs']
  floatingStyles: ReturnType<typeof useFloating>['floatingStyles']
  context: ReturnType<typeof useFloating>['context']
  getReferenceProps: (p?: Record<string, unknown>) => Record<string, unknown>
  getFloatingProps: (p?: Record<string, unknown>) => Record<string, unknown>
  getItemProps: (p?: Record<string, unknown>) => Record<string, unknown>
  activeIndex: number | null
  elementsRef: React.MutableRefObject<Array<HTMLElement | null>>
  labelsRef: React.MutableRefObject<Array<string | null>>
}
const SelectContext = createContext<SelectContextValue | null>(null)
function useSelectContext(name: string) {
  const c = useContext(SelectContext)
  if (!c) throw new Error(`<${name}> must be used inside <Select>`)
  return c
}

export interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

/**
 * Compound single-select. Compose `SelectTrigger` (with `SelectValue`) +
 * `SelectContent` containing `SelectItem`s (optionally grouped with
 * `SelectGroup` / `SelectLabel`).
 *
 * Drop-in for the legacy `@vuer-ai/vuer-uikit` Select (Radix). Reimplemented on
 * `@floating-ui/react` (anchored positioning, keyboard list navigation +
 * typeahead). For the terse `options`-driven inline picker, use
 * [SelectBox](/components/select-box).
 */
export function Select({
  value: controlledValue,
  defaultValue,
  onValueChange,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState<string | undefined>(defaultValue)
  const isValueControlled = controlledValue !== undefined
  const value = isValueControlled ? controlledValue : uncontrolledValue
  const setValue = (v: string) => {
    if (!isValueControlled) setUncontrolledValue(v)
    onValueChange?.(v)
  }

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isOpenControlled = controlledOpen !== undefined
  const open = isOpenControlled ? controlledOpen : uncontrolledOpen
  const setOpen = (o: boolean) => {
    if (!isOpenControlled) setUncontrolledOpen(o)
    onOpenChange?.(o)
  }

  const [label, setLabel] = useState<ReactNode>(null)
  const elementsRef = useRef<Array<HTMLElement | null>>([])
  const labelsRef = useRef<Array<string | null>>([])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'bottom-start',
    // Position via top/left, not transform — the panel's `uikit-panel-in`
    // entrance animation owns `transform`.
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      sizeMiddleware({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, { minWidth: `${rects.reference.width}px` })
        },
      }),
    ],
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'listbox' })
  const listNav = useListNavigation(context, {
    listRef: elementsRef,
    activeIndex,
    onNavigate: setActiveIndex,
    loop: true,
  })
  const typeahead = useTypeahead(context, {
    listRef: labelsRef,
    activeIndex,
    onMatch: open ? setActiveIndex : undefined,
  })
  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    click,
    dismiss,
    role,
    listNav,
    typeahead,
  ])

  const ctx = useMemo<SelectContextValue>(
    () => ({
      open,
      setOpen,
      value,
      setValue,
      label,
      setLabel,
      refs,
      floatingStyles,
      context,
      getReferenceProps,
      getFloatingProps,
      getItemProps,
      activeIndex,
      elementsRef,
      labelsRef,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, value, label, refs, floatingStyles, context, getReferenceProps, getFloatingProps, getItemProps, activeIndex],
  )

  return <SelectContext.Provider value={ctx}>{children}</SelectContext.Provider>
}

export interface SelectTriggerProps extends ComponentProps<'button'> {
  asChild?: boolean
}
export function SelectTrigger({ asChild = false, className, children, ...props }: SelectTriggerProps) {
  const ctx = useSelectContext('SelectTrigger')
  const refProps = ctx.getReferenceProps({ ...props, 'data-state': ctx.open ? 'open' : 'closed' })
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<Record<string, unknown>>
    return cloneElement(child, { ref: ctx.refs.setReference, ...refProps })
  }
  return (
    <button
      ref={ctx.refs.setReference as never}
      type="button"
      className={cn(
        'inline-flex h-8 items-center justify-between gap-2 rounded-[10px] px-3 min-w-[140px]',
        'bg-uikit-chip text-uikit-12 text-uikit-ink outline-none cursor-pointer',
        'data-[state=open]:bg-uikit-search',
        className,
      )}
      {...refProps}
    >
      {children}
      <span className="text-uikit-muted text-[9px]">▾</span>
    </button>
  )
}

export interface SelectValueProps {
  placeholder?: ReactNode
  className?: string
}
export function SelectValue({ placeholder, className }: SelectValueProps) {
  const ctx = useSelectContext('SelectValue')
  const has = ctx.value !== undefined && ctx.label != null
  return (
    <span className={cn('truncate', !has && 'text-uikit-muted', className)}>
      {has ? ctx.label : placeholder}
    </span>
  )
}

export type SelectContentProps = ComponentProps<'div'>
export function SelectContent({ className, children, style, ...props }: SelectContentProps) {
  const ctx = useSelectContext('SelectContent')
  if (!ctx.open) return null
  return (
    <FloatingPortal>
      <FloatingFocusManager context={ctx.context} modal={false}>
        <div
          ref={ctx.refs.setFloating as never}
          style={{ ...ctx.floatingStyles, ...style }}
          className={cn(
            'uikit-panel-in z-[200] max-h-[min(60vh,320px)] overflow-y-auto rounded-[10px] p-1 font-uikit-ui',
            'bg-uikit-panel text-uikit-ink border border-uikit-faint shadow-uikit-soft outline-none',
            className,
          )}
          {...ctx.getFloatingProps(props)}
        >
          <FloatingList elementsRef={ctx.elementsRef} labelsRef={ctx.labelsRef}>
            {children}
          </FloatingList>
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  )
}

export interface SelectItemProps extends Omit<ComponentProps<'div'>, 'onSelect'> {
  value: string
  disabled?: boolean
}
export function SelectItem({ className, value, disabled, children, ...props }: SelectItemProps) {
  const ctx = useSelectContext('SelectItem')
  const text = typeof children === 'string' ? children : value
  const { ref, index } = useListItem({ label: disabled ? null : text })
  const active = ctx.activeIndex === index
  const selected = ctx.value === value

  // Surface the selected item's content to <SelectValue> (covers the initial
  // value set via defaultValue/value before any click).
  useEffect(() => {
    if (selected) ctx.setLabel(children)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, children])

  const itemProps = ctx.getItemProps({
    onClick: () => {
      if (disabled) return
      ctx.setValue(value)
      ctx.setLabel(children)
      ctx.setOpen(false)
    },
  })

  return (
    <div
      ref={ref as never}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled}
      tabIndex={active ? 0 : -1}
      data-active={active}
      data-selected={selected}
      className={cn(
        'flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-uikit-12 leading-uikit-snug',
        'cursor-pointer select-none outline-none data-[active=true]:bg-uikit-ink-5',
        'disabled:opacity-50 aria-disabled:opacity-50 aria-disabled:pointer-events-none',
        className,
      )}
      {...props}
      {...(disabled ? {} : itemProps)}
    >
      <span className="truncate">{children}</span>
      {selected && <span className="text-uikit-accent">✓</span>}
    </div>
  )
}

export function SelectGroup({ className, ...props }: ComponentProps<'div'>) {
  return <div role="group" className={cn('py-0.5', className)} {...props} />
}

export function SelectLabel({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('px-2 py-1 text-uikit-10 uppercase tracking-uikit-wide text-uikit-muted select-none', className)}
      {...props}
    />
  )
}
