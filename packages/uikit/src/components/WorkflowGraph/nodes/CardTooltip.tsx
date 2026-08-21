/**
 * Tooltip wrapper for a workflow node card — the kit's Tooltip in place of the
 * native `title` these cards used to carry. A native tooltip is painted by the
 * OS in its own chrome, so it followed neither the canvas nor the theme; this is
 * the same Tooltip (and the same look) every other surface in the kit uses.
 *
 * The card's drag handlers are passed through HERE rather than left on the card:
 * floating-ui's `getReferenceProps` composes them with its own hover/focus
 * handlers, so dragging a card and hovering it can share one element. Leaving
 * `onPointerLeave` on the card would lose it — useHover owns that one.
 */
import type { PointerEvent as ReactPointerEvent, ReactElement } from 'react'
import { useTooltipPress } from '../../../lib/tooltip-press'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../Tooltip'

export interface CardTooltipProps {
  /** Label text. When absent the card renders with no tooltip (but still drags). */
  label?: string | null
  onPointerDown?: (e: ReactPointerEvent) => void
  onPointerMove?: (e: ReactPointerEvent) => void
  onPointerUp?: (e: ReactPointerEvent) => void
  children: ReactElement
}

export function CardTooltip({
  label, onPointerDown, onPointerMove, onPointerUp, children,
}: CardTooltipProps) {
  const tip = useTooltipPress()
  return (
    <Tooltip
      {...tip.tooltip}
      // Slower than the kit's 200ms default: cards sit shoulder to shoulder on a
      // canvas, and at 200ms crossing the graph fires a trail of labels.
      delayDuration={500}
      sideOffset={8}
    >
      <TooltipTrigger
        asChild
        {...tip.press}
        onPointerDown={(e: ReactPointerEvent) => { tip.press.onPointerDown(); onPointerDown?.(e) }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {children}
      </TooltipTrigger>
      {label ? <TooltipContent>{label}</TooltipContent> : null}
    </Tooltip>
  )
}
