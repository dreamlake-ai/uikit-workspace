import {
  type ComponentProps,
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

interface AlertDialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}
const Ctx = createContext<AlertDialogContextValue | null>(null)
function useCtx(name: string) {
  const c = useContext(Ctx)
  if (!c) throw new Error(`<${name}> must be used inside <AlertDialog>`)
  return c
}

export interface AlertDialogProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

/**
 * A modal confirmation dialog. Compose `AlertDialogTrigger` + `AlertDialogContent`
 * (with Header/Title/Description/Footer and Action/Cancel buttons).
 *
 * Drop-in for the legacy `@vuer-ai/vuer-uikit` AlertDialog (which wrapped
 * Radix). Reimplemented with React context + a portal; like Radix's AlertDialog
 * it closes on Esc but NOT on backdrop click (a choice must be made explicitly).
 */
export function AlertDialog({ open, defaultOpen = false, onOpenChange, children }: AlertDialogProps) {
  const [internal, setInternal] = useState(defaultOpen)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internal
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternal(next)
    onOpenChange?.(next)
  }
  return <Ctx.Provider value={{ open: isOpen, setOpen }}>{children}</Ctx.Provider>
}

export interface AlertDialogTriggerProps extends ComponentProps<'button'> {
  asChild?: boolean
}
export function AlertDialogTrigger({ asChild = false, onClick, children, ...props }: AlertDialogTriggerProps) {
  const { setOpen } = useCtx('AlertDialogTrigger')
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (e: MouseEvent) => void }>
    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      'data-slot': 'alert-dialog-trigger',
      onClick: (e: MouseEvent) => {
        child.props.onClick?.(e)
        setOpen(true)
      },
    })
  }
  return (
    <button
      type="button"
      data-slot="alert-dialog-trigger"
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

export type AlertDialogContentProps = ComponentProps<'div'>
export function AlertDialogContent({ className, children, ...props }: AlertDialogContentProps) {
  const { open, setOpen } = useCtx('AlertDialogContent')

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
      data-slot="alert-dialog-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(0,0,0,0.55)] font-uikit-ui"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        data-slot="alert-dialog-content"
        className={cn(
          'flex flex-col gap-4 p-6 rounded-[14px] w-full max-w-[calc(100%-2rem)] sm:max-w-[440px]',
          'max-h-[85vh] overflow-y-auto bg-uikit-bg text-uikit-ink shadow-uikit-deep',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function AlertDialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="alert-dialog-header" className={cn('flex flex-col gap-2', className)} {...props} />
}

export function AlertDialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}

export function AlertDialogTitle({ className, ...props }: ComponentProps<'h2'>) {
  return (
    <h2
      data-slot="alert-dialog-title"
      className={cn('m-0 text-uikit-17 font-semibold leading-[1.2] tracking-uikit-tight', className)}
      {...props}
    />
  )
}

export function AlertDialogDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="alert-dialog-description"
      className={cn('m-0 text-uikit-12 leading-uikit-prose text-uikit-muted', className)}
      {...props}
    />
  )
}

export interface AlertDialogActionProps extends ComponentProps<'button'> {
  asChild?: boolean
}
/** Confirms and closes. */
export function AlertDialogAction({ asChild = false, onClick, children, ...props }: AlertDialogActionProps) {
  const { setOpen } = useCtx('AlertDialogAction')
  const handle = (e: MouseEvent) => {
    onClick?.(e as MouseEvent<HTMLButtonElement>)
    if (!e.defaultPrevented) setOpen(false)
  }
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (e: MouseEvent) => void }>
    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      'data-slot': 'alert-dialog-action',
      onClick: (e: MouseEvent) => {
        child.props.onClick?.(e)
        if (!e.defaultPrevented) setOpen(false)
      },
    })
  }
  return (
    <button type="button" data-slot="alert-dialog-action" onClick={handle} {...props}>
      {children}
    </button>
  )
}

export interface AlertDialogCancelProps extends ComponentProps<'button'> {
  asChild?: boolean
}
/** Dismisses without confirming. */
export function AlertDialogCancel({ asChild = false, onClick, children, ...props }: AlertDialogCancelProps) {
  const { setOpen } = useCtx('AlertDialogCancel')
  const handle = (e: MouseEvent) => {
    onClick?.(e as MouseEvent<HTMLButtonElement>)
    if (!e.defaultPrevented) setOpen(false)
  }
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (e: MouseEvent) => void }>
    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      'data-slot': 'alert-dialog-cancel',
      onClick: (e: MouseEvent) => {
        child.props.onClick?.(e)
        if (!e.defaultPrevented) setOpen(false)
      },
    })
  }
  return (
    <button type="button" data-slot="alert-dialog-cancel" onClick={handle} {...props}>
      {children}
    </button>
  )
}

/** Portal/Overlay are folded into Content; kept as passthroughs for drop-in. */
export function AlertDialogPortal({ children }: { children?: ReactNode }) {
  return <>{children}</>
}
export function AlertDialogOverlay(_: ComponentProps<'div'>) {
  return null
}
