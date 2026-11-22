import { useState } from 'react'
import { usePointerDrag } from '@dreamlake/uikit'

export function DragSurfaceSpec() {
  const [time, setTime] = useState(0)
  const seek = (value: number) => setTime(Math.max(0, Math.min(30, value)))
  const { isDragging: _dragging, ...drag } = usePointerDrag<HTMLDivElement>({
    onDrag(event) {
      const { left, width } = event.currentTarget.getBoundingClientRect()
      if (width > 0) seek(((event.clientX - left) / width) * 30)
    },
  })
  return (
    <div>
      <div
        {...drag}
        role="slider"
        tabIndex={0}
        aria-label="Preview time"
        aria-valuemin={0}
        aria-valuemax={30}
        aria-valuenow={time}
        aria-valuetext={`${time.toFixed(1)} seconds`}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            seek(time - 1)
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            seek(time + 1)
          }
          if (event.key === 'Home') {
            event.preventDefault()
            seek(0)
          }
          if (event.key === 'End') {
            event.preventDefault()
            seek(30)
          }
        }}
        style={{
          height: 100,
          position: 'relative',
          background: 'var(--background-muted)',
          border: '1px solid currentColor',
          borderRadius: 8,
          touchAction: 'none',
          cursor: 'ew-resize',
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: `${(time / 30) * 100}%`,
            height: '100%',
            borderLeft: '2px solid currentColor',
          }}
        />
      </div>
      <p>
        Press and drag to seek: {time.toFixed(1)} / 30 seconds. Arrow keys step; Home and End jump.
      </p>
    </div>
  )
}
