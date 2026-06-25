import { type SVGProps } from 'react'
import { cn } from '../../lib/utils'

export interface SpinnerProps extends SVGProps<SVGSVGElement> {
  /** Diameter in px. Default 24. */
  size?: number
}

/**
 * Indeterminate loading spinner — a dual dot-pulse ring drawn with two
 * out-of-phase expanding circles. Stroke is `currentColor`, so it inherits
 * text color; the base class tints it muted, and any `text-*` class passed
 * via `className` overrides it (tailwind-merge keeps the last one).
 *
 * Ported from the legacy `@vuer-ai/vuer-uikit` Spinner to keep a drop-in API
 * (`size` + native SVG props), restyled only to default to the DreamLake
 * `--muted` token instead of raw `currentColor`.
 */
export function Spinner({ size = 24, className, ...props }: SpinnerProps) {
  return (
    <svg
      height={size}
      width={size}
      stroke="currentColor"
      viewBox="0 0 44 44"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-uikit-muted', className)}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <title>Loading…</title>
      <g fill="none" fillRule="evenodd" strokeWidth="2">
        <circle cx="22" cy="22" r="1">
          <animate
            attributeName="r"
            begin="0s"
            calcMode="spline"
            dur="1.8s"
            keySplines="0.165, 0.84, 0.44, 1"
            keyTimes="0; 1"
            repeatCount="indefinite"
            values="1; 20"
          />
          <animate
            attributeName="stroke-opacity"
            begin="0s"
            calcMode="spline"
            dur="1.8s"
            keySplines="0.3, 0.61, 0.355, 1"
            keyTimes="0; 1"
            repeatCount="indefinite"
            values="1; 0"
          />
        </circle>
        <circle cx="22" cy="22" r="1">
          <animate
            attributeName="r"
            begin="-0.9s"
            calcMode="spline"
            dur="1.8s"
            keySplines="0.165, 0.84, 0.44, 1"
            keyTimes="0; 1"
            repeatCount="indefinite"
            values="1; 20"
          />
          <animate
            attributeName="stroke-opacity"
            begin="-0.9s"
            calcMode="spline"
            dur="1.8s"
            keySplines="0.3, 0.61, 0.355, 1"
            keyTimes="0; 1"
            repeatCount="indefinite"
            values="1; 0"
          />
        </circle>
      </g>
    </svg>
  )
}
