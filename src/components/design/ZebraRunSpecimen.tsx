// Multi-row run specimen — mirrors staging/dreamlake-design-guide.html
// §05 #sub-zebra-ring. Six rows; rows 2-4 wrapped in a `.sel-run`
// container that draws a 2px accent ring around the contiguous block
// via ::after. The rows inside the run KEEP their own zebra parity —
// the ring style is purely an outer indicator, not a background fill.
// (The fill style is the alternative pattern documented in the long-
// form guide as Option B; this specimen demonstrates Option A.)

type Row = {
  id: string
  label: string
  meta: string
  zebra: 'even' | 'odd'
}

// Note the zebra parity carries through the run — the run wrapper is
// transparent, so each row's own bg-row-base / bg-row-zebra reads.
const rows: Row[] = [
  { id: 'e_4422', label: 'column.add · price_usd',    meta: '14:01', zebra: 'even' },
  { id: 'e_4421', label: 'column.modify · region',    meta: '13:58', zebra: 'odd'  },
  { id: 'e_4420', label: 'column.remove · legacy_id', meta: '13:58', zebra: 'even' },
  { id: 'e_4419', label: 'column.add · region_norm',  meta: '13:57', zebra: 'odd'  },
  { id: 'e_4418', label: 'column.tag · pii',          meta: '13:50', zebra: 'even' },
  { id: 'e_4417', label: 'column.add · session_id',   meta: '13:42', zebra: 'odd'  },
]

const RUN_START = 1
const RUN_END = 3

const rowBaseCx =
  'grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 ' +
  'px-2.5 py-1.5 rounded-[7px] font-mono text-[11.5px] text-ink ' +
  'bg-row-base data-[zebra=odd]:bg-row-zebra'

const idCx = 'text-[10.5px] text-muted opacity-70'
const labelCx = 'font-medium overflow-hidden text-ellipsis whitespace-nowrap'
const metaCx = 'text-[9.5px] text-muted tracking-[0.04em]'

// The ::after wrapper draws the 2px accent ring at +2 over its rows
// (which are at +1 via parent's `relative isolate z-[1]`). The ring is
// pointer-events:none so clicks pass through to the rows underneath.
const selRunCx =
  'relative isolate z-[1] bg-transparent flex flex-col gap-[2px] rounded-[12px] ' +
  "after:content-[''] after:absolute after:inset-0 after:rounded-[12px] " +
  'after:border-2 after:border-accent after:pointer-events-none after:z-[2]'

function RowView({ r }: { r: Row }) {
  return (
    <div className={rowBaseCx} data-zebra={r.zebra}>
      <span className={idCx}>{r.id}</span>
      <span className={labelCx}>{r.label}</span>
      <span className={metaCx}>{r.meta}</span>
    </div>
  )
}

export const ZebraRunSpecimen = () => (
  <div
    className="my-6 p-3 border border-faint rounded-md bg-panel shadow-[0_1px_2px_var(--shadow-tint-1),0_8px_24px_-10px_var(--shadow-tint-3)]"
    role="img"
    aria-label="Six-row list with rows 2 to 4 selected as a contiguous run, drawn with an accent ring"
  >
    <div className="flex flex-col gap-[2px]">
      {rows.slice(0, RUN_START).map((r) => (
        <RowView key={r.id} r={r} />
      ))}
      <div className={selRunCx} role="group" aria-label="Selected run">
        {rows.slice(RUN_START, RUN_END + 1).map((r) => (
          <RowView key={r.id} r={r} />
        ))}
      </div>
      {rows.slice(RUN_END + 1).map((r) => (
        <RowView key={r.id} r={r} />
      ))}
    </div>
  </div>
)
