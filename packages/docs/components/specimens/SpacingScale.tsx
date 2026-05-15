// The 11-step spacing scale ported from staging/dreamlake-design-guide.html
// §04 (id="sub-spacing"). Values are literal pixels — there's no token; the
// design-guide rationale is "used inline · no token". This component exists
// to make the rhythm visible: each row shows a horizontal bar whose width
// equals the named value, against the same `bg-uikit-ink/20` rule so the visual
// weight tracks the px count.

type Step = { name: string; value: number }

const steps: Step[] = [
  { name: 'space-2', value: 2 },
  { name: 'space-4', value: 4 },
  { name: 'space-6', value: 6 },
  { name: 'space-8', value: 8 },
  { name: 'space-10', value: 10 },
  { name: 'space-12', value: 12 },
  { name: 'space-14', value: 14 },
  { name: 'space-16', value: 16 },
  { name: 'space-20', value: 20 },
  { name: 'space-28', value: 28 },
  { name: 'space-40', value: 40 },
]

const rowCx =
  'grid grid-cols-[120px_56px_minmax(0,1fr)] items-center gap-3 py-1.5 border-b border-uikit-faint last:border-b-0'
const nameCx = 'font-mono text-[11.5px] font-semibold text-uikit-ink'
const valCx = 'font-mono text-[11px] text-uikit-muted tabular-nums'
const barCx = 'h-2 rounded-sm bg-uikit-ink/20'

export const SpacingScale = () => (
  <div className="my-6 border border-uikit-faint rounded-md bg-uikit-panel px-4 py-2">
    {steps.map((s) => (
      <div key={s.name} className={rowCx}>
        <div className={nameCx}>{s.name}</div>
        <div className={valCx}>{s.value}px</div>
        <div className={barCx} style={{ width: `${s.value}px` }} aria-hidden="true" />
      </div>
    ))}
  </div>
)
