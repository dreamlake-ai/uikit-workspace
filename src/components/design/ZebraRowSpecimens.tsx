// Specimens for the `<ZebraRow />` atom.
//
// Three specimens, one per page section:
//   • ZebraRowAnatomySpecimen — one row, fields labeled
//   • ZebraRowStatesSpecimen  — rest / hover / selected / focus
//   • ZebraRowStatusSpecimen  — run / ok / err / warn / idle
//
// All three use the real `<ZebraRow />` component (no inline markup) —
// the foundations `/zebra-lists` page demonstrates the *pattern* and
// keeps its inline rows; this file demonstrates the *atom* that ships
// from `@dreamlake/uikit`.

import { ZebraRow } from '../ZebraRow'

// Shared list-panel chrome — matches ZebraSpecimen so the two pages
// read as siblings.
const panelCx =
  'my-6 p-3 border border-faint rounded-md bg-panel ' +
  'shadow-[0_1px_2px_var(--shadow-tint-1),0_8px_24px_-10px_var(--shadow-tint-3)]'

const stackCx = 'flex flex-col gap-[2px]'

// ── Anatomy ──────────────────────────────────────────────────────
//
// One canonical row + a labeled callout grid pinning each field to its
// column. Mirrors the lab-row preview pane defaults: r_8a14 ·
// classify-prod · 2m 04s · running.

const fieldLabelCx =
  'font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted'
const fieldDescCx = 'font-mono text-[10.5px] text-muted leading-[1.5]'

const fields: { name: string; desc: string }[] = [
  { name: 'rowId', desc: '56px id column · 10.5px · muted · opacity 70' },
  { name: 'label', desc: 'flex label · 11.5px · ink · ellipsis on overflow' },
  { name: 'meta', desc: 'auto column · 9.5px · muted · +0.04em tracking' },
  { name: 'status', desc: 'auto column · 9px · uppercase · bucket-tinted' },
]

export const ZebraRowAnatomySpecimen = () => (
  <div className={panelCx}>
    <div className={stackCx}>
      <ZebraRow
        rowId="r_8a14"
        label="classify-prod"
        meta="2m 04s"
        status="run"
      />
    </div>
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-faint">
      {fields.map((f) => (
        <div key={f.name} style={{ display: 'contents' }}>
          <span className={fieldLabelCx}>{f.name}</span>
          <span className={fieldDescCx}>{f.desc}</span>
        </div>
      ))}
    </div>
  </div>
)

// ── States ───────────────────────────────────────────────────────
//
// Four rows, one per state band. Parity alternates so the rest+hover
// pair shows the base/zebra delta as well.

type StateRow = {
  rowId: string
  label: string
  meta: string
  status: 'run' | 'ok' | 'err' | 'warn' | 'idle'
  parity: 'even' | 'odd'
  state: 'rest' | 'hover' | 'selected' | 'focus'
}

const stateRows: StateRow[] = [
  { rowId: 'r_8a14', label: 'classify-prod',    meta: '2m 04s', status: 'run', parity: 'even', state: 'rest' },
  { rowId: 'r_8a13', label: 'normalize-batch',  meta: '4m 12s', status: 'ok',  parity: 'odd',  state: 'hover' },
  { rowId: 'r_8a12', label: 'classify-staging', meta: '8m 47s', status: 'ok',  parity: 'even', state: 'selected' },
  { rowId: 'r_8a11', label: 'merge-q2',         meta: '22s',    status: 'ok',  parity: 'odd',  state: 'focus' },
]

export const ZebraRowStatesSpecimen = () => (
  <div className={panelCx}>
    <div className={stackCx}>
      {stateRows.map((r) => (
        <ZebraRow
          key={r.rowId}
          rowId={r.rowId}
          label={r.label}
          meta={r.meta}
          status={r.status}
          parity={r.parity}
          state={r.state}
        />
      ))}
    </div>
  </div>
)

// ── Status buckets ───────────────────────────────────────────────
//
// One row per bucket so the status-text colors line up vertically.
// Parity alternates again so the bucket label reads on both the base
// and zebra surface.

type BucketRow = {
  rowId: string
  label: string
  meta: string
  status: 'run' | 'ok' | 'err' | 'warn' | 'idle'
  parity: 'even' | 'odd'
}

const bucketRows: BucketRow[] = [
  { rowId: 'r_8a14', label: 'classify-prod',  meta: '2m 04s', status: 'run',  parity: 'even' },
  { rowId: 'r_8a13', label: 'normalize-batch', meta: '4m 12s', status: 'ok',   parity: 'odd' },
  { rowId: 'r_8a11', label: 'patch-incident', meta: '3s',     status: 'err',  parity: 'even' },
  { rowId: 'r_8a09', label: 'webhook-stripe', meta: '3d',     status: 'warn', parity: 'odd' },
  { rowId: 'r_8a07', label: 'manual-replay',  meta: 'queued', status: 'idle', parity: 'even' },
]

export const ZebraRowStatusSpecimen = () => (
  <div className={panelCx}>
    <div className={stackCx}>
      {bucketRows.map((r) => (
        <ZebraRow
          key={r.rowId}
          rowId={r.rowId}
          label={r.label}
          meta={r.meta}
          status={r.status}
          parity={r.parity}
        />
      ))}
    </div>
  </div>
)
