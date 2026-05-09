// Specimens for the NavRailItem atom — mirrors the structure used by
// ButtonStates / DropdownSpecimens / ChipSpecimen.
//
// `NavRailItemStatesSpecimen` shows the three canonical visual states
// (rest, hover, active) side-by-side. `NavRailItemIconsSpecimen` walks
// the four icon variants (`none`, `folder`, `dot`, `branch`).
// `NavRailItemWithMetaSpecimen` shows the optional trailing meta slot
// across a few realistic count / branch / status badges.
//
// Strings borrow from staging/design.md so each row reads like a real
// left-rail entry from a dream.lake product.

import { NavRailItem, type NavRailItemIcon, type NavRailItemState } from '../NavRailItem'

const states: NavRailItemState[] = ['rest', 'hover', 'active']

const headerCx =
  'font-mono text-[9.5px] font-semibold tracking-[0.12em] uppercase text-muted opacity-85 pb-2 border-b border-faint'

const stackedLabelCx =
  'font-mono text-[9px] tracking-[0.1em] uppercase text-muted opacity-70 hidden max-[880px]:inline'

// Outer surface mirrors the other specimens — panel-on-bg, faint border,
// 6px radius, generous padding so each row reads as a self-contained sample.
const surfaceCx = 'my-6 border border-faint rounded-md bg-panel px-5 py-4'

export const NavRailItemStatesSpecimen = () => (
  <div className={surfaceCx}>
    <div className="grid grid-cols-3 gap-4 max-[880px]:grid-cols-1">
      {states.map((s) => (
        <div key={`h-${s}`} className={`${headerCx} max-[880px]:hidden`}>
          {s}
        </div>
      ))}
      {states.map((s) => (
        <div key={`c-${s}`} className="flex flex-col items-start gap-1 py-1">
          <span className={stackedLabelCx}>{s}</span>
          <NavRailItem label="acme · prod" meta="3" state={s} />
        </div>
      ))}
    </div>
  </div>
)

const icons: NavRailItemIcon[] = ['none', 'folder', 'dot', 'branch']

// Pair each icon with a label that fits its bucket — the dot reads as a
// status pip, branch reads as a git ref, folder as a workspace, none as
// a plain group entry.
const iconExamples: Record<NavRailItemIcon, string> = {
  none: 'overview',
  folder: 'pipelines',
  dot: 'running · 4',
  branch: 'main',
}

export const NavRailItemIconsSpecimen = () => (
  <div className={surfaceCx}>
    <div className="grid grid-cols-4 gap-4 max-[880px]:grid-cols-2">
      {icons.map((i) => (
        <div key={`h-${i}`} className={`${headerCx} max-[880px]:hidden`}>
          icon · {i}
        </div>
      ))}
      {icons.map((i) => (
        <div key={`c-${i}`} className="flex flex-col items-start gap-1 py-1">
          <span className={stackedLabelCx}>icon · {i}</span>
          <NavRailItem label={iconExamples[i]} icon={i} />
        </div>
      ))}
    </div>
  </div>
)

// A small column of "real" rows — one active, the rest at rest — so the
// trailing meta slot reads as the count / badge it would carry in a live
// nav rail. Stacked vertically, not in a grid: this is the closest
// specimen to "how the atom appears in `LeftNav.tsx` today".
export const NavRailItemWithMetaSpecimen = () => (
  <div className={`${surfaceCx} flex flex-col gap-px`}>
    <NavRailItem icon="folder" label="acme · prod" meta="3" state="active" />
    <NavRailItem icon="folder" label="acme · staging" meta="12" />
    <NavRailItem icon="branch" label="main" meta="rc" />
    <NavRailItem icon="dot" label="ingest · webhook" meta="running" />
    <NavRailItem label="overview" />
  </div>
)
