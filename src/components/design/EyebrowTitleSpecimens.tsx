// Live specimens for `<EyebrowTitle />` — the three levels side by
// side, mirroring the knobs from `#lab-eyebrow` in
// `staging/dreamlake-design-guide.html`. Each row pairs the rendered
// stack with its spec annotation so reviewers can eyeball-match
// against §03 Typography.
//
// Layout chrome mirrors ChipSpecimen / AvatarSpecimens — same row
// grid, same eyebrow + sub label typographic stack, same panel
// surface.

import { EyebrowTitle, type EyebrowTitleLevel } from '../EyebrowTitle'

type Row = {
  level: EyebrowTitleLevel
  bucket: string
  eyebrow: string
  title: string
  spec: string
}

// Strings borrowed straight from the lab default values + §03
// Typography demo rows so each level is paired with the call site
// it's tuned for.
const rows: Row[] = [
  {
    level: 'h1',
    bucket: 'page · view header',
    eyebrow: 'Sources · live now',
    title: 'Recent runs across this branch',
    spec: 'Inter Tight 600 · 22 / 27 · −0.012em',
  },
  {
    level: 'h2',
    bucket: 'subsection · groups inside a panel',
    eyebrow: 'Schedule · cron',
    title: 'Schedule and triggers',
    spec: 'Inter Tight 600 · 16 / 22',
  },
  {
    level: 'h3',
    bucket: 'panel head · inspector inner',
    eyebrow: 'Last run · ok',
    title: 'Last successful run',
    spec: 'Inter Tight 600 · 13 / 18',
  },
]

// Shared row layout — name | demo | spec, collapses to a single
// column under 880px. Same breakpoints as the chip / avatar
// specimens.
const rowCx =
  'grid grid-cols-[180px_minmax(0,1fr)_220px] gap-4 items-start py-4 ' +
  'border-b border-faint last:border-b-0 ' +
  'max-[880px]:grid-cols-1 max-[880px]:gap-2 max-[880px]:py-3'

const nameCx =
  'font-mono text-[10px] font-semibold text-muted tracking-[0.12em] uppercase opacity-85'
const subCx =
  'block font-ui text-[11px] font-normal text-muted tracking-[-0.005em] mt-0.5 normal-case opacity-80'

const specCx =
  'font-mono text-[10.5px] font-medium text-muted leading-[1.5] [text-wrap:pretty] max-[880px]:text-[10px]'

export const EyebrowTitleLevelsSpecimen = () => (
  <div className="my-6 border border-faint rounded-md bg-panel px-5 py-1">
    {rows.map((r) => (
      <div key={r.level} className={rowCx}>
        <div>
          <span className={nameCx}>level · {r.level}</span>
          <span className={subCx}>{r.bucket}</span>
        </div>
        <div className="min-w-0">
          <EyebrowTitle eyebrow={r.eyebrow} title={r.title} level={r.level} />
        </div>
        <div className={specCx}>{r.spec}</div>
      </div>
    ))}
  </div>
)
