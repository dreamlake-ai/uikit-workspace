// Radii specimen — five named roles ported from
// staging/dreamlake-design-guide.html §04 (id="sub-radii"). The chip /
// input / row / card / panel ladder is the load-bearing contract; --radius
// (10px) is the panel/selection canonical. Each card shows a representative
// shape filled with --color-faint (so the corner is visible against the
// panel surface) plus the named role and a one-line rationale.

type Radius = {
  px: number
  role: string
  description: string
  isToken?: boolean
}

const radii: Radius[] = [
  { px: 3, role: 'kbd · tag', description: 'Inline glyph elements only.' },
  { px: 6, role: 'badge', description: 'Inline kbd-like chips and version badges.' },
  { px: 8, role: 'card', description: 'Cards, state tables, and lab tiles.' },
  { px: 10, role: 'panel · input', description: 'Panels, popovers, search input, palette buttons.', isToken: true },
  { px: 12, role: 'list row', description: 'Zebra-list rows at rest, hover, and selection-run wrappers.' },
]

const cardCx = 'border border-uikit-faint rounded-md bg-uikit-panel p-3 flex flex-col gap-2'
const demoCx = 'h-16 flex items-end'
const shapeCx = 'w-full h-12 bg-uikit-ink/10 border border-uikit-faint'
const headRowCx = 'flex items-baseline gap-2'
const nameCx = 'font-mono text-[12px] font-semibold text-uikit-ink'
const tagCx =
  'font-mono text-[9px] font-medium tracking-[0.1em] uppercase text-uikit-muted px-1.5 py-px rounded border border-uikit-faint'
const roleCx = 'font-mono text-[10.5px] text-uikit-muted'
const descCx = 'font-ui text-[12px] leading-[1.5] text-uikit-ink [text-wrap:pretty]'

export const RadiiSpecimen = () => (
  <div className="grid grid-cols-3 gap-2.5 my-6 max-[880px]:grid-cols-2 max-[560px]:grid-cols-1">
    {radii.map((r) => (
      <div key={r.px} className={cardCx}>
        <div className={demoCx}>
          <div className={shapeCx} style={{ borderRadius: `${r.px}px` }} aria-hidden="true" />
        </div>
        <div className={headRowCx}>
          <span className={nameCx}>{r.px}px</span>
          {r.isToken && <span className={tagCx}>--radius</span>}
        </div>
        <div className={roleCx}>{r.role}</div>
        <div className={descCx}>{r.description}</div>
      </div>
    ))}
  </div>
)
