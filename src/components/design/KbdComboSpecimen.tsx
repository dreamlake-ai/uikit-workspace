// Live gallery for `<KbdCombo />` — exercises the leading + trailing
// placements with combos drawn from the cross-page command set
// (palette, theme toggle, search). The neutral row at top calls out
// what `placement` means; the rows below stagger leading vs trailing
// so the eye can compare the two readings of the same atom.

import { KbdCombo } from '../Kbd'

type Row = {
  placement: 'leading' | 'trailing'
  combo: string
  description: string
  /** Why this row exists — mirrors the bucket sub-label in ChipSpecimen. */
  bucket: string
}

const rows: Row[] = [
  {
    placement: 'leading',
    combo: '⌘ K',
    description: 'open palette',
    bucket: 'keys first · reads as instruction',
  },
  {
    placement: 'leading',
    combo: '⌘ ⇧ P',
    description: 'run command',
    bucket: 'multi-key chord · gap between pills',
  },
  {
    placement: 'leading',
    combo: '/',
    description: 'focus search',
    bucket: 'single-key combo',
  },
  {
    placement: 'trailing',
    combo: 'esc',
    description: 'close',
    bucket: 'description first · reads as caption',
  },
  {
    placement: 'trailing',
    combo: '⌘ ,',
    description: 'preferences',
    bucket: 'trailing · menu hint shape',
  },
]

const rowCx =
  'grid grid-cols-[180px_minmax(0,1fr)_220px] gap-4 items-center py-3.5 ' +
  'border-b border-faint last:border-b-0 max-[880px]:grid-cols-1 max-[880px]:gap-1.5 max-[880px]:py-3'

const nameCx =
  'font-mono text-[10px] font-semibold text-muted tracking-[0.12em] uppercase opacity-85'
const subCx =
  'block font-ui text-[11px] font-normal text-muted tracking-[-0.005em] mt-0.5 normal-case opacity-80'

const specCx =
  'font-mono text-[10.5px] font-medium text-muted leading-[1.5] [text-wrap:pretty] max-[880px]:text-[10px]'

export const KbdComboSpecimen = () => (
  <div className="my-6 border border-faint rounded-md bg-panel px-5 py-1">
    {rows.map((r, i) => (
      <div key={`${r.placement}-${r.combo}-${i}`} className={rowCx}>
        <div>
          <span className={nameCx}>placement · {r.placement}</span>
          <span className={subCx}>{r.bucket}</span>
        </div>
        <div className="min-w-0 flex flex-wrap items-center gap-3">
          <KbdCombo
            combo={r.combo}
            description={r.description}
            placement={r.placement}
          />
        </div>
        <div className={specCx}>
          combo={`"${r.combo}"`}
        </div>
      </div>
    ))}
  </div>
)
