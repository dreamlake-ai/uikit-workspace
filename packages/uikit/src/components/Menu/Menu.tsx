import {
  ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

export interface MenuProps {
  /**
   * Trigger element. Receives the current open state so the trigger can style
   * itself differently while the menu is open (e.g. tinted background).
   */
  trigger: (open: boolean) => ReactNode
  /** Panel alignment relative to the trigger. Default `'left'`. */
  align?: 'left' | 'right'
  /** Panel min-width in px. Default `240`. */
  width?: number

  /** Controlled open state. Omit for uncontrolled mode. */
  open?: boolean
  /** Fires when the menu wants to open or close. Required when controlled. */
  onOpenChange?: (open: boolean) => void
  /** Initial open state in uncontrolled mode. Default `false`. */
  defaultOpen?: boolean

  /** Dismiss when the user presses Escape. Default `true`. */
  dismissOnEsc?: boolean
  /** Dismiss when the user clicks outside both the trigger and panel. Default `true`. */
  dismissOnOutsideClick?: boolean

  /** Extra classes on the panel element. */
  className?: string
  /** Panel content — typically `MenuSection`, `MenuItem`, `MenuDivider`. */
  children: ReactNode
}

export function Menu({
  trigger,
  align = 'left',
  width = 240,
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  dismissOnEsc = true,
  dismissOnOutsideClick = true,
  className,
  children,
}: MenuProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp! : internalOpen

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  const triggerRef = useRef<HTMLSpanElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{
    top: number
    left: number
    right: number
  }>({ top: 0, left: 0, right: 0 })

  // Track the trigger's viewport rect so the portaled panel stays anchored
  // through scroll / resize. Mirrors the BreadcrumbTree approach.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const update = () => {
      const r = triggerRef.current!.getBoundingClientRect()
      setCoords({
        top: r.bottom + 6,
        left: r.left,
        right: window.innerWidth - r.right,
      })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open])

  // Esc dismiss.
  useEffect(() => {
    if (!open || !dismissOnEsc) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, dismissOnEsc]) // eslint-disable-line react-hooks/exhaustive-deps

  // Outside-click dismiss — must check both trigger and portaled panel.
  useEffect(() => {
    if (!open || !dismissOnOutsideClick) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, dismissOnOutsideClick]) // eslint-disable-line react-hooks/exhaustive-deps

  // Position is runtime-computed; everything else is class-driven.
  const panelStyle: CSSProperties = {
    top: coords.top,
    ...(align === 'left' ? { left: coords.left } : { right: coords.right }),
    minWidth: width,
  }

  return (
    <span
      ref={triggerRef}
      onClick={() => setOpen(!open)}
      className="inline-block cursor-pointer"
    >
      {trigger(open)}
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'vdu-panel-in fixed z-[1000] flex flex-col',
              'rounded-lg py-1.5',
              'bg-uikit-bg text-uikit-ink font-uikit-ui',
              'shadow-uikit-soft',
              className,
            )}
            style={panelStyle}
          >
            {children}
          </div>,
          document.body,
        )}
    </span>
  )
}
