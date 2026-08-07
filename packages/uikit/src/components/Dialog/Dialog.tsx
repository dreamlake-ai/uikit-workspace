import { ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface DialogProps {
  /** Controlled open state. */
  open: boolean
  /** Fires when the dialog requests dismissal (Esc key, backdrop click, or
   *  any explicit close / cancel affordance). Caller must flip `open` to false. */
  onClose: () => void
  /** Heading shown at the top-left of the panel. */
  title?: ReactNode
  /** Small uppercase mono label rendered next to the title — e.g. "freeze a bindr → vN". */
  eyebrow?: string
  /** Footer content. Typically a row of action buttons aligned right. */
  footer?: ReactNode
  /** Panel width in px. Default 480. */
  width?: number
  /** Show the close (×) button in the header. Default true. (Named for the
   *  "esc" text hint it used to render; kept for API compatibility.) */
  showEscHint?: boolean
  /** Dismiss when the user clicks the dimmed backdrop. Default true. */
  dismissOnBackdropClick?: boolean
  /** Dismiss when the user presses Escape. Default true. */
  dismissOnEsc?: boolean
  /** Extra classes on the panel element. */
  className?: string
  children: ReactNode
}

// Own component so its hover state unmounts with the dialog content. Clicking
// × closes the dialog while the pointer is still over the button, so
// mouseleave never fires — hover state held by the (still-mounted) Dialog
// instance would survive the close and reopen pre-highlighted.
//
// Inline styles on purpose: consumers compile our utility classes at their own
// Tailwind pass, and a new arbitrary-value class here could silently miss
// older content configs.
function CloseButton({ onClose }: { onClose: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        appearance: 'none', border: 0, padding: 0, cursor: 'pointer',
        width: 22, height: 22, borderRadius: 5, alignSelf: 'center',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: hov ? 'color-mix(in srgb, var(--ink) 8%, transparent)' : 'transparent',
        color: hov ? 'var(--ink)' : 'var(--uikit-muted)',
        opacity: hov ? 1 : 0.65,
        transition: 'background 120ms ease, color 120ms ease, opacity 120ms ease',
      }}
    >
      <X size={14} strokeWidth={2} />
    </button>
  )
}

export function Dialog({
  open,
  onClose,
  title,
  eyebrow,
  footer,
  width = 480,
  showEscHint = true,
  dismissOnBackdropClick = true,
  dismissOnEsc = true,
  className,
  children,
}: DialogProps) {
  // Esc to dismiss.
  useEffect(() => {
    if (!open || !dismissOnEsc) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, dismissOnEsc, onClose])

  // Lock body scroll while the dialog is open so the page doesn't move under the dim layer.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      role="presentation"
      onClick={dismissOnBackdropClick ? onClose : undefined}
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center font-uikit-ui',
        'bg-[rgba(0,0,0,0.55)]',
      )}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'p-6 rounded-[14px] flex flex-col gap-4',
          'max-h-[85vh] overflow-y-auto',
          'bg-uikit-bg text-uikit-ink shadow-uikit-deep',
          className,
        )}
        style={{ width }}
      >
        {(title || eyebrow || showEscHint) && (
          <div className="flex items-baseline gap-2.5">
            {title && (
              <h3 className="m-0 font-uikit-ui text-uikit-17 font-semibold leading-[1.2] tracking-uikit-tight text-uikit-ink">
                {title}
              </h3>
            )}
            {eyebrow && (
              <span className="font-uikit-mono text-uikit-10 leading-uikit-snug text-uikit-muted opacity-60 tracking-uikit-wide uppercase">
                {eyebrow}
              </span>
            )}
            <span className="flex-1" />
            {showEscHint && <CloseButton onClose={onClose} />}
          </div>
        )}

        {children}

        {footer && (
          <div className="flex items-center gap-3 justify-end">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}
