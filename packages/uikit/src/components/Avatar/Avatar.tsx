import { useState } from 'react'
import { cn } from '../../lib/utils'

export interface AvatarProps {
  /** Display name. Initials are derived automatically (first letter of the
   *  first two whitespace-separated words). */
  name: string
  /** Avatar image URL. Falls back to initials when absent or it fails to load. */
  image?: string
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

export function Avatar({ name, image, size = 32, radius = 3, className }: AvatarProps) {
  // Track the src that failed so switching to a new URL re-enables the image.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = !!image && failedSrc !== image

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center shrink-0 select-none overflow-hidden',
        !showImage &&
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
        // for a single use site. Skipped behind an image so it doesn't show
        // through transparent PNGs.
        background: showImage ? undefined : 'color-mix(in oklab, var(--ink) 8%, var(--bg))',
      }}
    >
      {showImage ? (
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setFailedSrc(image!)}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  )
}
