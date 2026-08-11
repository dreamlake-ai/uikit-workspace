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

/** Wedge side length in px, pre-rotation. */
const ARROW_SIZE = 7
/**
 * Width of the hairline ring in `--shadow-uikit-soft` (`0 0 0 1px var(--faint)`).
 * A box-shadow ring paints *outside* the border box, so the panel's visible top
 * line is centered half of this above `y: 0` — see the wedge's `translate`.
 */
const PANEL_RING = 1
/**
 * Smallest distance from a panel edge to the wedge's center — keeps the wedge
 * off the panel's `rounded-lg` corners, where its base would hang in the air.
 */
const ARROW_MIN_INSET = 16

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
  /**
   * Render a wedge on the panel's top edge, pointing back at the trigger.
   * Default `true`. The wedge centers on the first `[data-menu-arrow]`
   * descendant of the trigger — put it on the chevron — and falls back to the
   * trigger's own center when no such element exists.
   */
  arrow?: boolean

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
  arrow = true,
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
  // Wedge center, in px from whichever panel edge `align` pins.
  const [arrowInset, setArrowInset] = useState(ARROW_MIN_INSET)

  // Track the trigger's viewport rect so the portaled panel stays anchored
  // through scroll / resize. Mirrors the BreadcrumbTree approach.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const update = () => {
      const r = triggerRef.current!.getBoundingClientRect()
      // Use clientWidth (excludes scrollbar) — `position: fixed; right` is
      // measured from the viewport content edge, same coordinate space as
      // getBoundingClientRect. Using window.innerWidth here would inflate
      // the right offset by the scrollbar width when classic scrollbars are
      // present, shifting the panel leftward by that amount.
      const viewportContentWidth = document.documentElement.clientWidth
      setCoords({
        top: r.bottom + 6,
        left: r.left,
        right: viewportContentWidth - r.right,
      })

      if (!arrow) return
      // Aim the wedge at the trigger's chevron when one is tagged, else at the
      // trigger's midpoint. `align` decides which panel edge the offset is
      // measured from: 'left' pins the panel's left edge to r.left, 'right'
      // pins its right edge to r.right — so both are trigger-relative and the
      // panel's own width is only needed for the far-edge clamp.
      const anchor = triggerRef.current!.querySelector('[data-menu-arrow]')
      const aRect = anchor?.getBoundingClientRect()
      const anchorCenter = aRect
        ? aRect.left + aRect.width / 2
        : r.left + r.width / 2
      const raw =
        align === 'left' ? anchorCenter - r.left : r.right - anchorCenter
      // Keep the wedge clear of the panel's rounded corners at both ends.
      const panelWidth = panelRef.current?.offsetWidth ?? width
      const far = Math.max(ARROW_MIN_INSET, panelWidth - ARROW_MIN_INSET)
      setArrowInset(Math.min(Math.max(raw, ARROW_MIN_INSET), far))
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, align, width, arrow])

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
    // Menu elevation — set inline (not via a shadow-* utility) so it always
    // applies. Uses the MEDIUM shadow tint + a tight spread so it doesn't read
    // as a heavy black blob in dark (where the deep tint-3 hits 0.75); the 1px
    // ring keeps the edge crisp. Lighter than `--shadow-uikit-soft`.
    boxShadow: '0 8px 22px -12px var(--shadow-tint-2), 0 0 0 1px var(--faint)',
  }

  return (
    <span
      ref={triggerRef}
      onClick={() => setOpen(!open)}
      className="inline-flex items-center cursor-pointer"
    >
      {trigger(open)}
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            // Contain stray clicks so they don't reach whatever the menu is
            // mounted inside — but NEVER swallow a link click. Menus can hold
            // real <a href> rows (e.g. the account switcher); Vike's client
            // router intercepts those at `document`, so stopping propagation
            // here would turn every menu link into a full page reload.
            onClick={(e) => {
              if (!(e.target as HTMLElement).closest?.('a[href]')) e.stopPropagation()
            }}
            className={cn(
              'uikit-panel-in fixed z-[1000]',
              // No padding on the panel itself — it's the containing block for
              // the wedge, and padding would offset the wedge's `left`/`right`
              // from the visible edge the inset is measured against. The inner
              // wrapper below does the padding instead.
              'rounded-lg',
              'bg-uikit-bg text-uikit-ink font-uikit-ui',
              className,
            )}
            style={panelStyle}
          >
            {arrow && (
              <span
                aria-hidden
                className={cn(
                  'absolute top-0 rotate-45',
                  'rounded-tl-[2px] border-t border-l border-uikit-faint',
                  'bg-uikit-bg',
                )}
                style={{
                  width: ARROW_SIZE,
                  height: ARROW_SIZE,
                  // `translate` only shifts Y, so left/right still position the
                  // un-rotated box — back off by half a side to center it.
                  [align]: arrowInset - ARROW_SIZE / 2,
                  // Sit the rotated square's side vertices on the *center of the
                  // panel's hairline*, not on the border-box edge. The ring
                  // paints outside the box, so centering at y:0 leaves the two
                  // bordered edges running a full ring-width past the visible
                  // line — they poke out below it as little ears at the base.
                  translate: `0 calc(-50% - ${PANEL_RING / 2}px)`,
                }}
              />
            )}
            {/* Side padding here is what insets rows from the panel edge, so
                hover / selected fills read as rounded chips instead of
                edge-to-edge bands. Rows carry px-2 to keep text at 14px. */}
            <div className="flex flex-col px-1.5 py-1.5">{children}</div>
          </div>,
          document.body,
        )}
    </span>
  )
}
