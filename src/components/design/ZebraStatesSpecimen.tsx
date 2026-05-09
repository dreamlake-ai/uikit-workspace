// State table — mirrors staging/dreamlake-design-guide.html §05
// #sub-zebra-states. One row per band (base / zebra / hover-selectable /
// hover-warm / selected / focus-visible), each showing the canonical
// hex in light + dark. The hex values are inline literals (not
// utilities) because the point of this specimen is the literal
// contract — what `grep '#[0-9a-f]\{6\}'` should turn up.

type Cell =
  | { kind: 'fill'; hex: string; fg?: string }
  | { kind: 'outline'; label: string }

type State = {
  label: string
  light: Cell
  dark: Cell
}

const states: State[] = [
  { label: 'base · even',        light: { kind: 'fill', hex: '#fffefa' },               dark: { kind: 'fill', hex: '#2b2b31' } },
  { label: 'zebra · odd',        light: { kind: 'fill', hex: '#f3f2ee' },               dark: { kind: 'fill', hex: '#36363c' } },
  { label: 'hover · selectable', light: { kind: 'fill', hex: '#d9e6f7' },               dark: { kind: 'fill', hex: '#3d4856' } },
  { label: 'hover · warm',       light: { kind: 'fill', hex: '#f3e6cc' },               dark: { kind: 'fill', hex: '#3d4856' } },
  { label: 'selected',           light: { kind: 'fill', hex: '#2174d9', fg: '#fff' },   dark: { kind: 'fill', hex: '#2f86e6', fg: '#fff' } },
  { label: 'focus-visible',      light: { kind: 'outline', label: '--accent · inset 2px' }, dark: { kind: 'outline', label: '--accent · inset 2px' } },
]

const headCellCx =
  'px-3.5 py-2 font-mono text-[9.5px] font-semibold tracking-[0.12em] uppercase text-muted bg-bg border-b border-faint'

const rowCellCx =
  'flex items-center gap-2.5 px-3.5 py-[11px] border-b border-faint [&:where(.last-row_*)]:border-b-0'

const swatchFillCx = 'shrink-0 w-14 h-6 rounded-[5px] border border-[rgba(0,0,0,0.08)]'
const swatchOutlineCx =
  'shrink-0 w-14 h-6 rounded-[5px] outline-2 outline-accent -outline-offset-2 bg-transparent'

const labelCx = 'font-mono text-[10.5px] font-semibold text-ink tracking-[0.02em]'
const hexCx = 'font-mono text-[10px] text-muted'

function CellView({ c }: { c: Cell }) {
  if (c.kind === 'outline') {
    return (
      <>
        <div className={swatchOutlineCx} aria-hidden="true" />
        <span className={hexCx}>{c.label}</span>
      </>
    )
  }
  return (
    <>
      <div className={swatchFillCx} style={{ background: c.hex }} aria-hidden="true" />
      <span className={hexCx}>{c.hex}{c.fg ? ` · fg ${c.fg}` : ''}</span>
    </>
  )
}

export const ZebraStatesSpecimen = () => (
  <div className="my-6 border border-faint rounded-[8px] overflow-hidden bg-panel shadow-[0_1px_2px_var(--shadow-tint-1)]">
    <div className="grid grid-cols-[140px_1fr_1fr]">
      <div className={headCellCx}>state</div>
      <div className={headCellCx}>light</div>
      <div className={headCellCx}>dark</div>
    </div>
    {states.map((s, i) => {
      const isLast = i === states.length - 1
      const cellCx = isLast ? rowCellCx + ' border-b-0' : rowCellCx
      return (
        <div key={s.label} className="grid grid-cols-[140px_1fr_1fr]">
          <div className={cellCx}>
            <span className={labelCx}>{s.label}</span>
          </div>
          <div className={cellCx}>
            <CellView c={s.light} />
          </div>
          <div className={cellCx}>
            <CellView c={s.dark} />
          </div>
        </div>
      )
    })}
  </div>
)
