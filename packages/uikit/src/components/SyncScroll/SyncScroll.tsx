import {
  type HTMLProps,
  type ReactElement,
  type RefObject,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useScrollSlave, useSyncDrag, useSyncScroll } from './useSyncScroll'
import { cn } from '../../lib/utils'

export type SyncScrollProps = HTMLProps<HTMLDivElement> & {
  asChild?: boolean
}

/** Renders the single child, merging ref/className/props. */
function Slot({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) {
  if (isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>
    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      ...props,
      className: cn(props.className as string | undefined, child.props.className),
    })
  }
  return <>{children}</>
}

export const SyncScroll = ({ children, className, asChild = false, ...props }: SyncScrollProps) => {
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp ref={useSyncScroll() as never} className={cn('overflow-y-auto', className)} {...props}>
      {children}
    </Comp>
  )
}

export const SyncScrollSlave = ({ children, className, asChild = false, ...props }: SyncScrollProps) => {
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp ref={useScrollSlave() as never} className={cn('overflow-y-auto', className)} {...props}>
      {children}
    </Comp>
  )
}

function useDragHandlers(ref: RefObject<HTMLDivElement | null>, axis: 'x' | 'y' | 'both') {
  const [isDragging, setIsDragging] = useState(false)
  const start = useRef({ x: 0, y: 0, left: 0, top: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const onDown = (e: MouseEvent) => {
      setIsDragging(true)
      start.current = { x: e.clientX, y: e.clientY, left: element.scrollLeft, top: element.scrollTop }
      e.preventDefault()
    }
    const onMove = (e: MouseEvent) => {
      if (!isDragging || !element) return
      if (axis === 'x' || axis === 'both') element.scrollLeft = start.current.left - (e.clientX - start.current.x) * 2
      if (axis === 'y' || axis === 'both') element.scrollTop = start.current.top - (e.clientY - start.current.y) * 2
    }
    const onUp = () => setIsDragging(false)
    element.addEventListener('mousedown', onDown)
    if (isDragging) {
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      document.addEventListener('mouseleave', onUp)
    }
    return () => {
      element.removeEventListener('mousedown', onDown)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('mouseleave', onUp)
    }
  }, [isDragging, ref, axis])

  return isDragging
}

export const SyncDrag = ({ ref: extRef, children, className, asChild = false, ...props }: SyncScrollProps) => {
  const ref = useSyncDrag({ ref: extRef as RefObject<HTMLDivElement>, axis: 'both' })
  const isDragging = useDragHandlers(ref, 'both')
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp
      ref={ref as never}
      className={cn('cursor-grab overflow-auto', isDragging && 'cursor-grabbing', className)}
      style={{ userSelect: isDragging ? 'none' : 'auto', ...props.style }}
      {...props}
    >
      {children}
    </Comp>
  )
}

export const SyncDragX = ({ children, className, asChild = false, ...props }: SyncScrollProps) => {
  const ref = useSyncDrag({ axis: 'horizontal' })
  const isDragging = useDragHandlers(ref, 'x')
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp
      ref={ref as never}
      className={cn('cursor-grab overflow-x-auto', isDragging ? 'cursor-grabbing' : '', className)}
      style={{ userSelect: isDragging ? 'none' : 'auto', ...props.style }}
      {...props}
    >
      {children}
    </Comp>
  )
}

export const SyncDragSlave = ({ ref: extRef, children, className, asChild = false, ...props }: SyncScrollProps) => {
  const ref = useScrollSlave({ ref: extRef as RefObject<HTMLDivElement>, axis: 'both' })
  const isDragging = useDragHandlers(ref, 'both')
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp
      ref={ref as never}
      className={cn('cursor-grab overflow-auto', isDragging && 'cursor-grabbing', className)}
      style={{ userSelect: isDragging ? 'none' : 'auto', ...props.style }}
      {...props}
    >
      {children}
    </Comp>
  )
}

export const SyncDragSlaveX = ({ ref: extRef, children, className, asChild = false, ...props }: SyncScrollProps) => {
  const ref = useScrollSlave({ ref: extRef as RefObject<HTMLDivElement>, axis: 'horizontal' })
  const isDragging = useDragHandlers(ref, 'x')
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp
      ref={ref as never}
      className={cn('cursor-grab overflow-x-auto overflow-y-hidden', isDragging && 'cursor-grabbing', className)}
      style={{ userSelect: isDragging ? 'none' : 'auto', ...props.style }}
      {...props}
    >
      {children}
    </Comp>
  )
}

export const SyncDragY = ({ ref: extRef, children, className, asChild = false, ...props }: SyncScrollProps) => {
  const ref = useSyncDrag({ ref: extRef as RefObject<HTMLDivElement>, axis: 'vertical' })
  const isDragging = useDragHandlers(ref, 'y')
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp
      ref={ref as never}
      className={cn('cursor-grab overflow-x-hidden overflow-y-auto', isDragging && 'cursor-grabbing', className)}
      style={{ userSelect: isDragging ? 'none' : 'auto', ...props.style }}
      {...props}
    >
      {children}
    </Comp>
  )
}
