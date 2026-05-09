// Live specimens for `<TabStrip />` — two galleries that mirror the
// knobs from staging/dreamlake-design-guide.html (`#lab-tabs`):
//
//   1. Variants  — bare labels vs. labels+counts (the `counts` knob)
//   2. States    — active=0, active=mid, active=N (the `active` knob)
//
// The source ships an animated FLIP-style underline transition between
// active tabs. For the docs we render discrete static states — same
// data the lab's preview pane renders for each `active` value. The
// animation logic ships when the interactive component lands.

import { TabStrip, type TabStripItem } from '../TabStrip'

// Shared row layout — `name | demo | role`, collapsing under 880px.
// Matches ButtonVariants / AvatarSpecimens / ChipSpecimen chrome so
// every component page reads as one consistent gallery.
const rowCx =
  'grid grid-cols-[160px_minmax(0,1fr)_220px] gap-4 items-center py-4 ' +
  'border-b border-faint last:border-b-0 ' +
  'max-[880px]:grid-cols-1 max-[880px]:gap-2 max-[880px]:py-3'

const nameCx =
  'font-mono text-[10px] font-semibold text-muted tracking-[0.12em] uppercase opacity-85'
const subCx =
  'block font-ui text-[11px] font-normal text-muted tracking-[-0.005em] mt-0.5 normal-case opacity-80'
const roleCx =
  'font-ui text-[12px] leading-[1.5] text-muted [text-wrap:pretty]'

// Canonical label set from the lab's `tabs` knob default value:
//   "overview,projects,datasets,pipelines,jobs"
const LABELS = ['overview', 'projects', 'datasets', 'pipelines', 'jobs'] as const

// Default counts knob: `·,12,38,7,210` — first slot is a placeholder
// dot (`·`) the source treats as "no count", the rest are real numbers.
const COUNTS: TabStripItem['count'][] = ['·', 12, 38, 7, 210]

const bareTabs: TabStripItem[] = LABELS.map((label) => ({ label }))
const countedTabs: TabStripItem[] = LABELS.map((label, i) => ({
  label,
  count: COUNTS[i],
}))

// ── Variants — with vs. without counts ───────────────────────────

type VariantRow = {
  name: string
  bucket: string
  tabs: TabStripItem[]
  active: number
  role: string
}

const variantRows: VariantRow[] = [
  {
    name: 'labels only',
    bucket: 'no count slot',
    tabs: bareTabs,
    active: 0,
    role: 'Default. Five mono-cap labels, ink underline on the active tab. Use when each tab is a peer view, not a populated bucket.',
  },
  {
    name: 'with counts',
    bucket: 'optional .ct slot',
    tabs: countedTabs,
    active: 2,
    role: 'Adds a trailing count per tab (`.ct` slot, opacity .55, weight 500). Skip the count for tabs that have nothing meaningful to total — pass `·` or omit.',
  },
]

export const TabStripVariantsSpecimen = () => (
  <div className="my-6 border border-faint rounded-md bg-panel px-5 py-1">
    {variantRows.map((r) => (
      <div key={r.name} className={rowCx}>
        <div>
          <span className={nameCx}>{r.name}</span>
          <span className={subCx}>{r.bucket}</span>
        </div>
        <div className="min-w-0 flex items-center pb-2">
          <TabStrip tabs={r.tabs} activeIndex={r.active} />
        </div>
        <div className={roleCx}>{r.role}</div>
      </div>
    ))}
  </div>
)

// ── Active states — the underline at three discrete positions ─────

// Three cuts: the leftmost tab, a middle tab, the rightmost. Together
// they read as "the underline tracks the active tab" without needing
// the FLIP-style transition (which docs render statically).
type StateRow = {
  active: number
  bucket: string
  role: string
}

const stateRows: StateRow[] = [
  {
    active: 0,
    bucket: 'first tab',
    role: 'Index 0 — leftmost. Default landing state for a fresh route.',
  },
  {
    active: 2,
    bucket: 'middle tab',
    role: 'Index 2 — interior. Underline flush-left under the label, no overhang into the gap.',
  },
  {
    active: LABELS.length - 1,
    bucket: 'last tab',
    role: 'Index N — rightmost. Underline width tracks the label, stays inside the strip.',
  },
]

export const TabStripStatesSpecimen = () => (
  <div className="my-6 border border-faint rounded-md bg-panel px-5 py-1">
    {stateRows.map((r) => (
      <div key={r.active} className={rowCx}>
        <div>
          <span className={nameCx}>active · {r.active}</span>
          <span className={subCx}>{r.bucket}</span>
        </div>
        <div className="min-w-0 flex items-center pb-2">
          <TabStrip tabs={countedTabs} activeIndex={r.active} />
        </div>
        <div className={roleCx}>{r.role}</div>
      </div>
    ))}
  </div>
)
