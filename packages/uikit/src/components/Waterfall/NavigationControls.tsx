import { ChevronLeft, ChevronRight } from 'lucide-react'
import { type MouseEvent } from 'react'

import { formatDuration } from './utils'

export interface NavigationControlsProps {
  viewDuration: number
  handlePan: (direction: 'left' | 'right') => void
  handleZoomDragStart: (e: MouseEvent) => void
}

export function NavigationControls({
  viewDuration,
  handlePan,
  handleZoomDragStart,
}: NavigationControlsProps) {
  return (
    <div className="sticky left-1/2 z-20 w-max">
      <div className="bg-uikit-panel/75 flex items-center gap-2 rounded-full p-1 text-sm shadow-uikit-soft backdrop-blur-[2px]">
        <button
          onClick={() => handlePan('left')}
          className="hover:bg-uikit-ink-5 rounded-full p-1"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span
          className="text-uikit-11 hover:bg-uikit-ink-5 w-24 cursor-col-resize rounded px-1 py-0.5 text-center font-uikit-mono transition-colors select-none"
          onMouseDown={handleZoomDragStart}
        >
          {formatDuration(viewDuration)}
        </span>
        <button
          onClick={() => handlePan('right')}
          className="hover:bg-uikit-ink-5 rounded-full p-1"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
