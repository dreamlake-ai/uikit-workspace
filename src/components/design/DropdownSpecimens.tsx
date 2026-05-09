// Specimens for the Dropdown atom — mirrors the structure used by
// ButtonStates / ButtonVariants / ChipSpecimen.
//
// `DropdownStatesSpecimen` shows the four canonical visual states
// (rest, hover, focus, open) side-by-side. `DropdownLabeledSpecimen`
// shows the optional uppercase mono label slot rendered above the
// control.

import { Dropdown, type DropdownState } from '../Dropdown'

const states: DropdownState[] = ['rest', 'hover', 'focus', 'open']

const headerCx =
  'font-mono text-[9.5px] font-semibold tracking-[0.12em] uppercase text-muted opacity-85 pb-2 border-b border-faint'

const cellCx = 'flex items-center justify-start py-3'

const stackedLabelCx =
  'font-mono text-[9px] tracking-[0.1em] uppercase text-muted opacity-70 hidden max-[880px]:inline'

export const DropdownStatesSpecimen = () => (
  <div className="my-6 border border-faint rounded-md bg-panel px-5 py-4">
    <div className="grid grid-cols-4 gap-4 max-[880px]:grid-cols-2">
      {states.map((s) => (
        <div key={`h-${s}`} className={`${headerCx} max-[880px]:hidden`}>
          {s}
        </div>
      ))}
      {states.map((s) => (
        <div key={`c-${s}`} className={cellCx}>
          <div className="flex flex-col items-start gap-1">
            <span className={stackedLabelCx}>{s}</span>
            <Dropdown value="all · 38" state={s} />
          </div>
        </div>
      ))}
    </div>
  </div>
)

export const DropdownLabeledSpecimen = () => (
  <div className="my-6 border border-faint rounded-md bg-panel px-5 py-4 flex flex-wrap items-end gap-6">
    <Dropdown label="visibility" value="all · 38" />
    <Dropdown label="branch" value="main" />
    <Dropdown label="status" value="running · 4" />
  </div>
)
