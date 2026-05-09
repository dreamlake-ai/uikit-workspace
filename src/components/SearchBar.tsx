// SearchBar — generic search input atom for @dreamlake/uikit.
//
// Ports `#lab-search` from staging/dreamlake-design-guide.html (line 1889).
// The design-guide treats this as a small mono input field with a leading
// magnifier glyph, no border, the dedicated `--search-bg` fill, and an
// optional trailing hint chip (typically `<Kbd>⌘ K</Kbd>`). The accent
// outline ring paints on focus via `:focus-within` so the consumer can
// just focus the underlying <input> and the chrome reacts.
//
// This atom is SEPARATE from `SearchPalette.tsx`'s topbar `SearchInput`,
// which carries palette-open / portal swap behaviour the generic atom
// doesn't need. Both can live side-by-side; the atom is the surface
// only, no global keybindings, no popover.
//
// Source CSS, lifted for reference:
//
//   .rail-search   display:flex · gap 8 · padding 7px 10px ·
//                  background var(--search-bg) · radius 6 ·
//                  font-mono 11.5px · muted text · letter 0.03em
//   focus ring     box-shadow: 0 0 0 2px accent, halo via outline-offset 0
//                  (we render via Tailwind `focus-within:outline-2` etc.)
//
// API (kept minimal so this can graduate to `@dreamlake/uikit` cleanly):
//
//   <SearchBar placeholder="filter runs…" />
//   <SearchBar value={q} onChange={setQ} hint={<Kbd>⌘ K</Kbd>} />
//   <SearchBar state="focus" />              // forced visual state
//
// The `state` prop is a *visual* override for the specimen below — it
// stamps the focus paint at `!`-specificity so the showcase reads
// without the user having to actually focus the input. In real use the
// consumer just lets the input handle focus, and `:focus-within` paints
// the accent ring.

import type { InputHTMLAttributes, ReactNode } from 'react'

export type SearchBarState = 'rest' | 'focus'

export type SearchBarProps = {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  /** Visual state override for showcase / specimen use only. Default
   *  unset — the input's native `:focus-within` paints the accent ring. */
  state?: SearchBarState
  /** Optional trailing hint slot. Consumers usually pass a `<Kbd>⌘ K</Kbd>`. */
  hint?: ReactNode
  /** Leading icon. Defaults to a magnifying-glass SVG. Pass `null` to omit. */
  leadingIcon?: ReactNode
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'placeholder' | 'type'
>

// Default magnifier — Lucide `search`, sized 13×13 with muted stroke
// per the guide's `.ic-search svg` rule (line 412).
const DefaultSearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="w-[13px] h-[13px] text-muted shrink-0"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
)

// Outer chrome — the `--search-bg` fill, no border, radius 6, padded
// 7px / 10px to match `.rail-search` (line 706). `focus-within:` paints
// the accent ring at 50% alpha via outline. `outline-offset-0` keeps
// the ring flush so the bar height stays stable.
const baseCx =
  'inline-flex items-center gap-2 w-full px-2.5 py-[7px] ' +
  'bg-search rounded-md ' +
  'border border-transparent ' +
  'transition-[outline-color,box-shadow] duration-[140ms] ease-out ' +
  'outline-2 outline-transparent outline-offset-0 ' +
  'focus-within:outline-[color-mix(in_srgb,var(--color-accent)_50%,transparent)]'

// Forced-state override. Stamps the same outline paint with `!` so the
// specimen reads without real focus.
const stateCx: Record<SearchBarState, string> = {
  rest: '',
  focus:
    'outline-[color-mix(in_srgb,var(--color-accent)_50%,transparent)]!',
}

// The native <input> chrome — no border, no outline (the wrapper paints
// the focus ring), mono 11.5px, ink color, muted placeholder at 65%.
const inputCx =
  'flex-1 min-w-0 appearance-none border-0 outline-0 bg-transparent ' +
  'font-mono text-[11.5px] text-ink tracking-[0.01em] ' +
  'placeholder:text-muted placeholder:opacity-65'

export const SearchBar = ({
  value,
  onChange,
  placeholder,
  state,
  hint,
  leadingIcon,
  className,
  ...rest
}: SearchBarProps) => {
  const cx = `${baseCx}${state ? ` ${stateCx[state]}` : ''}${className ? ` ${className}` : ''}`
  const icon =
    leadingIcon === undefined ? <DefaultSearchIcon /> : leadingIcon

  return (
    <label className={cx}>
      {icon}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
        className={inputCx}
        {...rest}
      />
      {hint && (
        <span aria-hidden="true" className="ml-auto inline-flex items-center shrink-0">
          {hint}
        </span>
      )}
    </label>
  )
}
