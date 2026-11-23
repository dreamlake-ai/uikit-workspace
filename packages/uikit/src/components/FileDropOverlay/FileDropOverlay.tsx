import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { Upload } from 'lucide-react'

/** File drags only: never claim text selection, links, or an internal row move. */
export function isExternalFileDrag(transfer: DataTransfer) {
  return Array.from(transfer.types).includes('Files')
}

/** Attach to the exact drop surface. Contents remain mounted while dragging. */
export function useFileDropTarget({
  disabled = false,
  onFiles,
}: {
  disabled?: boolean
  onFiles: (files: File[], event: DragEvent<HTMLElement>) => void
}) {
  const [active, setActive] = useState(false)
  const depth = useRef(0)
  const reset = () => {
    depth.current = 0
    setActive(false)
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') reset()
    }
    window.addEventListener('dragend', reset)
    window.addEventListener('drop', reset)
    window.addEventListener('blur', reset)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('dragend', reset)
      window.removeEventListener('drop', reset)
      window.removeEventListener('blur', reset)
      window.removeEventListener('keydown', key)
    }
  }, [])
  useEffect(() => {
    if (disabled) reset()
  }, [disabled])
  return {
    active: active && !disabled,
    onDragEnter(event: DragEvent<HTMLElement>) {
      if (disabled || !isExternalFileDrag(event.dataTransfer)) return
      event.preventDefault()
      depth.current += 1
      setActive(true)
    },
    onDragOver(event: DragEvent<HTMLElement>) {
      if (disabled || !isExternalFileDrag(event.dataTransfer)) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
      setActive(true)
    },
    onDragLeave() {
      depth.current = Math.max(0, depth.current - 1)
      if (depth.current === 0) reset()
    },
    onDrop(event: DragEvent<HTMLElement>) {
      reset()
      if (disabled || !isExternalFileDrag(event.dataTransfer)) return
      event.preventDefault()
      event.stopPropagation()
      const files = Array.from(event.dataTransfer.files)
      onFiles(files, event)
    },
  }
}

/** Neutral hatch with a clear central prompt; bounds are the positioned parent. */
export function FileDropOverlay({
  active,
  title = 'Drop files here',
  description,
  compact = false,
}: {
  active: boolean
  title?: ReactNode
  description?: ReactNode
  compact?: boolean
}) {
  if (!active) return null
  return (
    <div
      className={`dl-file-drop-overlay${compact ? ' dl-file-drop-overlay--compact' : ''}`}
      data-file-drop-overlay=""
      role="status"
      aria-live="polite"
    >
      <div className="dl-file-drop-overlay-prompt">
        <Upload size={compact ? 16 : 24} aria-hidden />
        <strong>{title}</strong>
        {description && <span>{description}</span>}
      </div>
    </div>
  )
}
