import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { TransportButton } from '../MediaTransport'

export interface MediaViewerDialogProps {
  open?: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Caption beneath the media; a gallery may include its position here. */
  caption?: ReactNode
  /** Optional gallery rail; horizontal on narrow screens. */
  rail?: ReactNode
  /**
   * Controls beside Close. Use `TransportButton` so they match it; ink and
   * its 5% hover wash resolve to the dark theme's values here, in either theme.
   */
  actions?: ReactNode
  dismissible?: boolean
  initialFocus?: RefObject<HTMLElement | null>
  returnFocus?: RefObject<HTMLElement | null>
  /** Keep this on editor media so existing integrations can identify it. */
  'data-note-image-lightbox'?: string
}

const openViewers: symbol[] = []
let unlockedOverflow = ''
let firstOpener: HTMLElement | null = null

/** The editor's full-window media viewer, shared with attachments and plots. */
export function MediaViewerDialog({ open = true, ...props }: MediaViewerDialogProps) {
  return open && typeof document !== 'undefined' ? <OpenMediaViewer {...props} /> : null
}

function OpenMediaViewer({
  onClose,
  title,
  children,
  caption,
  rail,
  actions,
  dismissible = true,
  initialFocus,
  returnFocus,
  ...attributes
}: Omit<MediaViewerDialogProps, 'open'>) {
  const dialog = useRef<HTMLDivElement>(null)
  const identity = useRef(Symbol('media-viewer')).current
  const latest = useRef({ onClose, dismissible, returnFocus })
  latest.current = { onClose, dismissible, returnFocus }
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (openViewers.length === 0) {
      unlockedOverflow = document.body.style.overflow
      firstOpener = opener
    }
    openViewers.push(identity)
    document.body.style.overflow = 'hidden'
    ;(initialFocus?.current ?? dialog.current)?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => {
      if (openViewers.at(-1) !== identity || document.fullscreenElement) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        if (latest.current.dismissible) latest.current.onClose()
      } else if (event.key === 'Tab') {
        const items = [
          ...(dialog.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), video[controls], iframe, [tabindex]:not([tabindex="-1"])'
          ) ?? []),
        ].filter(
          (element) =>
            !element.closest('[hidden], [inert]') && getComputedStyle(element).display !== 'none'
        )
        items.sort((a, b) =>
          a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
        )
        const first = items[0],
          last = items.at(-1)
        if (!first) {
          event.preventDefault()
          dialog.current?.focus()
          return
        }
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === dialog.current)
        ) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      const wasTopmost = openViewers.at(-1) === identity
      const index = openViewers.indexOf(identity)
      if (index >= 0) openViewers.splice(index, 1)
      if (openViewers.length === 0) document.body.style.overflow = unlockedOverflow
      if (wasTopmost) {
        const preferred = latest.current.returnFocus?.current ?? opener
        const target = preferred?.isConnected ? preferred : firstOpener
        if (target?.isConnected) target.focus({ preventScroll: true })
      }
      if (openViewers.length === 0) firstOpener = null
    }
  }, [])
  return createPortal(
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      data-state="open"
      data-media-viewer=""
      {...attributes}
      onClick={(event) => {
        // Portals still bubble through their React parents, including another viewer.
        event.stopPropagation()
        if (openViewers.at(-1) === identity && dismissible) onClose()
      }}
      className="uikit-modal-backdrop uikit-media-viewer"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        outline: 'none',
        background: 'rgba(0,0,0,0.86)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        className="uikit-media-viewer-main"
        style={{
          position: 'relative',
          display: 'flex',
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {children}
        {caption && (
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              display: 'flex',
              width: '100%',
              maxWidth: 1100,
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: 11,
              fontFamily: 'var(--f-mono)',
              color: 'rgba(255,255,255,0.86)',
            }}
          >
            {caption}
          </div>
        )}
        {/* Light ink for this cluster only: the backdrop is dark in every theme,
            while the media itself keeps the app's own surface. */}
        <div
          onClick={(event) => event.stopPropagation()}
          className="uikit-media-viewer-actions"
          style={{
            position: 'absolute',
            right: 16,
            top: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {actions}
          <TransportButton label="Close" onClick={onClose} disabled={!dismissible}>
            <X size={16} strokeWidth={2} aria-hidden />
          </TransportButton>
        </div>
      </div>
      {rail}
    </div>,
    document.body
  )
}
