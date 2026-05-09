// Avatar — tinted-ink monogram square. Ports `.av` from
// staging/dreamlake-design-guide.html (`#lab-avatar`).
//
// One avatar atom; two kinds:
//
//   user — square with a 4px radius, lighter ~10% ink fill
//   org  — square with a 2px radius, heavier ~14% ink fill
//
// Important: there is NO hue per user. Every avatar uses the same
// `--color-ink` paint at a low alpha so the page palette stays
// disciplined — the only signal a viewer reads off an avatar is the
// monogram itself, plus (for org) a slightly heavier ink weight.
//
// Sizing follows the four call sites the design-guide ships:
//
//   20 — row (compact rows · table cells)
//   26 — nav-foot (default · sidebar identity)
//   32 — row primary (header rows · list leads)
//   48 — hero (profile / settings hero)
//
// The mono label inside is sized to ~40% of the box (e.g. 26 → ~10.5px,
// 32 → ~13px), via an inline `fontSize`. Letters are uppercased in the
// component (so callers can pass `'dl'` or `'DL'` interchangeably) and
// trimmed to 2 chars max — anything longer overflows the square.

export type AvatarKind = 'user' | 'org'
export type AvatarSize = 20 | 26 | 32 | 48

export type AvatarProps = {
  /** 1–2 character monogram. Uppercased and clamped to 2 chars. */
  monogram: string
  /** `user` (lighter ink) or `org` (heavier ink). Default `user`. */
  kind?: AvatarKind
  /** One of the four ported sizes: 20 · 26 · 32 · 48. Default 26. */
  size?: AvatarSize
}

// Shared chrome — square box with centered mono caps. The kind-specific
// background + radius land via inline styles below so `color-mix`
// against the live `--color-ink` token works cleanly in both themes
// without ballooning the Tailwind safelist with arbitrary values.
const baseCx =
  'inline-flex items-center justify-center select-none uppercase ' +
  'tracking-[0.02em] font-mono font-semibold'

// Per-kind paint. Mirrors the source `.av.user` / `.av.org` rules:
//   user → 10% ink fill, 4px radius, ink/85 text
//   org  → 14% ink fill, 2px radius, ink/95 text (heavier visual weight)
const kindStyle: Record<AvatarKind, React.CSSProperties> = {
  user: {
    background: 'color-mix(in oklab, var(--color-ink) 10%, transparent)',
    borderRadius: 4,
    color: 'color-mix(in oklab, var(--color-ink) 85%, transparent)',
  },
  org: {
    background: 'color-mix(in oklab, var(--color-ink) 14%, transparent)',
    borderRadius: 2,
    color: 'color-mix(in oklab, var(--color-ink) 95%, transparent)',
  },
}

export const Avatar = ({ monogram, kind = 'user', size = 26 }: AvatarProps) => {
  const label = monogram.slice(0, 2).toUpperCase()
  // ~40% of the box, floored at 8px so a 20px row avatar still reads.
  const fontSize = Math.max(8, Math.round(size * 0.4))
  return (
    <span
      className={baseCx}
      style={{ width: size, height: size, fontSize, ...kindStyle[kind] }}
      aria-label={`${kind === 'org' ? 'Organization' : 'User'} avatar — ${label}`}
    >
      {label}
    </span>
  )
}
