import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  /** Glyph size in px (default 12), or a CSS font-size. */
  size?: number | string
}

/** The shared Braille wait indicator. Labels stay static; only the glyph moves.
 * Decorative uses should pass aria-hidden and let the containing status speak. */
export function Spinner({ size = 12, className, style, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      data-spinner="braille"
      className={cn('uikit-spinner text-uikit-accent', className)}
      style={{ fontSize: size, ...style }}
      {...props}
    >
      <span className="uikit-spinner-frames" aria-hidden="true">{'⠋\n⠙\n⠹\n⠸\n⠼\n⠴\n⠦\n⠧\n⠇\n⠏'}</span>
    </span>
  )
}
