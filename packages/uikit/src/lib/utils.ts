import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge needs to know about our custom `uikit-` prefixed utilities
 * and our line-height policy:
 *
 *   - `text-uikit-12` (font-size) + `text-uikit-muted` (color) would collapse
 *     by default because both share the `text-*` prefix. Fix: register our
 *     color utilities in the standard `text-color` group and put our
 *     font-sizes in a custom `uikit-font-size` group so they don't fight.
 *
 *   - tailwind-merge's default config says `font-size` invalidates `leading-*`
 *     (Tailwind's stock `text-base` bundles a default line-height). None of
 *     our utilities — neither `text-uikit-N` nor arbitrary `text-[Npx]` —
 *     bundle a line-height, so we disable that conflict globally.
 */
const twMerge = extendTailwindMerge({
  override: {
    // Standard `font-size` group (covers stock `text-base`, `text-[Npx]`, etc.)
    // no longer invalidates `leading-*`. Required so e.g. `text-[13.5px]`
    // and `leading-[1.2]` can coexist on Tag.
    conflictingClassGroups: {
      'font-size': [],
    },
  },
  extend: {
    classGroups: {
      // Custom group for our font-size scale. Only conflicts with itself.
      'uikit-font-size': [
        'text-uikit-9',
        'text-uikit-10',
        'text-uikit-11',
        'text-uikit-12',
        'text-uikit-13',
        'text-uikit-14',
        'text-uikit-17',
        'text-uikit-22',
      ],
      // Text color utilities — token aliases + alpha-mix presets.
      'text-color': [
        'text-uikit-ink',
        'text-uikit-muted',
        'text-uikit-bg',
        'text-uikit-panel',
        'text-uikit-rail',
        'text-uikit-accent',
        'text-uikit-accent-soft',
        'text-uikit-faint',
        'text-uikit-chip',
        'text-uikit-search',
        'text-uikit-selected',
        'text-uikit-danger',
        'text-uikit-ink-4',
        'text-uikit-ink-5',
        'text-uikit-ink-6',
        'text-uikit-ink-8',
        'text-uikit-ink-12',
        'text-uikit-ink-50',
        'text-uikit-accent-12',
        'text-uikit-danger-8',
      ],
    } as never,
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
