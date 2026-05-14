import { useState, useCallback, useEffect, useRef } from 'react'
import { cn } from '../../lib/utils'

interface ResizeDividerProps {
  axis: 'x' | 'y'
  onResize: (delta: number) => void
  onResizeStart?: () => void
  onResizeEnd?: () => void
  className?: string
  /** Hide the accent line entirely. */
  hideCapsule?: boolean
  /** Width (horizontal) or height (vertical) of the hit area in px. Default 24. */
  size?: number
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
  const [isDragging, setIsDragging] = useState(false)
  const startRef = useRef(0)
  const onResizeRef = useRef(onResize)
  const onResizeStartRef = useRef(onResizeStart)
  const onResizeEndRef = useRef(onResizeEnd)

  useEffect(() => {
    onResizeRef.current = onResize
    onResizeStartRef.current = onResizeStart
    onResizeEndRef.current = onResizeEnd
  }, [onResize, onResizeStart, onResizeEnd])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      startRef.current = axis === 'x' ? e.clientX : e.clientY
      onResizeStartRef.current?.()
    },
    [axis],
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const current = axis === 'x' ? e.clientX : e.clientY
      const delta = current - startRef.current
      startRef.current = current
      onResizeRef.current(delta)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      onResizeEndRef.current?.()
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, axis])

  const isHorizontal = axis === 'x'

  return (
    <div
      className={cn(
        'group/divider relative flex items-center justify-center shrink-0',
        isHorizontal ? 'cursor-col-resize h-full' : 'cursor-row-resize w-full',
        className,
      )}
      style={isHorizontal ? { width: size } : { height: size }}
      onMouseDown={handleMouseDown}
      data-dragging={isDragging || undefined}
    >
      {!hideCapsule && (
        <div
          aria-hidden
          className={cn(
            'absolute pointer-events-none bg-uikit-accent',
            'opacity-0 transition-opacity duration-[140ms]',
            // Reveal on hover OR while dragging.
            'group-hover/divider:opacity-85',
            'group-data-[dragging]/divider:opacity-85',
            isHorizontal
              ? 'top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px]'
              : 'left-0 right-0 top-1/2 -translate-y-1/2 h-[2px]',
          )}
        />
      )}
    </div>
  )
}
