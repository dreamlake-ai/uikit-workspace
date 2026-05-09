// Live specimens for `<Avatar />` — three galleries that mirror the
// knobs from staging/dreamlake-design-guide.html (`#lab-avatar`):
//
//   1. Sizes        — the four ported sizes side-by-side
//   2. Kinds        — user vs. org, same monogram, ink-weight delta visible
//   3. With a name  — the optional `name` slot beside the monogram
//
// Layout chrome mirrors ChipSpecimen / ButtonVariants — same row grid,
// same eyebrow + sub label typographic stack, same panel surface.

import { Avatar, type AvatarKind, type AvatarSize } from '../Avatar'

// Shared row layout. `name | demo | role` columns, collapsing to a
// single column under 880px — same breakpoints the chip specimen uses.
const rowCx =
  'grid grid-cols-[160px_minmax(0,1fr)_220px] gap-4 items-center py-3.5 ' +
  'border-b border-faint last:border-b-0 ' +
  'max-[880px]:grid-cols-1 max-[880px]:gap-2 max-[880px]:py-3'

const nameCx =
  'font-mono text-[10px] font-semibold text-muted tracking-[0.12em] uppercase opacity-85'
const subCx =
  'block font-ui text-[11px] font-normal text-muted tracking-[-0.005em] mt-0.5 normal-case opacity-80'
const roleCx =
  'font-ui text-[12px] leading-[1.5] text-muted [text-wrap:pretty]'

// ── Sizes ─────────────────────────────────────────────────────────

type SizeRow = { size: AvatarSize; bucket: string; role: string }

const sizeRows: SizeRow[] = [
  {
    size: 20,
    bucket: 'row · 20px',
    role: 'Compact rows and dense table cells. Pair with 11–12px row text.',
  },
  {
    size: 26,
    bucket: 'nav-foot · 26px',
    role: 'Default — sidebar identity, kebab menus, the bottom-of-nav slot.',
  },
  {
    size: 32,
    bucket: 'row primary · 32px',
    role: 'Header rows and list leads where the avatar is the primary hit-area.',
  },
  {
    size: 48,
    bucket: 'hero · 48px',
    role: 'Profile / settings hero. One per surface.',
  },
]

export const AvatarSizesSpecimen = () => (
  <div className="my-6 border border-faint rounded-md bg-panel px-5 py-1">
    {sizeRows.map((r) => (
      <div key={r.size} className={rowCx}>
        <div>
          <span className={nameCx}>size · {r.size}</span>
          <span className={subCx}>{r.bucket}</span>
        </div>
        <div className="min-w-0 flex items-center">
          <Avatar monogram="DL" size={r.size} />
        </div>
        <div className={roleCx}>{r.role}</div>
      </div>
    ))}
  </div>
)

// ── Kinds ─────────────────────────────────────────────────────────

type KindRow = { kind: AvatarKind; mono: string; bucket: string; role: string }

const kindRows: KindRow[] = [
  {
    kind: 'user',
    mono: 'GY',
    bucket: 'square · radius 4 · ink 10%',
    role: 'Default. Lighter fill, ink at 85% — recedes when shown next to a name.',
  },
  {
    kind: 'org',
    mono: 'DL',
    bucket: 'square · radius 2 · ink 14%',
    role: 'Heavier ink, sharper corners. Reads as the workspace / team / org.',
  },
]

export const AvatarKindsSpecimen = () => (
  <div className="my-6 border border-faint rounded-md bg-panel px-5 py-1">
    {kindRows.map((r) => (
      <div key={r.kind} className={rowCx}>
        <div>
          <span className={nameCx}>kind · {r.kind}</span>
          <span className={subCx}>{r.bucket}</span>
        </div>
        <div className="min-w-0 flex items-center gap-3">
          <Avatar monogram={r.mono} kind={r.kind} size={20} />
          <Avatar monogram={r.mono} kind={r.kind} size={26} />
          <Avatar monogram={r.mono} kind={r.kind} size={32} />
          <Avatar monogram={r.mono} kind={r.kind} size={48} />
        </div>
        <div className={roleCx}>{r.role}</div>
      </div>
    ))}
  </div>
)

// ── With a name ───────────────────────────────────────────────────

// The lab's `name` knob renders as a `<span class="av-name">` adjacent
// to the avatar — same UI font as body text, ink color, 12.5px.
// Recreated here as a bare flex pair so callers can compose
// `<Avatar /> + name` themselves without an extra wrapper component.
const pairCx = 'inline-flex items-center gap-[9px]'
const avNameCx = 'font-ui text-[12.5px] text-ink'

type NameRow = {
  kind: AvatarKind
  mono: string
  name: string
  size: AvatarSize
  role: string
}

const nameRows: NameRow[] = [
  {
    kind: 'user',
    mono: 'GY',
    name: 'ge yang',
    size: 26,
    role: 'Sidebar identity — 26px monogram + 12.5px UI name, 9px gap.',
  },
  {
    kind: 'org',
    mono: 'DL',
    name: 'dream.lake',
    size: 26,
    role: 'Workspace switcher — same chrome, heavier ink + tighter corners.',
  },
  {
    kind: 'user',
    mono: 'GY',
    name: 'ge yang',
    size: 32,
    role: 'Header row — 32px monogram for primary list leads.',
  },
]

export const AvatarWithNameSpecimen = () => (
  <div className="my-6 border border-faint rounded-md bg-panel px-5 py-1">
    {nameRows.map((r, i) => (
      <div key={i} className={rowCx}>
        <div>
          <span className={nameCx}>
            {r.kind} · {r.size}
          </span>
          <span className={subCx}>monogram + name</span>
        </div>
        <div className="min-w-0 flex items-center">
          <span className={pairCx}>
            <Avatar monogram={r.mono} kind={r.kind} size={r.size} />
            <span className={avNameCx}>{r.name}</span>
          </span>
        </div>
        <div className={roleCx}>{r.role}</div>
      </div>
    ))}
  </div>
)
