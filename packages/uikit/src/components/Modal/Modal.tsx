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

interface ModalContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}
const Ctx = createContext<ModalContextValue | null>(null)
function useCtx(name: string) {
  const c = useContext(Ctx)
  if (!c) throw new Error(`<${name}> must be used inside <Modal>`)
  return c
}

export interface ModalProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

/**
 * A general-purpose modal dialog. Compose `ModalTrigger` + `ModalContent`
 * (with Header/Title/Description/Footer). Closes on Esc and backdrop click, and
 * shows a close button by default.
 *
 * Drop-in for the legacy `@vuer-ai/vuer-uikit` Modal (which wrapped Radix
 * Dialog). Reimplemented with React context + a portal — no Radix dep. For a
 * confirmation prompt that must not dismiss on outside click, use
 * [AlertDialog](/components/alert-dialog) instead.
 */
export function Modal({ open, defaultOpen = false, onOpenChange, children }: ModalProps) {
  const [internal, setInternal] = useState(defaultOpen)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internal
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternal(next)
    onOpenChange?.(next)
  }
  return <Ctx.Provider value={{ open: isOpen, setOpen }}>{children}</Ctx.Provider>
}

export interface ModalTriggerProps extends ComponentProps<'button'> {
  asChild?: boolean
}
export function ModalTrigger({ asChild = false, onClick, children, ...props }: ModalTriggerProps) {
  const { setOpen } = useCtx('ModalTrigger')
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (e: MouseEvent) => void }>
    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      'data-slot': 'modal-trigger',
      onClick: (e: MouseEvent) => {
        child.props.onClick?.(e)
        setOpen(true)
      },
    })
  }
  return (
    <button
      type="button"
      data-slot="modal-trigger"
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

export interface ModalContentProps extends ComponentProps<'div'> {
  showCloseButton?: boolean
}
export function ModalContent({ className, children, showCloseButton = true, ...props }: ModalContentProps) {
  const { open, setOpen } = useCtx('ModalContent')

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
      data-slot="modal-overlay"
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(0,0,0,0.55)] font-uikit-ui"
    >
      <div
        role="dialog"
        aria-modal="true"
        data-slot="modal-content"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative flex flex-col gap-4 p-6 rounded-[14px] w-full max-w-[calc(100%-2rem)] sm:max-w-[480px]',
          'max-h-[85vh] overflow-y-auto bg-uikit-bg text-uikit-ink shadow-uikit-deep',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <button
            type="button"
            aria-label="Close"
            data-slot="modal-close"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 inline-flex size-6 items-center justify-center rounded-md text-uikit-muted hover:bg-uikit-ink-5 hover:text-uikit-ink transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}

export interface ModalCloseProps extends ComponentProps<'button'> {
  asChild?: boolean
}
export function ModalClose({ asChild = false, onClick, children, ...props }: ModalCloseProps) {
  const { setOpen } = useCtx('ModalClose')
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (e: MouseEvent) => void }>
    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      'data-slot': 'modal-close',
      onClick: (e: MouseEvent) => {
        child.props.onClick?.(e)
        setOpen(false)
      },
    })
  }
  return (
    <button
      type="button"
      data-slot="modal-close"
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

export function ModalHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="modal-header" className={cn('flex flex-col gap-1', className)} {...props} />
}
export function ModalTitle({ className, ...props }: ComponentProps<'h2'>) {
  return (
    <h2
      data-slot="modal-title"
      className={cn('m-0 text-uikit-17 font-semibold leading-[1.2] tracking-uikit-tight', className)}
      {...props}
    />
  )
}
export function ModalDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="modal-description"
      className={cn('m-0 text-uikit-12 leading-uikit-prose text-uikit-muted', className)}
      {...props}
    />
  )
}
export function ModalFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="modal-footer" className={cn('flex w-full justify-end gap-2', className)} {...props} />
}

/** Folded into Content; kept as passthroughs for drop-in. */
export function ModalPortal({ children }: { children?: ReactNode }) {
  return <>{children}</>
}
export function ModalOverlay(_: ComponentProps<'div'>) {
  return null
}
