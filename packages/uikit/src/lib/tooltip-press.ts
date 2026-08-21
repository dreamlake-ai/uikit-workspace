/**
 * Tooltip state for a DRAGGABLE trigger — the graph canvases' node cards.
 *
 * A card is both a tooltip trigger and a drag handle, and the two fight: the
 * pointer sits still inside the card while you drag it, so a plain hover tooltip
 * opens on top of the thing you are moving. The native `title` these tooltips
 * replaced never did that (browsers drop a title tooltip on mousedown), so this
 * restores that behaviour: pressing dismisses the label, and it stays dismissed
 * until the pointer leaves and comes back.
 *
 * Spread `tooltip` onto `<Tooltip>` and `press` onto the trigger. The trigger's
 * own drag handlers go on the trigger too — floating-ui's `getReferenceProps`
 * composes them with its hover handlers, so nothing clobbers anything.
 */
import { useState } from 'react'

export interface TooltipPress {
  /** Controlled-open props for `<Tooltip>`. */
  tooltip: { open: boolean; onOpenChange: (next: boolean) => void }
  /** Press/leave handlers for the trigger, to merge with its own. */
  press: { onPointerDown: () => void; onPointerLeave: () => void }
}

export function useTooltipPress(): TooltipPress {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  return {
    tooltip: { open: hovered && !pressed, onOpenChange: setHovered },
    press: {
      onPointerDown: () => setPressed(true),
      // Cleared on leave (not on pointer-up) so a click that never leaves the
      // card doesn't pop the label straight back up.
      onPointerLeave: () => setPressed(false),
    },
  }
}
