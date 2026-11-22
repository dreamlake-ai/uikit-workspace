import {
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  type Ref,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  FloatingPortal,
  autoUpdate,
  arrow as arrowMiddleware,
  flip,
  offset,
  shift,
  useClientPoint,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useMergeRefs,
  useRole,
} from '@floating-ui/react'
import { OverlayArrow } from '../../lib/overlay-arrow'
import { cn } from '../../lib/utils'

type Side = 'top' | 'right' | 'bottom' | 'left'

/** A client rect without the DOMRect methods. */
export interface TooltipRect {
  x?: number
  y?: number
  width: number
  height: number
  top: number
  right: number
  bottom: number
  left: number
}
/** Anything Floating UI can position against without a DOM node. */
export interface TooltipVirtualAnchor {
  getBoundingClientRect: () => DOMRect | TooltipRect
  contextElement?: Element
}
/**
 * A position anchor that replaces the trigger for placement only. A rect is
 * applied when it changes; a getter (or virtual element) is re-read on every
 * animation frame while the tooltip is open, so a moving anchor is followed.
 */
export type TooltipAnchor =
  | DOMRect
  | TooltipRect
  | (() => DOMRect | TooltipRect)
  | TooltipVirtualAnchor
export type TooltipGlide = boolean | { durationMs?: number }

const DEFAULT_GLIDE_MS = 160
/** CSS ease-out (easeOutCubic). */
const GLIDE_EASE = 'cubic-bezier(0.215, 0.61, 0.355, 1)'
const EMPTY_RECT: TooltipRect = { width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 }

function readAnchor(anchor: TooltipAnchor): DOMRect | TooltipRect {
  if (typeof anchor === 'function') return anchor()
  if ('getBoundingClientRect' in anchor && typeof anchor.getBoundingClientRect === 'function')
    return anchor.getBoundingClientRect()
  return anchor as DOMRect | TooltipRect
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
}

/** Resolves the `glide` prop to a duration in ms, or 0 when glide is off. */
export function resolveGlideMs(glide: TooltipGlide | undefined, reducedMotion: boolean): number {
  if (!glide || reducedMotion) return 0
  if (glide === true) return DEFAULT_GLIDE_MS
  return Math.max(0, glide.durationMs ?? DEFAULT_GLIDE_MS)
}

/** The transition a gliding surface (`transform`) or wedge (`left`/`top`) wears. */
export function glideTransition(ms: number, properties: string[]): string | undefined {
  if (!ms) return undefined
  return properties.map((p) => `${p} ${ms}ms ${GLIDE_EASE}`).join(', ')
}

interface TooltipContextValue {
  showArrow: boolean
  /** Glide duration in ms once the first position is painted; 0 = jump. */
  glideMs: number
  arrowRef: React.RefObject<HTMLSpanElement | null>
  open: boolean
  refs: ReturnType<typeof useFloating>['refs']
  floatingStyles: ReturnType<typeof useFloating>['floatingStyles']
  context: ReturnType<typeof useFloating>['context']
  getReferenceProps: (props?: Record<string, unknown>) => Record<string, unknown>
  getFloatingProps: (props?: Record<string, unknown>) => Record<string, unknown>
  setPlacement: (side: Side) => void
}
const TooltipContext = createContext<TooltipContextValue | null>(null)
function useTooltipContext(name: string) {
  const c = useContext(TooltipContext)
  if (!c) throw new Error(`<${name}> must be used inside <Tooltip>`)
  return c
}

const DelayContext = createContext<number>(200)

export interface TooltipProviderProps {
  /** Hover delay (ms) before tooltips open. Default 200. */
  delayDuration?: number
  children: ReactNode
}
/** Optional: sets a shared open delay for descendant tooltips. */
export function TooltipProvider({ delayDuration = 200, children }: TooltipProviderProps) {
  return <DelayContext.Provider value={delayDuration}>{children}</DelayContext.Provider>
}

export interface TooltipProps {
  /** Show the trigger wedge. Default true; opt out for unanchored-looking content. */
  showArrow?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Hover delay (ms). Falls back to the nearest TooltipProvider (or 200). */
  delayDuration?: number
  /** Preferred side of the trigger. Default 'top'. */
  side?: Side
  /** Gap between trigger and tooltip, in px. Default 6. */
  sideOffset?: number
  /** Follow mouse position; keyboard focus remains anchored to the trigger. */
  followPointer?: boolean
  /**
   * Position against this rect (or rect getter / virtual element) instead of
   * the trigger. Hover and focus still come from `TooltipTrigger` when one is
   * rendered; without one, drive `open` yourself. Moving the anchor while open
   * repositions the same content; children are never remounted.
   */
  anchorRect?: TooltipAnchor
  /**
   * Animate between positions when the anchor moves while open (ease-out,
   * default 160 ms). The wedge follows. The first position after opening
   * never glides. Off under `prefers-reduced-motion: reduce`.
   */
  glide?: TooltipGlide
  children: ReactNode
}

/**
 * Hover/focus tooltip. Compose `TooltipTrigger` + `TooltipContent`.
 *
 * Drop-in for the legacy `@vuer-ai/vuer-uikit` Tooltip (Radix). Reimplemented on
 * `@floating-ui/react` for anchored, viewport-aware positioning.
 */
export function Tooltip({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  delayDuration,
  side = 'top',
  sideOffset = 6,
  showArrow = true,
  followPointer = false,
  anchorRect,
  glide,
  children,
}: TooltipProps) {
  const providerDelay = useContext(DelayContext)
  const delay = delayDuration ?? providerDelay
  const arrowRef = useRef<HTMLSpanElement>(null)
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolled
  const openRef = useRef(open)
  openRef.current = open
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolled(next)
    onOpenChange?.(next)
  }

  // Placement can be set by the `side` prop here or overridden by a
  // `side` prop on TooltipContent (drop-in parity with the Radix API).
  const [placement, setPlacement] = useState<Side>(side)

  const anchorRef = useRef(anchorRect)
  anchorRef.current = anchorRect
  const hasAnchor = anchorRect !== undefined
  // A moving anchor (a getter, or a glide target) has no DOM resize or scroll
  // to observe, so poll it each frame while open. Static trigger anchors keep
  // the cheaper event-driven autoUpdate.
  const pollFrames = hasAnchor || !!glide
  const { refs, floatingStyles, context, update, isPositioned } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: (reference, floating, run) =>
      autoUpdate(reference, floating, run, { animationFrame: pollFrames }),
    middleware: [
      offset(sideOffset + (showArrow ? 4 : 0)),
      // `crossAxis: false` so flip judges only the axis the placement is ON.
      // With the default (true) a wide tooltip on a control near a viewport
      // edge was rejected for sticking out SIDEWAYS, and flip — running before
      // shift — bounced it onto the perpendicular axis: a top-bar button's
      // tooltip landed beside the button instead of under it, and `side` looked
      // like it did nothing. Keeping horizontal overflow out of flip's decision
      // lets `shift()` do the job it is there for and slide it back into view.
      flip({ fallbackAxisSideDirection: 'start', crossAxis: false }),
      shift({ padding: 6 }),
      ...(showArrow ? [arrowMiddleware({ element: arrowRef, padding: 8 })] : []),
    ],
  })

  // One stable virtual element reads the latest anchor, so a new rect object
  // every render neither re-subscribes autoUpdate nor remounts the content.
  const virtualAnchor = useMemo(
    () => ({
      getBoundingClientRect: () => {
        const a = anchorRef.current
        const r = a ? readAnchor(a) : EMPTY_RECT
        return {
          x: r.left,
          y: r.top,
          width: r.width,
          height: r.height,
          top: r.top,
          left: r.left,
          right: r.right,
          bottom: r.bottom,
        }
      },
      get contextElement() {
        const a = anchorRef.current
        return a && typeof a === 'object' && 'contextElement' in a ? a.contextElement : undefined
      },
    }),
    []
  )
  useLayoutEffect(() => {
    if (!hasAnchor) return
    refs.setPositionReference(virtualAnchor)
    // Hand placement back to the trigger (if any) when the anchor goes away.
    // Never pass null: Floating UI would drop the trigger reference too.
    return () => {
      const trigger = refs.domReference.current
      if (trigger) refs.setPositionReference(trigger)
    }
  }, [hasAnchor, refs, virtualAnchor])
  // A plain rect prop changes by value; recompute when the caller passes a new one.
  useLayoutEffect(() => {
    if (open && hasAnchor) update()
  }, [anchorRect, open, hasAnchor, update])

  // Glide engages one frame after the first painted position, so opening
  // never slides in from the (0, 0) placeholder Floating UI starts at.
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(mq.matches)
    mq.addEventListener?.('change', sync)
    return () => mq.removeEventListener?.('change', sync)
  }, [])
  const targetGlideMs = resolveGlideMs(glide, reducedMotion)
  const [glideArmed, setGlideArmed] = useState(false)
  useEffect(() => {
    if (!open || !isPositioned || !targetGlideMs) {
      setGlideArmed(false)
      return
    }
    const raf = requestAnimationFrame(() => setGlideArmed(true))
    return () => cancelAnimationFrame(raf)
  }, [open, isPositioned, targetGlideMs])
  const glideMs = glideArmed ? targetGlideMs : 0

  const hover = useHover(context, {
    move: false,
    delay: { open: delay, close: 80 },
  })
  // An explicit anchor wins over pointer following.
  const point = useClientPoint(context, { enabled: followPointer && !hasAnchor })
  const focus = useFocus(context)
  // Native editors can stop Escape in target-capture (xterm does). Observe it
  // before that boundary without consuming the editor's key. Listen even while
  // closed: a hover delay may be pending. Use the Floating UI context so its
  // hover timers and focus reopening are cancelled along with visible hints.
  useEffect(() => {
    const reference = context.elements.domReference
    // An anchor-only tooltip has no trigger; Escape still dismisses it.
    if (!reference && !hasAnchor) return
    const doc = reference?.ownerDocument ?? document
    let hovering = false
    const enter = () => {
      hovering = true
    }
    const leave = () => {
      hovering = false
    }
    const escape = (event: KeyboardEvent) => {
      // Do not suppress focus on unrelated closed tooltips: their next Tab
      // focus should still show a hint. Hover tracks the pending-delay case.
      if (event.key === 'Escape' && !event.isComposing && (openRef.current || hovering))
        context.onOpenChange(false, event, 'escape-key')
    }
    reference?.addEventListener('mouseenter', enter)
    reference?.addEventListener('mouseleave', leave)
    doc.addEventListener('keydown', escape, true)
    return () => {
      reference?.removeEventListener('mouseenter', enter)
      reference?.removeEventListener('mouseleave', leave)
      doc.removeEventListener('keydown', escape, true)
    }
  }, [context.elements.domReference, context.onOpenChange, hasAnchor])
  const dismiss = useDismiss(context, { escapeKey: false })
  const role = useRole(context, { role: 'tooltip' })
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    point,
    focus,
    dismiss,
    role,
  ])

  const value = useMemo<TooltipContextValue>(
    () => ({
      showArrow,
      glideMs,
      arrowRef,
      open,
      refs,
      floatingStyles,
      context,
      getReferenceProps,
      getFloatingProps,
      setPlacement,
    }),
    [open, refs, floatingStyles, context, getReferenceProps, getFloatingProps, showArrow, glideMs]
  )

  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>
}

export interface TooltipTriggerProps extends ComponentProps<'button'> {
  asChild?: boolean
}
export function TooltipTrigger({ asChild = false, children, ...props }: TooltipTriggerProps) {
  const ctx = useTooltipContext('TooltipTrigger')
  const refProps = ctx.getReferenceProps(props)
  // asChild must KEEP the child's own ref. Cloning with only floating-ui's
  // reference ref replaced it, so a component holding a ref to its button
  // (to measure it, focus it, dock a panel beside it) got null the moment the
  // button was wrapped in a tooltip. React 19 carries the ref on props.
  const childRef =
    asChild && isValidElement(children)
      ? ((children.props as { ref?: Ref<unknown> }).ref ?? null)
      : null
  const triggerRef = useMergeRefs([ctx.refs.setReference, childRef])

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<Record<string, unknown>>
    // COMPOSE the child's own event handlers with floating-ui's rather than
    // replacing them. `cloneElement` lets the passed props win, so any handler
    // the trigger already had for an event the interaction hooks also listen
    // to was silently dropped. `useHover` enters on `onPointerEnter` (no
    // clash) but leaves on `onMouseLeave` (clash) — so a trigger that painted
    // itself on enter and reset on leave applied the paint and never undid it.
    // Measured on a topbar icon button: background went to `ink 4%` on hover
    // and stayed there after the pointer left, for the life of the page.
    const merged: Record<string, unknown> = { ...refProps }
    for (const key of Object.keys(refProps)) {
      if (!/^on[A-Z]/.test(key)) continue
      const own = child.props[key]
      const theirs = refProps[key]
      if (typeof own === 'function' && typeof theirs === 'function') {
        merged[key] = (...args: unknown[]) => {
          ;(own as (...a: unknown[]) => unknown)(...args)
          ;(theirs as (...a: unknown[]) => unknown)(...args)
        }
      }
    }
    return cloneElement(child, { ref: triggerRef, ...merged })
  }
  return (
    <button ref={ctx.refs.setReference as never} type="button" {...refProps}>
      {children}
    </button>
  )
}

export interface TooltipContentProps extends ComponentProps<'div'> {
  /** Short sliding entry; disabled automatically for reduced motion. Default true. */
  motion?: boolean
  /** Override the side set on `Tooltip` (drop-in parity with the Radix API). */
  side?: Side
  /** Accepted for Radix parity; gap is controlled on `Tooltip`. */
  sideOffset?: number
  /** Accepted for Radix parity; currently advisory. */
  align?: 'start' | 'center' | 'end'
}
export function TooltipContent({
  className,
  children,
  style,
  side,
  sideOffset: _sideOffset,
  motion = true,
  align: _align,
  ...props
}: TooltipContentProps) {
  const ctx = useTooltipContext('TooltipContent')
  useEffect(() => {
    if (side) ctx.setPlacement(side)
  }, [side, ctx])
  if (!ctx.open) return null
  const transition = glideTransition(ctx.glideMs, ['transform'])
  return (
    <FloatingPortal>
      <div
        ref={ctx.refs.setFloating as never}
        data-uikit-overlay="tooltip"
        data-side={ctx.context.placement.split('-')[0]}
        data-glide={ctx.glideMs ? '' : undefined}
        style={{ ...ctx.floatingStyles, ...(transition ? { transition } : null), ...style }}
        className={cn(
          motion && 'uikit-overlay-enter',
          'z-[200] max-w-[260px] rounded-md px-2 py-1 font-uikit-ui text-uikit-11 leading-uikit-snug',
          // The kit's floating-overlay surface — the SAME one Popover and
          // DropdownMenu use. This used to be an inverted chip
          // (`bg-uikit-ink text-uikit-bg`), which left the tooltip as the only
          // overlay in the kit that didn't wear the theme's own surface: a hard
          // black block on a warm light page, a hard white one in dark. It read
          // as foreign on every DreamLake surface, worst of all on the graph
          // canvases. `shadow-uikit-soft` carries a 1px faint ring, which is
          // what lifts the panel off the page in dark mode, where panel and bg
          // are the same colour.
          'bg-uikit-panel text-uikit-ink shadow-uikit-soft pointer-events-none',
          className
        )}
        {...ctx.getFloatingProps(props)}
      >
        {children}
        {ctx.showArrow && (
          <OverlayArrow arrowRef={ctx.arrowRef} context={ctx.context} glideMs={ctx.glideMs} />
        )}
      </div>
    </FloatingPortal>
  )
}
