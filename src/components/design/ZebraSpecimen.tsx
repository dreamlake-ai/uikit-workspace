// Live specimen: a six-row zebra ledger. Even rows sit on
// `--color-row-base`, odd rows on `--color-row-zebra`. The 2px row
// gap (sacred — see staging/zebra-list-style-guide.md §2) lets the
// alternating fills tile rather than smear. Mono 12px so the row
// reads as a real ledger line, not as card chrome.

type Row = {
  id: string
  label: string
  meta: string
  status: 'ok' | 'run' | 'err' | 'queued'
}

const rows: Row[] = [
  { id: 'r_8a14', label: 'classify-prod',     meta: '2m 04s', status: 'run'    },
  { id: 'r_8a13', label: 'normalize-batch',   meta: '4m 12s', status: 'ok'     },
  { id: 'r_8a12', label: 'filter-acme',       meta: '12s',    status: 'ok'     },
  { id: 'r_8a11', label: 'patch-incident',    meta: '3s',     status: 'err'    },
  { id: 'r_8a10', label: 'classify-staging',  meta: '8m 47s', status: 'ok'     },
  { id: 'r_8a09', label: 'webhook-stripe',    meta: '110ms',  status: 'ok'     },
]

// Mono ledger row. 7px corner radius is the resting row radius (the
// selected row in ZebraStatesSpecimen steps up to 10px — staging
// guide §4). Even rows on row-base; data-zebra="odd" swaps to
// row-zebra. Parity is data-driven, not :nth-child — keeps stripe
// stable when a SelectionRunBox wraps consecutive rows.
const rowCx =
  'grid grid-cols-[80px_minmax(0,1fr)_72px_60px] items-center gap-3 ' +
  'px-3 h-7 rounded-[7px] font-mono text-[12px] leading-none text-ink ' +
  'bg-row-base data-[zebra=odd]:bg-row-zebra'

const idCx    = 'text-muted'
const labelCx = 'truncate'
const metaCx  = 'text-muted text-[11px] tracking-[0.04em] text-right'
const statCx  = 'text-[10px] tracking-[0.06em] uppercase text-right'

const statusColor: Record<Row['status'], string> = {
  ok:     'text-muted',
  run:    'text-[#1f8f4a]',
  err:    'text-[#c8513b]',
  queued: 'text-muted opacity-70',
}

export const ZebraSpecimen = () => (
  <div
    className="flex flex-col gap-[2px] p-3 my-6 border border-faint rounded-md bg-panel"
    role="img"
    aria-label="Six-row zebra list specimen"
  >
    {rows.map((r, i) => (
      <div
        key={r.id}
        className={rowCx}
        data-zebra={i % 2 ? 'odd' : 'even'}
      >
        <span className={idCx}>{r.id}</span>
        <span className={labelCx}>{r.label}</span>
        <span className={metaCx}>{r.meta}</span>
        <span className={`${statCx} ${statusColor[r.status]}`}>
          {r.status === 'run' ? 'running' : r.status === 'err' ? 'error' : r.status}
        </span>
      </div>
    ))}
  </div>
)
