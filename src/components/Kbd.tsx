// Kbd — keyboard hint atom. A small mono pill shaped like a single
// key cap, used inline within copy ("press ⌘ K to open the palette")
// or stacked into a vim-style help overlay.
//
// API (kept minimal so this can graduate to `@dreamlake/uikit` cleanly):
//   <Kbd>⌘</Kbd>                              — single key
//   <KbdCombo combo="⌘ K" description="open palette" />
//   <KbdCombo combo="esc" description="close" placement="trailing" />
//
// `KbdCombo` splits the `combo` string on whitespace and renders each
// token through `<Kbd>`. `placement` controls whether the keys come
// before the description (leading, the default — reads as "⌘ K open
// palette") or after (trailing — reads as "close · esc").

import type { ReactNode } from 'react'

// Mono 10px / 600 / 5% ink fill + 1px faint border + 4px radius —
// matches the `kbd, .kbd` rule in `staging/dreamlake-design-guide.html`
// (line 763) and the existing inline kbd in TypeSpecimen.tsx.
const kbdCx =
  'font-mono font-semibold text-[10px] text-ink/90 ' +
  'bg-[color-mix(in_oklab,var(--color-ink)_5%,transparent)] ' +
  'border border-faint rounded-[4px] px-1.5 py-0.5'

export const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className={kbdCx}>{children}</kbd>
)

// Compound helper for a key combo + descriptive label. `combo` is a
// space-separated key string ("⌘ K", "ctrl shift p", "esc"); each
// token becomes its own <Kbd> so multi-key chords render as adjacent
// pills with the visual gap between them.
export type KbdComboProps = {
  combo: string
  description?: string
  /** `leading` renders keys first (⌘ K  open palette);
   *  `trailing` renders the description first (close · esc). */
  placement?: 'leading' | 'trailing'
}

const descCx = 'font-ui text-[12px] text-muted'

export const KbdCombo = ({
  combo,
  description,
  placement = 'leading',
}: KbdComboProps) => {
  const keys = combo.split(/\s+/).filter(Boolean)
  const keysNode = (
    <span className="inline-flex items-center gap-1.5 align-middle">
      {keys.map((k, i) => (
        <Kbd key={`${k}-${i}`}>{k}</Kbd>
      ))}
    </span>
  )
  const descNode = description ? <span className={descCx}>{description}</span> : null

  return (
    <span className="inline-flex items-center gap-2 align-middle">
      {placement === 'leading' ? (
        <>
          {keysNode}
          {descNode}
        </>
      ) : (
        <>
          {descNode}
          {keysNode}
        </>
      )}
    </span>
  )
}
