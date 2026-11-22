import { useEffect, useRef, type PointerEvent } from 'react'

export interface PointerDragOptions<T extends Element> {
  /** Runs on press, held movement, and release. Hover never changes the value. */
  onDrag: (event: PointerEvent<T>) => void
  /** Return false to leave this gesture to another interaction (for example pan). */
  onStart?: (event: PointerEvent<T>) => void | false
  onEnd?: (event: PointerEvent<T>) => void
  onCancel?: () => void
  disabled?: boolean
}

/** A primary-pointer drag that survives leaving its surface. The host supplies
 * touch-action and its keyboard interaction; this hook only owns the pointer. */
export function usePointerDrag<T extends Element>(options: PointerDragOptions<T>) {
  const latest = useRef(options)
  latest.current = options
  const active = useRef<{ id: number; target: T } | null>(null)
  const release = () => {
    const drag = active.current
    active.current = null
    if (drag) {
      try {
        if (drag.target.hasPointerCapture?.(drag.id)) drag.target.releasePointerCapture(drag.id)
      } catch {
        /* The surface may have been removed during the gesture. */
      }
    }
    return drag
  }
  const cancel = () => {
    if (release()) latest.current.onCancel?.()
  }
  useEffect(() => {
    const blur = () => cancel()
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancel()
    }
    window.addEventListener('blur', blur)
    window.addEventListener('keydown', escape)
    return () => {
      window.removeEventListener('blur', blur)
      window.removeEventListener('keydown', escape)
      cancel()
    }
  }, [])
  useEffect(() => {
    if (options.disabled) cancel()
  }, [options.disabled])

  return {
    isDragging: () => active.current !== null,
    onPointerDown(event: PointerEvent<T>) {
      if (
        latest.current.disabled ||
        active.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.isPrimary === false
      )
        return
      if (latest.current.onStart?.(event) === false) return
      event.preventDefault()
      active.current = { id: event.pointerId, target: event.currentTarget }
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        /* Synthetic events. */
      }
      latest.current.onDrag(event)
    },
    onPointerMove(event: PointerEvent<T>) {
      if (active.current?.id !== event.pointerId) return
      if (latest.current.disabled || !(event.buttons & 1)) return cancel()
      event.preventDefault()
      latest.current.onDrag(event)
    },
    onPointerUp(event: PointerEvent<T>) {
      if (active.current?.id !== event.pointerId) return
      release()
      if (latest.current.disabled) return latest.current.onCancel?.()
      latest.current.onDrag(event)
      latest.current.onEnd?.(event)
    },
    onPointerCancel(event: PointerEvent<T>) {
      if (active.current?.id === event.pointerId) cancel()
    },
    onLostPointerCapture(event: PointerEvent<T>) {
      if (active.current?.id === event.pointerId) cancel()
    },
  }
}
