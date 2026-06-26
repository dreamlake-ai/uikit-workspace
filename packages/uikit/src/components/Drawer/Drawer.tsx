import {
  type ComponentProps,
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
  cloneElement,
  isValidElement,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

export type DrawerDirection = 'top' | 'bottom' | 'left' | 'right'

interface DrawerContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  direction: DrawerDirection
}
const Ctx = createContext<DrawerContextValue | null>(null)
function useCtx(name: string) {
  const c = useContext(Ctx)
  if (!c) throw new Error(`<${name}> must be used inside <Drawer>`)
  return c
}

export interface DrawerProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Edge the drawer slides from. Default `bottom`. */
  direction?: DrawerDirection
  /** Accepted for drop-in parity with vaul (currently always modal/dismissible). */
  modal?: boolean
  dismissible?: boolean
  children: ReactNode
}

/**
 * Edge-anchored panel (sheet). Compose `DrawerTrigger` + `DrawerContent`
 * (with Header/Title/Description/Footer) and optional `DrawerClose`.
 *
 * Drop-in for the legacy `@vuer-ai/vuer-uikit` Drawer (which wrapped `vaul`).
 * Reimplemented with React context + a portal — no vaul dependency. Closes on
 * Esc and backdrop click.
 */
export function Drawer({
  open,
  defaultOpen = false,
  onOpenChange,
  direction = 'bottom',
  children,
}: DrawerProps) {
  const [internal, setInternal] = useState(defaultOpen)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internal
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternal(next)
    onOpenChange?.(next)
  }
  return <Ctx.Provider value={{ open: isOpen, setOpen, direction }}>{children}</Ctx.Provider>
}

export interface DrawerTriggerProps extends ComponentProps<'button'> {
  asChild?: boolean
}
export function DrawerTrigger({ asChild = false, onClick, children, ...props }: DrawerTriggerProps) {
  const { setOpen } = useCtx('DrawerTrigger')
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (e: MouseEvent) => void }>
    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      'data-slot': 'drawer-trigger',
      onClick: (e: MouseEvent) => {
        child.props.onClick?.(e)
        setOpen(true)
      },
    })
  }
  return (
    <button
      type="button"
      data-slot="drawer-trigger"
      onClick={(e) => {
        onClick?.(e)
        setOpen(true)
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export interface DrawerCloseProps extends ComponentProps<'button'> {
  asChild?: boolean
}
export function DrawerClose({ asChild = false, onClick, children, ...props }: DrawerCloseProps) {
  const { setOpen } = useCtx('DrawerClose')
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (e: MouseEvent) => void }>
    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      'data-slot': 'drawer-close',
      onClick: (e: MouseEvent) => {
        child.props.onClick?.(e)
        setOpen(false)
      },
    })
  }
  return (
    <button
      type="button"
      data-slot="drawer-close"
      onClick={(e) => {
        onClick?.(e)
        setOpen(false)
      }}
      {...props}
    >
      {children}
    </button>
  )
}

const PANEL_POS: Record<DrawerDirection, string> = {
  top: 'inset-x-0 top-0 max-h-[80vh] rounded-b-[14px]',
  bottom: 'inset-x-0 bottom-0 max-h-[80vh] rounded-t-[14px]',
  left: 'inset-y-0 left-0 w-[340px] max-w-[85vw] rounded-r-[14px]',
  right: 'inset-y-0 right-0 w-[340px] max-w-[85vw] rounded-l-[14px]',
}

export type DrawerContentProps = ComponentProps<'div'>
export function DrawerContent({ className, children, style, ...props }: DrawerContentProps) {
  const { open, setOpen, direction } = useCtx('DrawerContent')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, setOpen])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      data-slot="drawer-overlay"
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-[100] bg-[var(--scrim)] font-uikit-ui"
    >
      <div
        role="dialog"
        aria-modal="true"
        data-slot="drawer-content"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'fixed z-[101] flex h-auto flex-col bg-uikit-panel text-uikit-ink border-uikit-faint p-6 shadow-uikit-deep',
          direction === 'top' || direction === 'bottom' ? 'border-y' : 'border-x',
          PANEL_POS[direction],
          className,
        )}
        style={style as CSSProperties}
        {...props}
      >
        {direction === 'bottom' && (
          <div className="mx-auto -mt-2 mb-3 h-1 w-20 shrink-0 rounded-full bg-uikit-ink-12" />
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function DrawerHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="drawer-header" className={cn('flex flex-col gap-2 pb-4', className)} {...props} />
}

export function DrawerFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="drawer-footer" className={cn('mt-auto flex flex-col gap-3 pt-4', className)} {...props} />
}

export function DrawerTitle({ className, ...props }: ComponentProps<'h2'>) {
  return (
    <h2
      data-slot="drawer-title"
      className={cn('m-0 text-uikit-17 font-semibold leading-[1.2] tracking-uikit-tight', className)}
      {...props}
    />
  )
}

export function DrawerDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="drawer-description"
      className={cn('m-0 text-uikit-12 leading-uikit-prose text-uikit-muted', className)}
      {...props}
    />
  )
}

/** Folded into Content; kept as passthroughs for drop-in. */
export function DrawerPortal({ children }: { children?: ReactNode }) {
  return <>{children}</>
}
export function DrawerOverlay(_: ComponentProps<'div'>) {
  return null
}
