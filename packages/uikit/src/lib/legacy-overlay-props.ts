/**
 * Legacy Radix-style props accepted on overlay *content* components
 * (DropdownMenuContent / PopoverContent / SelectContent / SubContent) for
 * drop-in parity with the old `@vuer-ai/vuer-uikit`.
 *
 * In this kit, positioning + dismissal are configured on the *root* component,
 * so these are absorbed (stripped before reaching the DOM) rather than wired.
 * `align`/`side`/`sideOffset` currently fall back to the root's defaults.
 */
export interface LegacyOverlayContentProps {
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  alignOffset?: number
  collisionPadding?: number | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  avoidCollisions?: boolean
  sticky?: 'partial' | 'always'
  forceMount?: boolean
  loop?: boolean
  /** Radix Select content positioning mode (`popper` | `item-aligned`). */
  position?: string
  onOpenAutoFocus?: (e: Event) => void
  onCloseAutoFocus?: (e: Event) => void
  onEscapeKeyDown?: (e: KeyboardEvent) => void
  onPointerDownOutside?: (e: Event) => void
  onInteractOutside?: (e: Event) => void
  onFocusOutside?: (e: Event) => void
}

const LEGACY_OVERLAY_KEYS = new Set<string>([
  'align',
  'side',
  'sideOffset',
  'alignOffset',
  'collisionPadding',
  'avoidCollisions',
  'sticky',
  'forceMount',
  'loop',
  'position',
  'onOpenAutoFocus',
  'onCloseAutoFocus',
  'onEscapeKeyDown',
  'onPointerDownOutside',
  'onInteractOutside',
  'onFocusOutside',
])

/** Removes the legacy overlay-content props so they don't reach the DOM. */
export function stripLegacyOverlayProps<T extends Record<string, unknown>>(props: T): T {
  const out: Record<string, unknown> = {}
  for (const k in props) if (!LEGACY_OVERLAY_KEYS.has(k)) out[k] = props[k]
  return out as T
}
