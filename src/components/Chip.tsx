// Chip — small mono pill used for filter pills, breadcrumb segments,
// attribute markers, and status-tinted labels. Six tones map onto the
// shared semantic palette from `staging/design.md` (cross-page, never
// promoted to a token).
//
// API (kept minimal so this can graduate to `@dreamlake/uikit` cleanly):
//   <Chip>pipeline:classify</Chip>           — neutral
//   <Chip tone="ok">passed</Chip>             — status-tinted
//   <Chip tone="error" icon={<Glyph />}>err</Chip>
//
// Per the design.md "no `--ok` token" rule, the 5 tinted hexes are
// inlined in `TONE_HEX` below — no `--ok` / `--error` CSS variables.
// `neutral` reuses the page's `--color-faint` border + `--color-ink`
// text and intentionally has no tinted background.

import type { ReactNode } from 'react'

export type ChipTone = 'neutral' | 'accent' | 'ok' | 'warn' | 'error' | 'muted'

export type ChipProps = {
  children: ReactNode
  tone?: ChipTone
  /** Optional leading glyph (icon, dot, mono character). */
  icon?: ReactNode
}

// Cross-page semantic palette — see staging/design.md §"Semantic
// palette". These five hexes never become CSS variables; they live
// inline at every use site so `grep '#23aaff'` etc. tells the truth
// about which buckets a page touches.
const TONE_HEX: Record<Exclude<ChipTone, 'neutral'>, string> = {
  accent: '#23aaff',
  ok: '#1f8f4a',
  warn: '#c0922e',
  error: '#c8513b',
  muted: '#9c907a',
}

// Mono 10.5px / 500 / +0.04em tracking + 4px×10px padding + radius 8
// match the prototype's `.chip` rule in `staging/dreamlake-design-guide.html`.
const baseCx =
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ' +
  'font-mono text-[10.5px] font-medium tracking-[0.04em] leading-none ' +
  'border whitespace-nowrap align-middle'

// Neutral tone uses theme tokens directly. The legacy guide's `.chip`
// reads as muted at rest; we promote the text to ink (matching the
// guide's `.chip.act`) since we don't carry a separate `act` variant —
// status tinting is the new way to signal emphasis.
const neutralCx = 'bg-panel border-faint text-ink'

export const Chip = ({ children, tone = 'neutral', icon }: ChipProps) => {
  const inline =
    tone === 'neutral'
      ? undefined
      : ({
          background: `color-mix(in srgb, ${TONE_HEX[tone]} 12%, var(--color-bg))`,
          borderColor: TONE_HEX[tone],
          color: TONE_HEX[tone],
        } satisfies React.CSSProperties)

  return (
    <span className={`${baseCx} ${tone === 'neutral' ? neutralCx : ''}`} style={inline}>
      {icon && (
        <span aria-hidden="true" className="inline-flex items-center opacity-80">
          {icon}
        </span>
      )}
      {children}
    </span>
  )
}
