// NavRailItem — left-rail row atom for @dreamlake/uikit.
//
// Ports `.navitem` from staging/dreamlake-design-guide.html `#lab-navitem`.
// Mirrors the shape that `src/components/LeftNav.tsx` already paints inline
// for the in-app sidebar (see `rowDefaultCx` / `rowActiveCx` there). This
// atom factors that pattern out as a reusable primitive — the canonical
// nav-row surface that other lists/menus can build on.
//
// Source CSS, lifted for reference:
//
//   .navitem            flex · gap 8 · padding 5×8 · radius var(--radius)
//                       font-ui 12.5px / 500 · text ink · -.005em tracking
//   .navitem .ico       12px wide column · muted · 10px font-size
//   .navitem .lbl       flex 1
//   .navitem .meta      mono · 9px · 500 · muted · .55 alpha · +0.04em
//   .navitem.is-hover   bg color-mix(in srgb, var(--ink) 5%, transparent)
//   .navitem.is-active  bg var(--selected-bg) · ink · weight 600
//
// `--selected-bg` from the design-guide tokens is the same value Tailwind
// exposes as `bg-selected` (--color-selected) in this repo's theme.css.
//
// Like Dropdown's atom, the `state` prop is a *visual* override — useful
// for the states specimen and for documentation screenshots; downstream
// callers should normally pass `state="active"` to mark the selected row
// and let native `:hover` paint do its job otherwise. To keep that path
// honest, the rest-state CSS includes the `:hover` rule, and `state`
// override stamps the same paint at the same specificity via `!`.

import type { AnchorHTMLAttributes, ReactNode } from 'react'

export type NavRailItemState = 'rest' | 'hover' | 'active'
export type NavRailItemIcon = 'none' | 'folder' | 'dot' | 'branch'

export type NavRailItemProps = {
  label: ReactNode
  /** Optional trailing count / chip / mono badge. */
  meta?: ReactNode
  /** Leading glyph variant. Default `'none'`. */
  icon?: NavRailItemIcon
  /** Visual state override for showcase / specimen use. Default `'rest'`. */
  state?: NavRailItemState
  /** When set, renders as `<a href>`; otherwise renders as `<div>`. */
  href?: string
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

// Shared chrome — the rest-state paint, plus the native `:hover` rule so
// the default (no `state` prop) reads correctly. Shape numbers come from
// the source CSS above: 8px gap, 5×8 padding, 8px radius, 12.5px ui ink.
const baseCx =
  'flex items-center gap-2 px-2 py-[5px] rounded-lg ' +
  'font-ui text-[12.5px] font-medium tracking-[-0.005em] leading-[1.25] ' +
  'text-ink no-underline transition-[background-color,color] duration-[120ms] ' +
  'min-w-[220px] ' +
  'hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)]'

// Forced-state overrides. Hover restates the same paint as `:hover`; active
// matches the source `.is-active` rule (`bg var(--selected-bg)` + ink +
// weight 600). The `bg-selected` utility is wired to `--color-selected`,
// which is the same value as the design-guide's `--selected-bg`.
const stateCx: Record<NavRailItemState, string> = {
  rest: '',
  hover: 'bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)]!',
  active: 'bg-selected! text-ink! font-semibold',
}

// Inline icon glyphs — Lucide-style stroke at 13×13 for folder + branch,
// a 6px filled circle for dot. `none` renders nothing so the label keeps
// the leading edge. The fixed-width spacer keeps multiple rows aligned
// even when one row is iconless.
const FolderGlyph = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h3.379a1.5 1.5 0 0 1 1.06.44l1.122 1.12a1.5 1.5 0 0 0 1.06.44H18.5A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z" />
  </svg>
)

const BranchGlyph = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="6" cy="5" r="2" />
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="7" r="2" />
    <path d="M6 7v10" />
    <path d="M18 9a4 4 0 0 1-4 4H10" />
  </svg>
)

const DotGlyph = () => (
  <span
    aria-hidden="true"
    className="inline-block w-[6px] h-[6px] rounded-full bg-current"
  />
)

const renderIcon = (icon: NavRailItemIcon) => {
  if (icon === 'none') return null
  if (icon === 'folder') return <FolderGlyph />
  if (icon === 'branch') return <BranchGlyph />
  return <DotGlyph />
}

// Fixed 13px-wide column so iconed and iconless rows align identically.
// Muted color matches `.navitem .ico { color: var(--muted); }`.
const iconSlotCx =
  'inline-flex w-[13px] shrink-0 items-center justify-center text-muted'

const labelCx = 'flex-1 min-w-0 truncate'

// Trailing meta — mono 9px / 500 / muted / .55 alpha / +0.04em tracking.
// Mirrors `.navitem .meta` exactly.
const metaCx =
  'font-mono text-[9px] font-medium tracking-[0.04em] text-muted opacity-55 shrink-0'

export const NavRailItem = ({
  label,
  meta,
  icon = 'none',
  state = 'rest',
  href,
  className,
  ...rest
}: NavRailItemProps) => {
  const cx = `${baseCx} ${stateCx[state]}${className ? ` ${className}` : ''}`
  const iconNode = renderIcon(icon)

  const inner = (
    <>
      {icon !== 'none' && (
        <span aria-hidden="true" className={iconSlotCx}>
          {iconNode}
        </span>
      )}
      <span className={labelCx}>{label}</span>
      {meta != null && meta !== '' && <span className={metaCx}>{meta}</span>}
    </>
  )

  if (href != null) {
    return (
      <a href={href} className={cx} {...rest}>
        {inner}
      </a>
    )
  }
  // Strip anchor-only attrs that don't belong on a div. Most callers won't
  // pass them when omitting `href`, but `target` / `rel` would slip through
  // a permissive spread otherwise. We just spread `rest` — React will
  // warn on unknown DOM props, which is the right feedback loop.
  return (
    <div className={cx} {...(rest as object)}>
      {inner}
    </div>
  )
}
