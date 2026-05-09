// Three-row specimen showing how the same row template paints under
// the three interaction states. Precedence is strict: selected >
// hover > zebra > base. Ports the per-state color cells from
// staging/dreamlake-design-guide.html §05 #sub-zebra-states (light
// values; dark theme picks up automatically via @theme overrides).
//
// Each row uses the same grid as ZebraSpecimen so the columns line
// up between specimens. The hover row uses bg-row-hover (cool blue
// tint of the eventual selected color — see §3 of the long-form
// guide for why hover and selected share a hue axis). The selected
// row uses bg-row-selected with text-row-selected-fg forcing white
// on every span.

type State = 'rest' | 'hover' | 'selected'

type Row = {
  id: string
  label: string
  meta: string
  state: State
  caption: string
}

const rows: Row[] = [
  { id: 'r_8a13', label: 'normalize-batch',   meta: '4m 12s', state: 'rest',     caption: 'rest · base'           },
  { id: 'r_8a12', label: 'filter-acme',       meta: '12s',    state: 'hover',    caption: 'hover · pointer here'  },
  { id: 'r_8a10', label: 'classify-staging',  meta: '8m 47s', state: 'selected', caption: 'selected · committed'  },
]

// Resting row radius is 7px; selected steps up to 10px so the tile
// reads as lifting out of the list (§4 of the long-form guide).
const baseRowCx =
  'grid grid-cols-[80px_minmax(0,1fr)_72px] items-center gap-3 ' +
  'px-3 h-7 font-mono text-[12px] leading-none text-ink'

const stateCx: Record<State, string> = {
  rest:     'rounded-[7px] bg-row-base',
  hover:    'rounded-[7px] bg-row-hover',
  selected: 'rounded-[10px] bg-row-selected text-row-selected-fg',
}

const captionCx =
  'font-mono text-[10px] font-medium tracking-[0.1em] uppercase text-muted'

export const ZebraStatesSpecimen = () => (
  <div className="flex flex-col gap-3 my-6">
    {rows.map((r) => (
      <div key={r.id} className="grid grid-cols-[140px_minmax(0,1fr)] items-center gap-4">
        <div className={captionCx}>{r.caption}</div>
        <div className={`${baseRowCx} ${stateCx[r.state]}`}>
          <span className={r.state === 'selected' ? '' : 'text-muted'}>{r.id}</span>
          <span className="truncate">{r.label}</span>
          <span
            className={`text-[11px] tracking-[0.04em] text-right ${
              r.state === 'selected' ? '' : 'text-muted'
            }`}
          >
            {r.meta}
          </span>
        </div>
      </div>
    ))}
  </div>
)
