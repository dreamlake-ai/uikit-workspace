// Hairline specimen — ported from staging/dreamlake-design-guide.html §04
// (id="sub-hairlines"). Three demos:
//   1. --faint solid — the structural 1px hairline used on every panel,
//      gridline, and divider. Light: rgba(0,0,0,.08); dark: rgba(255,255,255,.09).
//   2. --faint-dashed — for "incomplete" / annotated boundaries (metadata
//      underlines). Same opacity in both themes (.22).
//   3. --chip-bg — the inline-code / tag / kbd background. Same family of
//      ink-tints, lower opacity (.04 / .05).

type Specimen = {
  name: string
  values: string
  role: string
  demo: 'solid' | 'dashed' | 'chip'
}

const specimens: Specimen[] = [
  {
    name: '--faint',
    values: '.08 light · .09 dark',
    role: 'Structural borders. Panels, gridlines, dividers.',
    demo: 'solid',
  },
  {
    name: '--faint-dashed',
    values: '.22 / .22',
    role: 'Annotated underlines for "incomplete" boundaries and metadata.',
    demo: 'dashed',
  },
  {
    name: '--chip-bg',
    values: '.04 / .05',
    role: 'Inline code, tag chips, kbd backgrounds.',
    demo: 'chip',
  },
]

const cardCx = 'border border-uikit-faint rounded-md bg-uikit-panel p-3 flex flex-col gap-2'
const demoCx = 'h-12 flex items-center'
const headRowCx = 'flex items-baseline'
const nameCx = 'font-mono text-[12px] font-semibold text-uikit-ink'
const valuesCx = 'font-mono text-[10.5px] text-uikit-muted'
const roleCx = 'font-ui text-[12px] leading-[1.5] text-uikit-ink [text-wrap:pretty]'

const renderDemo = (kind: Specimen['demo']) => {
  if (kind === 'solid') {
    return <div className="w-full border-t border-uikit-faint" aria-hidden="true" />
  }
  if (kind === 'dashed') {
    return (
      <div
        className="w-full border-t border-dashed border-[color:var(--color-uikit-faint-dashed)]"
        aria-hidden="true"
      />
    )
  }
  return <div className="w-full h-6 rounded bg-uikit-chip border border-uikit-faint" aria-hidden="true" />
}

export const HairlineSpecimen = () => (
  <div className="grid grid-cols-3 gap-2.5 my-6 max-[700px]:grid-cols-1">
    {specimens.map((s) => (
      <div key={s.name} className={cardCx}>
        <div className={demoCx}>{renderDemo(s.demo)}</div>
        <div className={headRowCx}>
          <span className={nameCx}>{s.name}</span>
        </div>
        <div className={valuesCx}>{s.values}</div>
        <div className={roleCx}>{s.role}</div>
      </div>
    ))}
  </div>
)
