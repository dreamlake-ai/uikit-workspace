import type { RefObject } from 'react'
import type { FloatingContext } from '@floating-ui/react'

type Side = 'top' | 'right' | 'bottom' | 'left'

/** The shared UIKit wedge. Coordinates come from Floating UI after flip/shift. */
export function OverlayArrow({ arrowRef, context }: {
  arrowRef: RefObject<HTMLSpanElement | null>
  context: FloatingContext
}) {
  const side = context.placement.split('-')[0] as Side
  const edge = {
    top: { bottom: -0.5, borderBottom: '1px solid var(--faint)', borderRight: '1px solid var(--faint)', borderBottomRightRadius: 2, translate: '0 50%' },
    bottom: { top: -0.5, borderTop: '1px solid var(--faint)', borderLeft: '1px solid var(--faint)', borderTopLeftRadius: 2, translate: '0 -50%' },
    left: { right: -0.5, borderTop: '1px solid var(--faint)', borderRight: '1px solid var(--faint)', borderTopRightRadius: 2, translate: '50% 0' },
    right: { left: -0.5, borderBottom: '1px solid var(--faint)', borderLeft: '1px solid var(--faint)', borderBottomLeftRadius: 2, translate: '-50% 0' },
  }[side]
  return <span ref={arrowRef} aria-hidden="true" data-uikit-overlay-arrow="" data-side={side}
    style={{ position: 'absolute', width: 7, height: 7,
      left: context.middlewareData.arrow?.x, top: context.middlewareData.arrow?.y,
      ...edge, transform: 'rotate(45deg)', background: 'inherit', pointerEvents: 'none' }} />
}
