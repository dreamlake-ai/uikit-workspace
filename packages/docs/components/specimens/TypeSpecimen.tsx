// Live type specimen: 9 rows from staging/dreamlake-design-guide.html §03.
// Each row renders the typographic class in its actual styling, alongside
// the spec annotation (font + size/leading + tracking) so reviewers can
// eyeball-match against the design.

type Row = {
  name: string
  sub: string
  spec: string
  /** Pre-rendered demo node — rendered with the actual styling. */
  demo: React.ReactNode
}

const rows: Row[] = [
  {
    name: 'h1 · section',
    sub: 'card titles, view headers',
    spec: 'Inter Tight 600 · 22 / 27 · −0.012em',
    demo: (
      <div className="font-ui font-semibold text-[22px] leading-[27px] tracking-[-0.012em] text-uikit-ink">
        Recent runs across this branch
      </div>
    ),
  },
  {
    name: 'h2 · subsection',
    sub: 'groups inside a panel',
    spec: 'Inter Tight 600 · 16 / 22',
    demo: (
      <div className="font-ui font-semibold text-[16px] leading-[22px] text-uikit-ink">
        Schedule and triggers
      </div>
    ),
  },
  {
    name: 'h3 · panel head',
    sub: 'inspector inner heads',
    spec: 'Inter Tight 600 · 13 / 18',
    demo: (
      <div className="font-ui font-semibold text-[13px] leading-[18px] text-uikit-ink">
        Last successful run
      </div>
    ),
  },
  {
    name: 'body',
    sub: 'prose, descriptions, button copy',
    spec: 'Inter Tight 400 · 13 / 20',
    demo: (
      <div className="font-ui font-normal text-[13px] leading-[20px] text-uikit-ink [text-wrap:pretty]">
        A pipeline emits one column per run. Filters operate on those columns; sinks subscribe to them.
      </div>
    ),
  },
  {
    name: 'row · ledger',
    sub: 'zebra lists, ID columns, paths',
    spec: 'JetBrains Mono 500 · 12 / 18',
    demo: (
      <div className="font-mono font-medium text-[12px] leading-[18px] text-uikit-ink">
        classify · acme/prod · 4m 12s · ok
      </div>
    ),
  },
  {
    name: 'meta · timestamp',
    sub: 'secondary cell text in rows',
    spec: 'JetBrains Mono 500 · 10 / 14 · +0.04em',
    demo: (
      <div className="font-mono font-medium text-[10px] leading-[14px] tracking-[0.04em] text-uikit-muted">
        2026-04-12 · 14:23 · run_8a14e2
      </div>
    ),
  },
  {
    name: 'eyebrow',
    sub: 'small caps section labels',
    spec: 'JetBrains Mono 600 · 9.5 · +0.12em · UPPER',
    demo: (
      <div className="font-mono font-semibold text-[9.5px] tracking-[0.12em] uppercase text-uikit-muted">
        Sources · live now
      </div>
    ),
  },
  {
    name: 'tag',
    sub: 'inline glyph metadata',
    spec: 'JetBrains Mono 500 · 9 · +0.04em',
    demo: (
      <div className="font-mono font-medium text-[9px] tracking-[0.04em] text-uikit-muted">
        v1.4.2 · 3 columns · 2 sinks
      </div>
    ),
  },
  {
    name: 'kbd',
    sub: 'keyboard chips inline in copy',
    spec: 'JetBrains Mono 600 · 10 · 5% ink fill',
    demo: (
      <div className="flex items-center gap-1.5 font-ui text-[12px] text-uikit-ink">
        <kbd className="font-mono font-semibold text-[10px] text-uikit-ink bg-uikit-chip border border-uikit-faint rounded px-1.5 py-px">⌘</kbd>
        <kbd className="font-mono font-semibold text-[10px] text-uikit-ink bg-uikit-chip border border-uikit-faint rounded px-1.5 py-px">K</kbd>
        <span className="ml-1.5 text-uikit-muted">opens command palette</span>
      </div>
    ),
  },
]

const rowCx =
  'grid grid-cols-[180px_minmax(0,1fr)_220px] gap-4 items-center py-3.5 border-b border-uikit-faint last:border-b-0 max-[880px]:grid-cols-1 max-[880px]:gap-1.5 max-[880px]:py-3'

const nameCx =
  'font-mono text-[10px] font-semibold text-uikit-muted tracking-[0.12em] uppercase opacity-85'
const subCx =
  'block font-ui text-[11px] font-normal text-uikit-muted tracking-[-0.005em] mt-0.5 normal-case opacity-80'

const specCx =
  'font-mono text-[10.5px] font-medium text-uikit-muted leading-[1.5] [text-wrap:pretty] max-[880px]:text-[10px]'

export const TypeSpecimen = () => (
  <div className="my-6 border border-uikit-faint rounded-md bg-uikit-panel px-5 py-1">
    {rows.map((r) => (
      <div key={r.name} className={rowCx}>
        <div>
          <span className={nameCx}>{r.name}</span>
          <span className={subCx}>{r.sub}</span>
        </div>
        <div className="min-w-0">{r.demo}</div>
        <div className={specCx}>{r.spec}</div>
      </div>
    ))}
  </div>
)
