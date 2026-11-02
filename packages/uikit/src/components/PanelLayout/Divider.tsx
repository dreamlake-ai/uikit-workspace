import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { cn } from '../../lib/utils'
import { startResizeDrag } from '../../lib/resize-drag'
import { DIVIDER_PX, resizeSplit } from './panel-box'
import { usePanelConfig } from './config'
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
  const drag = useRef<{
    start: number
    containerPx: number
    a: number
    b: number
    /** The boundary as last applied to the DOM during this drag — what the
     *  release commits. Unset until the pointer has actually moved. */
    live: { a: number; b: number } | null
  } | null>(null)

  const stopRef = useRef<(() => void) | null>(null)
  useEffect(() => () => stopRef.current?.(), [])

  const isRow = dir === 'row'
  const { dividerPx = DIVIDER_PX } = usePanelConfig()

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Only a primary-button drag resizes; a right-click or middle-click must not
    // arm one (it would never get its matching pointerup and would stick).
    if (e.button !== 0 || drag.current) return
    e.preventDefault()
    const parent = e.currentTarget.parentElement
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    // The two flex children this bar sits between. A split renders its
    // children and dividers interleaved — child, divider, child, divider,
    // child — so child i is the parent's element 2i.
    const siblings = Array.from(parent.children) as HTMLElement[]
    const before = siblings[index * 2]
    const after = siblings[index * 2 + 2]
    drag.current = {
      start: isRow ? e.clientX : e.clientY,
      containerPx: isRow ? rect.width : rect.height,
      a: sizeA,
      b: sizeB,
      live: null,
    }
    setActive(true)
    const target = e.currentTarget
    // The bar slides along the drag axis but its extent along the OTHER axis
    // — the one the pill rides — holds still, so it is measured once here.
    // Measuring it on every move forced a layout in the middle of each frame,
    // on top of the one the frame ends with.
    const bar = target.getBoundingClientRect()
    const updatePill = (point: { clientX: number; clientY: number }) => {
      setCur({ pos: isRow ? point.clientY - bar.top : point.clientX - bar.left,
        len: isRow ? bar.height : bar.width })
    }
    updatePill(e)
    stopRef.current = startResizeDrag(target, e, isRow ? 'col-resize' : 'row-resize', point => {
      const d = drag.current
      if (!d) return
      const { a, b } = resizeSplit({ containerPx: d.containerPx, childCount,
        deltaPx: (isRow ? point.clientX : point.clientY) - d.start,
        a: d.a, b: d.b, minPx: MIN_PX, dividerPx })
      // Per frame the boundary moves in the DOM alone: the two children get
      // their flex-grow written directly, and the tree is committed ONCE, on
      // release. Committing every frame re-rendered the whole layout and
      // every view hosted in it for each pointer move — the host's
      // `onChange`, `PersistentPanels`' measuring effect, all of it. The
      // persistent surfaces still follow, since they observe the slots'
      // sizes rather than the tree; `--panel-x` / `--panel-w` catch up at
      // release, when the committed ratios rebuild them.
      d.live = { a, b }
      if (before) before.style.flexGrow = String(a)
      if (after) after.style.flexGrow = String(b)
      updatePill(point)
    }, () => {
      const d = drag.current
      drag.current = null
      stopRef.current = null
      setActive(false)
      if (!hoverRef.current) setCur(null)
      if (d?.live) onResizeRef.current(splitId, index, d.live.a, d.live.b)
    })
  }

  // Hover tracks locally. During a gesture the captured pointer and native
  // window listener own movement, even when the boundary trails the pointer.
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    setCur({
      pos: isRow ? e.clientY - rect.top : e.clientX - rect.left,
      len: isRow ? rect.height : rect.width,
    })
  }

  // Keep the live callback and hover flag readable from the window listeners
  // without re-subscribing them on every render.
  const onResizeRef = useRef(onResize)
  onResizeRef.current = onResize
  const hoverRef = useRef(hover)
  hoverRef.current = hover

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
      dividerPx,
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
    ? { top: cur?.pos ?? 0, width: 5, height: 56 }
    : { left: cur?.pos ?? 0, width: 56, height: 5 }

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
        isRow ? 'cursor-col-resize' : 'cursor-row-resize',
      )}
      // The thickness is the layout's `dividerPx`, the same value its geometry
      // (panel-box.ts) subtracts for every divider.
      style={isRow ? { width: dividerPx } : { height: dividerPx }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false)
        if (!drag.current) setCur(null)
      }}
    >
      {dividerPx < DIVIDER_PX && (
        // A divider thinner than the default keeps the default's grab area,
        // centred on the seam over the panels' edges.
        <span
          aria-hidden
          className="absolute"
          style={isRow
            ? { top: 0, bottom: 0, left: (dividerPx - DIVIDER_PX) / 2, right: (dividerPx - DIVIDER_PX) / 2 }
            : { left: 0, right: 0, top: (dividerPx - DIVIDER_PX) / 2, bottom: (dividerPx - DIVIDER_PX) / 2 }}
        />
      )}
      {lit && (
        // A quiet grey hint on hover (`--uikit-handle`, no extra opacity: the
        // token IS the hover tone); one step stronger the moment it is grabbed
        // (`--uikit-handle-active`). Neither goes near ink — a near-black (or,
        // in dark, white) pill read as a heavier control than a seam should be.
        <div
          className={cn(
            'uikit-grip-pill absolute [transition:opacity_140ms_ease,box-shadow_140ms_ease]',
            isRow ? 'left-1/2 -translate-x-1/2 -translate-y-1/2' : 'top-1/2 -translate-x-1/2 -translate-y-1/2',
          )}
          data-grip={active ? 'active' : 'hover'}
          style={pillStyle}
        />
      )}
    </div>
  )
}
