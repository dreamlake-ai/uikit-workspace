import { useState, useCallback, useEffect, useRef } from 'react'
import { cn } from '../../lib/utils'

interface ResizeDividerProps {
  axis: 'x' | 'y'
  onResize: (delta: number) => void
  onResizeStart?: () => void
  onResizeEnd?: () => void
  className?: string
  /** Hide the pill entirely (keep the hit area). */
  hideCapsule?: boolean
  /** Width (axis='x') or height (axis='y') of the hit area in px. Default 24. */
  size?: number
}

/**
 * Cursor-following frosted pill — the resize affordance follows the cursor
 * along the long axis instead of sitting fixed at the divider's midpoint.
 * On leave, the pill drifts ~20px past the cursor's exit point, springs
 * back, then fades out (a small "trailing" gesture from the source design).
 *
 * Visual: translucent white pill, identical in light + dark themes, with a
 * hairline + ambient shadow and a frosted backdrop blur. Width animates
 * 0 → 5px on hover/drag so the resting state is invisible.
 */
const PILL_THICKNESS = 5
const PILL_LENGTH = 56
const DRIFT_PX = 20
const DRIFT_MS = 180
const RECOIL_MS = 320
const FADE_TAIL_MS = 40

interface LeaveAnim {
  pos: number
  phase: 'drift' | 'recoil'
}

export function ResizeDivider({
  axis,
  onResize,
  onResizeStart,
  onResizeEnd,
  className,
  hideCapsule,
  size = 24,
}: ResizeDividerProps) {
  const isHorizontal = axis === 'x'

  const [dragging, setDragging] = useState(false)
  const [hover, setHover] = useState(false)
  // Cursor position along the long axis (Y for horizontal divider, X for vertical).
  const [cursorPos, setCursorPos] = useState<number | null>(null)
  const [leaveAnim, setLeaveAnim] = useState<LeaveAnim | null>(null)

  const hostRef = useRef<HTMLDivElement>(null)
  const startRef = useRef(0)
  const lastPosRef = useRef<number | null>(null)
  const prevPosRef = useRef<number | null>(null)
  const leaveTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  const onResizeRef = useRef(onResize)
  const onResizeStartRef = useRef(onResizeStart)
  const onResizeEndRef = useRef(onResizeEnd)
  useEffect(() => {
    onResizeRef.current = onResize
    onResizeStartRef.current = onResizeStart
    onResizeEndRef.current = onResizeEnd
  }, [onResize, onResizeStart, onResizeEnd])

  const clearLeaveTimers = () => {
    leaveTimers.current.forEach(clearTimeout)
    leaveTimers.current = []
  }

  // Read the cursor's coordinate along the divider's long axis, relative to
  // the host's bounding box.
  const readPos = (e: { clientX: number; clientY: number }): number | null => {
    const host = hostRef.current
    if (!host) return null
    const r = host.getBoundingClientRect()
    return isHorizontal ? e.clientY - r.top : e.clientX - r.left
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setDragging(true)
      startRef.current = isHorizontal ? e.clientX : e.clientY
      onResizeStartRef.current?.()
    },
    [isHorizontal],
  )

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      e.preventDefault()
      const current = isHorizontal ? e.clientX : e.clientY
      const delta = current - startRef.current
      startRef.current = current
      onResizeRef.current(delta)
      // Track the cursor along the long axis so the pill follows during drag.
      const pos = readPos(e)
      if (pos != null) {
        prevPosRef.current = lastPosRef.current
        lastPosRef.current = pos
        setCursorPos(pos)
      }
    }
    const onUp = () => {
      setDragging(false)
      onResizeEndRef.current?.()
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, isHorizontal])

  const handleMouseEnter = (e: React.MouseEvent) => {
    clearLeaveTimers()
    setLeaveAnim(null)
    setHover(true)
    const pos = readPos(e)
    if (pos != null) {
      prevPosRef.current = pos
      lastPosRef.current = pos
      setCursorPos(pos)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    // Only react when we own cursor (hover or drag); useEffect handles drag.
    if (!hover) return
    const pos = readPos(e)
    if (pos == null) return
    prevPosRef.current = lastPosRef.current
    lastPosRef.current = pos
    setCursorPos(pos)
  }

  const handleMouseLeave = () => {
    setHover(false)
    const last = lastPosRef.current
    const prev = prevPosRef.current
    const host = hostRef.current
    if (last == null || !host) return

    // Exit direction from last two samples — default to "+" if no signal.
    let dir = 1
    if (prev != null) {
      const d = last - prev
      if (Math.abs(d) > 0.5) dir = d > 0 ? 1 : -1
    }
    const r = host.getBoundingClientRect()
    const axisLen = isHorizontal ? r.height : r.width
    const peak = clampPill(last - PILL_LENGTH / 2 + dir * DRIFT_PX, axisLen)
    const settle = clampPill(last - PILL_LENGTH / 2, axisLen)

    // Phase 1: drift past the exit point.
    setLeaveAnim({ pos: peak, phase: 'drift' })
    // Phase 2: recoil back to the exit point.
    const t1 = setTimeout(() => {
      setLeaveAnim({ pos: settle, phase: 'recoil' })
    }, DRIFT_MS)
    // Phase 3: clear (width + opacity fade via the resting transition).
    const t2 = setTimeout(() => {
      setLeaveAnim(null)
    }, DRIFT_MS + RECOIL_MS + FADE_TAIL_MS)
    leaveTimers.current.push(t1, t2)
  }

  useEffect(() => () => clearLeaveTimers(), [])

  const lit = hover || dragging

  // Where to draw the pill along the long axis. While lit, follow the
  // cursor; during leave-anim, use the scripted position; otherwise the
  // pill is collapsed so position doesn't matter.
  let pillOffset: number | null = null
  const host = hostRef.current
  if (host) {
    const r = host.getBoundingClientRect()
    const axisLen = isHorizontal ? r.height : r.width
    if (lit && cursorPos != null) {
      pillOffset = clampPill(cursorPos - PILL_LENGTH / 2, axisLen)
    } else if (leaveAnim) {
      pillOffset = leaveAnim.pos
    }
  }

  const pillVisible = lit || !!leaveAnim
  const pillTransition = lit
    ? // While hover/drag: instant position tracking, only width animates.
      `width 140ms ease, opacity 140ms ease`
    : leaveAnim
      ? leaveAnim.phase === 'drift'
        ? `${isHorizontal ? 'top' : 'left'} ${DRIFT_MS}ms cubic-bezier(.22,1,.36,1), width 200ms ease, opacity 200ms ease`
        : `${isHorizontal ? 'top' : 'left'} ${RECOIL_MS}ms cubic-bezier(.34,1.25,.64,1), width 200ms ease, opacity 200ms ease`
      : `width 200ms ease, opacity 200ms ease`

  return (
    <div
      ref={hostRef}
      className={cn(
        'group/divider relative flex items-center justify-center shrink-0',
        isHorizontal ? 'cursor-col-resize h-full' : 'cursor-row-resize w-full',
        className,
      )}
      style={isHorizontal ? { width: size } : { height: size }}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-dragging={dragging || undefined}
    >
      {!hideCapsule && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            // Centered on the short axis; following cursor on the long axis.
            ...(isHorizontal
              ? {
                  left: '50%',
                  transform: 'translateX(-50%)',
                  top: pillOffset != null ? `${pillOffset}px` : '50%',
                  marginTop: pillOffset != null ? 0 : `-${PILL_LENGTH / 2}px`,
                  width: pillVisible ? PILL_THICKNESS : 0,
                  height: PILL_LENGTH,
                }
              : {
                  top: '50%',
                  transform: 'translateY(-50%)',
                  left: pillOffset != null ? `${pillOffset}px` : '50%',
                  marginLeft: pillOffset != null ? 0 : `-${PILL_LENGTH / 2}px`,
                  height: pillVisible ? PILL_THICKNESS : 0,
                  width: PILL_LENGTH,
                }),
            borderRadius: 9999,
            background: 'rgba(255,255,255,0.65)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 2px 10px rgba(0,0,0,0.22)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            opacity: pillVisible ? 1 : 0,
            transition: pillTransition,
            pointerEvents: 'none',
            willChange: 'transform, top, left, width, height, opacity',
          }}
        />
      )}
    </div>
  )
}

function clampPill(raw: number, axisLen: number): number {
  return Math.max(0, Math.min(axisLen - PILL_LENGTH, raw))
}
