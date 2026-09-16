import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { cn } from '../../lib/utils'
import { resizeSplit } from './panel-box'
import { MIN_PX, type Dir } from './panel-tree'

/**
 * Divider — the draggable seam between two children of a split.
 *
 * Drag it to move the boundary. The bar itself is invisible at rest; a slim pill
 * fades in under the cursor on hover and goes solid while grabbed, and it RIDES
 * ALONG the bar with the pointer rather than sitting at a fixed midpoint, so on a
 * tall divider the affordance is always where the hand already is.
 *
 * The pill deliberately matches the panel header's dock handle (56×3), so the two
 * grab affordances read as the same control.
 *
 * ACCESSIBILITY: the standard `separator` splitter pattern — focusable, with
 * `aria-valuenow/min/max` reporting the boundary as a percentage, and arrow keys
 * (plus Page keys for a coarse step, Home/End for the extremes) moving it. The
 * same `resizeSplit` clamp runs for pointer and keyboard, so neither can push a
 * panel below its minimum.
 */
/** Keyboard nudge, in px of cursor-equivalent travel. */
const KEY_STEP_PX = 16
const KEY_PAGE_PX = 96
export function Divider({
  dir,
  splitId,
  index,
  sizeA,
  sizeB,
  childCount,
  onResize,
}: {
  dir: Dir
  splitId: string
  index: number
  sizeA: number
  sizeB: number
  /** Children in this split — the dividers between them don't get flex space. */
  childCount: number
  onResize: (splitId: string, index: number, a: number, b: number) => void
}) {
  const [active, setActive] = useState(false)
  const [hover, setHover] = useState(false)
  // Cursor position along the bar (cross-axis px + the bar's cross length), used
  // to place the pill. Tracked on hover too, not just during a drag.
  const [cur, setCur] = useState<{ pos: number; len: number } | null>(null)
  const drag = useRef<{ start: number; containerPx: number; a: number; b: number } | null>(null)

  const isRow = dir === 'row'

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const parent = e.currentTarget.parentElement
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    drag.current = {
      start: isRow ? e.clientX : e.clientY,
      containerPx: isRow ? rect.width : rect.height,
      a: sizeA,
      b: sizeB,
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* pointer capture is best-effort */
    }
    setActive(true)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Track the cursor along the bar (drives the pill) on hover and drag.
    const rect = e.currentTarget.getBoundingClientRect()
    setCur({
      pos: isRow ? e.clientY - rect.top : e.clientX - rect.left,
      len: isRow ? rect.height : rect.width,
    })

    const d = drag.current
    if (!d) return
    const along = isRow ? e.clientX : e.clientY
    const { a, b } = resizeSplit({
      containerPx: d.containerPx,
      childCount,
      deltaPx: along - d.start,
      a: d.a,
      b: d.b,
      minPx: MIN_PX,
    })
    onResize(splitId, index, a, b)
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null
    setActive(false)
    if (!hover) setCur(null)
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* no-op */
    }
  }

  /** Resize by a px-equivalent nudge, through the very same clamp the drag uses. */
  const nudge = (deltaPx: number, el: HTMLElement) => {
    const parent = el.parentElement
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    const { a, b } = resizeSplit({
      containerPx: isRow ? rect.width : rect.height,
      childCount,
      deltaPx,
      a: sizeA,
      b: sizeB,
      minPx: MIN_PX,
    })
    onResize(splitId, index, a, b)
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const back = isRow ? 'ArrowLeft' : 'ArrowUp'
    const fwd = isRow ? 'ArrowRight' : 'ArrowDown'
    const el = e.currentTarget
    switch (e.key) {
      case back:
        e.preventDefault()
        nudge(-KEY_STEP_PX, el)
        break
      case fwd:
        e.preventDefault()
        nudge(KEY_STEP_PX, el)
        break
      case 'PageUp':
        e.preventDefault()
        nudge(-KEY_PAGE_PX, el)
        break
      case 'PageDown':
        e.preventDefault()
        nudge(KEY_PAGE_PX, el)
        break
      // The clamp turns a deliberately absurd delta into "as far as it goes".
      case 'Home':
        e.preventDefault()
        nudge(-1e6, el)
        break
      case 'End':
        e.preventDefault()
        nudge(1e6, el)
        break
    }
  }

  const span = sizeA + sizeB
  const valueNow = span > 0 ? Math.round((sizeA / span) * 100) : 50

  const lit = active || hover

  const pillStyle: CSSProperties = isRow
    ? { top: cur?.pos ?? 0, width: 3, height: 56 }
    : { left: cur?.pos ?? 0, width: 56, height: 3 }

  return (
    <div
      role="separator"
      aria-orientation={isRow ? 'vertical' : 'horizontal'}
      // A focusable separator IS the splitter pattern: without a tabindex a
      // `role="separator"` is decorative furniture, and there is no keyboard way
      // to size a panel at all.
      tabIndex={0}
      aria-label={isRow ? 'Resize panels horizontally' : 'Resize panels vertically'}
      aria-valuenow={valueNow}
      aria-valuemin={0}
      aria-valuemax={100}
      onKeyDown={onKeyDown}
      onFocus={() => setHover(true)}
      onBlur={() => {
        setHover(false)
        if (!drag.current) setCur(null)
      }}
      // `bg-uikit-bg` is OCCLUSION HYGIENE, not decoration: a host may stack
      // another surface directly beneath this layout (see PanelLeaf's note), and
      // a transparent 10px seam would composite that surface's text through the
      // gap between panels. On a flat background it is pixel-identical to
      // leaving it transparent.
      className={cn(
        'relative flex-[0_0_auto] self-stretch flex items-center justify-center touch-none z-[1] bg-uikit-bg',
        'outline-none focus-visible:ring-2 focus-visible:ring-uikit-accent focus-visible:ring-inset',
        isRow ? 'w-[10px] cursor-col-resize' : 'h-[10px] cursor-row-resize',
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false)
        if (!drag.current) setCur(null)
      }}
    >
      {lit && (
        // Faint on hover; solid + the active token the moment it is grabbed
        // (darker than the rest in light theme, brighter in dark).
        <div
          className={cn(
            'absolute rounded-full pointer-events-none [transition:opacity_140ms_ease,background_140ms_ease]',
            isRow ? 'left-1/2 -translate-x-1/2 -translate-y-1/2' : 'top-1/2 -translate-x-1/2 -translate-y-1/2',
            active ? 'bg-uikit-handle-active opacity-100' : 'bg-uikit-handle opacity-70',
          )}
          style={pillStyle}
        />
      )}
    </div>
  )
}
