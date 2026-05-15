// Live zebra-list specimen — mirrors staging/dreamlake-design-guide.html
// §05 #sub-zebra-live verbatim. Eight rows, mixed states (rest /
// hover / selected / focus) so all four bands of the model show
// inline. The wrapper carries the rail-demo shadow + search header
// so the specimen reads as a real list panel, not a bare row stack.

type Status = 'ok' | 'run' | 'err' | 'queued'
type RowState = 'rest' | 'hover' | 'selected' | 'focus'

type Row = {
  id: string
  label: string
  meta: string
  status: Status
  zebra: 'even' | 'odd'
  state: RowState
}

// Source array order is the canonical order — zebra parity comes from
// the array index pattern, not :nth-child (zebra-list-style-guide §11
// rule 3).
const rows: Row[] = [
  { id: 'r_8a14', label: 'classify-prod',    meta: '2m 04s', status: 'run',    zebra: 'even', state: 'rest'     },
  { id: 'r_8a13', label: 'normalize-batch',  meta: '4m 12s', status: 'ok',     zebra: 'odd',  state: 'rest'     },
  { id: 'r_8a12', label: 'filter-acme',      meta: '12s',    status: 'ok',     zebra: 'even', state: 'hover'    },
  { id: 'r_8a11', label: 'patch-incident',   meta: '3s',     status: 'err',    zebra: 'odd',  state: 'rest'     },
  { id: 'r_8a10', label: 'classify-staging', meta: '8m 47s', status: 'ok',     zebra: 'even', state: 'selected' },
  { id: 'r_8a09', label: 'webhook-stripe',   meta: '110ms',  status: 'ok',     zebra: 'odd',  state: 'rest'     },
  { id: 'r_8a08', label: 'merge-q2',         meta: '22s',    status: 'ok',     zebra: 'even', state: 'focus'    },
  { id: 'r_8a07', label: 'manual-replay',    meta: 'queued', status: 'queued', zebra: 'odd',  state: 'rest'     },
]

// Grid mirrors the design-guide source (.rrow): 56px id · flex label ·
// auto meta · auto stat. 12px column gap. 6/10 px y/x padding. 7px
// resting radius (selected state will override to 10px).
const rowBaseCx =
  'grid grid-cols-[56px_minmax(0,1fr)_auto_auto] items-center gap-3 ' +
  'px-2.5 py-1.5 rounded-[12px] font-mono text-[11.5px] text-uikit-ink ' +
  'transition-[background-color,border-radius] duration-[120ms] ' +
  'bg-uikit-row-base data-[zebra=odd]:bg-uikit-row-zebra'

// State overrides. Hover and selected swap the background; focus draws
// an inset accent outline. They're additive on top of the base + zebra
// classes (state's bg-* wins via source-order in Tailwind v4).
const stateCx: Record<RowState, string> = {
  rest:     '',
  hover:    'bg-uikit-row-hover! data-[zebra=odd]:bg-uikit-row-hover!',
  selected: 'bg-uikit-row-selected! data-[zebra=odd]:bg-uikit-row-selected! rounded-[10px]! text-uikit-row-selected-fg',
  focus:    'outline-2 outline-uikit-accent -outline-offset-2',
}

const idCx     = 'text-[10.5px] text-uikit-muted opacity-70'
const labelCx  = 'font-medium overflow-hidden text-ellipsis whitespace-nowrap'
const metaCx   = 'text-[9.5px] text-uikit-muted tracking-[0.04em]'
const statBase = 'text-[9px] tracking-[0.04em] uppercase text-uikit-muted'

const statusInk: Record<Status, string> = {
  ok:     '',
  run:    'text-[#1f8f4a]!',
  err:    'text-[#c8513b]!',
  queued: '',
}

// Selected rows force every span to the same fg (zebra-list-style-guide
// §3 rule 5). Use the row-selected-fg token via text-* utility, plus a
// child selector so status colors don't bleed through.
const selectedChildCx = '[&>*]:text-uikit-row-selected-fg [&>*]:opacity-100'

export const ZebraSpecimen = () => (
  <div
    className="my-6 p-3 border border-uikit-faint rounded-md bg-uikit-panel shadow-[0_1px_2px_var(--shadow-tint-1),0_8px_24px_-10px_var(--shadow-tint-3)]"
    role="img"
    aria-label="Zebra-list specimen with rest, hover, selected, and focus states inline"
  >
    {/* Search header — gives the row stack the visual context of a real
        list panel (matches .rail-search). */}
    <div className="flex items-center gap-2 px-2.5 py-[7px] mb-2.5 rounded-md bg-uikit-search font-mono text-[11px] text-uikit-muted tracking-[0.03em]">
      <span aria-hidden="true">⌕</span>
      <span>filter runs…</span>
      <span className="opacity-55">· pipeline:classify · last 24h</span>
    </div>

    <div className="flex flex-col gap-[2px]">
      {rows.map((r) => {
        const cx =
          `${rowBaseCx} ${stateCx[r.state]} ` +
          (r.state === 'selected' ? selectedChildCx : '')
        return (
          <div key={r.id} className={cx} data-zebra={r.zebra} data-state={r.state}>
            <span className={idCx}>{r.id}</span>
            <span className={labelCx}>{r.label}</span>
            <span className={metaCx}>{r.meta}</span>
            <span className={`${statBase} ${statusInk[r.status]}`}>
              {r.status === 'run' ? 'running' : r.status === 'err' ? 'error' : r.status}
            </span>
          </div>
        )
      })}
    </div>
  </div>
)
