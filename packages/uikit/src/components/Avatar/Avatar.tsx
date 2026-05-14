import { cn } from '../../lib/utils'

export interface AvatarProps {
  /** Display name. Initials are derived automatically (first letter of the
   *  first two whitespace-separated words). */
  name: string
  /** Avatar size in px. Default 32. */
  size?: number
  /** Border radius in px. Default 3 (rounded-square, matches the design's
   *  org/personal flat avatars). Use a larger value or `size / 2` for a circle. */
  radius?: number
  className?: string
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map(s => s[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Avatar({ name, size = 32, radius = 3, className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center shrink-0 select-none',
        'text-uikit-ink font-uikit-ui font-semibold leading-none tracking-uikit-tighter opacity-90',
        className
      )}
      style={{
        // Dynamic, prop-driven values — kept inline:
        width: size,
        height: size,
        borderRadius: radius,
        fontSize: Math.round(size * 0.36),
        // The oklab-over-bg mix is unique to Avatar; not worth a theme token
        // for a single use site:
        background: 'color-mix(in oklab, var(--ink) 8%, var(--bg))',
      }}
    >
      {getInitials(name)}
    </span>
  )
}
