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
/** Keep the panel this far from the viewport edge when shifting to reach an
 *  anchor. Below this the wedge gives up and parks at ARROW_MIN_INSET. */
const VIEWPORT_MARGIN = 8

export interface MenuProps {
  /**
   * Trigger element. Receives the current open state so the trigger can style
   * itself differently while the menu is open (e.g. tinted background).
   */
  trigger: (open: boolean) => ReactNode
  /** Panel alignment relative to the trigger. Default `'left'`. */
  align?: 'left' | 'right'
  /**
   * Which side of the trigger the panel opens on. Default `'down'` (below the
   * trigger). `'up'` anchors the panel's BOTTOM edge above the trigger — for
   * triggers parked at the bottom of the viewport (e.g. a sidebar footer),
   * where opening downward would put the panel off-screen. Both placements
   * clamp the panel to the viewport: content taller than the space between
   * the trigger and the viewport edge scrolls inside the panel.
   */
  placement?: 'down' | 'up'
  /** Panel min-width in px. Default `240`. */
  width?: number
  /**
   * Render a wedge on the panel's trigger-side edge (top when opening down,
   * bottom when opening up), pointing back at the trigger. Default `true`.
   * The wedge centers on the first `[data-menu-arrow]` descendant of the
   * trigger — put it on the chevron — and falls back to the trigger's own
   * center when no such element exists.
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
  placement = 'down',
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
    /** Distance from the viewport top ('down') or bottom ('up'). */
    top: number
    left: number
    right: number
    /** Space between the trigger and the near viewport edge — the panel's
     *  content scrolls rather than growing past it. */
    maxHeight: number
  }>({ top: 0, left: 0, right: 0, maxHeight: 0 })
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
      const viewportContentHeight = document.documentElement.clientHeight
      // 'down' measures from the viewport top to the panel's top edge;
      // 'up' measures from the viewport bottom to the panel's BOTTOM edge —
      // the panel then grows upward from the trigger, and `maxHeight` stops
      // it at the viewport margin instead of letting it run off the top.
      const top =
        placement === 'up'
          ? viewportContentHeight - r.top + 6
          : r.bottom + 6
      const maxHeight = Math.max(0, viewportContentHeight - top - VIEWPORT_MARGIN)

      const panelWidth = Math.min(
        panelRef.current?.offsetWidth || width,
        Math.max(0, viewportContentWidth - VIEWPORT_MARGIN * 2),
      )
      const anchor = triggerRef.current!.querySelector('[data-menu-arrow]')
      const aRect = anchor?.getBoundingClientRect()
      const anchorCenter = aRect
        ? aRect.left + aRect.width / 2
        : r.left + r.width / 2
      const rawInset = align === 'left' ? anchorCenter - r.left : r.right - anchorCenter
      const shift = arrow ? Math.max(0, ARROW_MIN_INSET - rawInset) : 0
      const desiredLeft = align === 'left' ? r.left - shift : r.right - panelWidth + shift
      // Both edges must stay in view, including a right-aligned theme menu
      // opened from the collapsed sidebar at the far LEFT of the viewport.
      const left = Math.max(
        VIEWPORT_MARGIN,
        Math.min(desiredLeft, viewportContentWidth - panelWidth - VIEWPORT_MARGIN),
      )
      setCoords({ top, left, right: viewportContentWidth - left - panelWidth, maxHeight })
      const inset = align === 'left' ? anchorCenter - left : left + panelWidth - anchorCenter
      setArrowInset(Math.min(
        Math.max(inset, ARROW_MIN_INSET),
        Math.max(ARROW_MIN_INSET, panelWidth - ARROW_MIN_INSET),
      ))
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, align, placement, width, arrow])

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
  // `coords.top` is the offset from the anchoring viewport edge: `top` when
  // opening down, `bottom` when opening up (the panel grows away from the
  // trigger in both cases).
  const panelStyle: CSSProperties = {
    ...(placement === 'up' ? { bottom: coords.top } : { top: coords.top }),
    ...(align === 'left' ? { left: coords.left } : { right: coords.right }),
    minWidth: `min(${width}px, calc(100vw - ${VIEWPORT_MARGIN * 2}px))`,
    maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)`,
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
                  'absolute rotate-45 bg-uikit-bg',
                  // The wedge sits on the trigger-side edge: top edge with the
                  // top-left corner's two borders when opening down, bottom
                  // edge with the bottom-right pair when opening up — after
                  // the 45° rotation each pair is the one facing the trigger.
                  placement === 'up'
                    ? 'bottom-0 rounded-br-[2px] border-b border-r border-uikit-faint'
                    : 'top-0 rounded-tl-[2px] border-t border-l border-uikit-faint',
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
                  translate:
                    placement === 'up'
                      ? `0 calc(50% + ${PANEL_RING / 2}px)`
                      : `0 calc(-50% - ${PANEL_RING / 2}px)`,
                }}
              />
            )}
            {/* Side padding here is what insets rows from the panel edge, so
                hover / selected fills read as rounded chips instead of
                edge-to-edge bands. Rows carry px-2 to keep text at 14px.
                The wrapper (not the panel) owns the viewport clamp: the panel
                must keep `overflow: visible` for the wedge, so content that
                outgrows the trigger-to-edge space scrolls in here instead. */}
            <div
              className="flex flex-col px-1.5 py-1.5 overflow-y-auto"
              style={coords.maxHeight > 0 ? { maxHeight: coords.maxHeight } : undefined}
            >
              {children}
            </div>
          </div>,
          document.body,
        )}
    </span>
  )
}
