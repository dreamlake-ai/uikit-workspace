import { type ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export type SkeletonProps = ComponentProps<'div'>

/**
 * Placeholder block shown while content loads. Render one per line/shape and
 * size it with width/height utilities (or inline style).
 *
 * Ported from the legacy `@vuer-ai/vuer-uikit` Skeleton with the same
 * `<div>` + `className` API; restyled to the DreamLake `--ink` 8% tint and the
 * kit's default radius.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-uikit-ink-8 rounded-uikit-badge animate-pulse', className)}
      {...props}
    />
  )
}
