import { Magnet } from 'lucide-react'
import { type HTMLProps } from 'react'

import { cn } from '../../lib/utils'

export interface TimelineCursorProps extends HTMLProps<HTMLDivElement> {
  /** Position as percentage (0-100) */
  left?: number
  /** Label text to display */
  label?: string
  /** Cursor color */
  color?: string
  /** Whether to show the readout tooltip */
  showReadout?: boolean
  /** Whether to show magnet icon (only when showReadout is true) */
  showMagnet?: boolean
  /** Readout variant - 'active' for interactive cursors, 'static' for fixed markers */
  variant?: 'active' | 'static'
  /** Additional CSS classes */
  className?: string
  /** Z-index override */
  zIndex?: number
}

/**
 * Simple timeline cursor — a vertical line with an optional time readout.
 */
export function CursorOverlay({
  left = 0,
  label,
  color,
  showReadout = false,
  showMagnet = false,
  variant = 'active',
  zIndex = 20,
}: TimelineCursorProps) {
  const leftValue = `${left}%`

  // Default colors based on variant
  const lineColor = color || (variant === 'active' ? 'var(--tone-red)' : 'var(--uikit-muted)')

  return (
    <>
      {/* Cursor Line */}
      <div
        className="pointer-events-none absolute top-0 z-75 h-full w-px"
        style={{
          left: leftValue,
          backgroundColor: lineColor,
          zIndex,
        }}
      />

      {/* Readout Tooltip */}
      {showReadout && (
        <div
          className={cn(
            'absolute top-1',
            'flex items-center justify-center',
            variant === 'active' ? 'pointer-events-none' : 'pointer-events-auto',
            'px-2 py-0.5',
            'text-uikit-11 z-80',
            'border-uikit-faint/50',
            variant === 'active' && ['bg-uikit-panel rounded-md border', 'shadow-uikit-soft'],
            variant === 'static' && [
              'bg-uikit-ink-5 backdrop-blur-sm',
              'rounded-md',
              'text-uikit-muted',
            ],
          )}
          style={{
            left: leftValue,
            transform: 'translateX(-50%)',
            minWidth: '11ch',
            zIndex,
          }}
        >
          {showMagnet && <Magnet className="text-uikit-muted mr-1.5 size-3 transition-opacity" />}
          <span className="font-uikit-mono tabular-nums">{label}</span>
        </div>
      )}
    </>
  )
}
