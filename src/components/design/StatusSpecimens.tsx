// Live galleries for `<Status />` — three specimens that exercise
// the bucket / style axes from staging/dreamlake-design-guide.html
// `#lab-status`. Strings are borrowed from staging/design.md so each
// bucket pairs with a concept from its canonical semantic slot.

import { Status, type StatusBucket, type StatusStyle } from '../Status'

type BucketRow = {
  bucket: StatusBucket
  hex: string
  /** What this bucket means cross-page (mirrors staging/design.md). */
  meaning: string
  /** Canonical label for this bucket (mono) + an optional secondary clause. */
  label: string
  secondary?: string
}

const bucketRows: BucketRow[] = [
  {
    bucket: 'active',
    hex: '#23aaff',
    meaning: 'active · running · accent',
    label: 'running',
    secondary: '12s',
  },
  {
    bucket: 'ok',
    hex: '#1f8f4a',
    meaning: 'ok · source · success',
    label: 'ingest',
    secondary: 'webhook',
  },
  {
    bucket: 'model',
    hex: '#7c5bd9',
    meaning: 'model · merge · human-authored',
    label: 'merge',
    secondary: 'pr #284',
  },
  {
    bucket: 'stale',
    hex: '#c0922e',
    meaning: 'stale · scheduled · filter',
    label: 'scheduled',
    secondary: '03:00 utc',
  },
  {
    bucket: 'error',
    hex: '#c8513b',
    meaning: 'error · sink · quarantine',
    label: 'error',
    secondary: 'exit 137',
  },
  {
    bucket: 'idle',
    hex: '#9c907a',
    meaning: 'idle · queued · muted',
    label: 'queued',
  },
]

const rowCx =
  'grid grid-cols-[120px_minmax(0,1fr)_220px] gap-4 items-center py-3.5 ' +
  'border-b border-faint last:border-b-0 ' +
  'max-[880px]:grid-cols-1 max-[880px]:gap-1.5 max-[880px]:py-3'

const nameCx =
  'font-mono text-[10px] font-semibold text-muted tracking-[0.12em] uppercase opacity-85'
const subCx =
  'block font-ui text-[11px] font-normal text-muted tracking-[-0.005em] mt-0.5 normal-case opacity-80'

const hexCx =
  'font-mono text-[10.5px] font-medium text-muted leading-[1.5] [text-wrap:pretty] max-[880px]:text-[10px]'

// Buckets — one row per semantic bucket showing the canonical label
// (mono) + an optional secondary clause + the inline hex. Style is
// fixed to `dot` here; the `dot-pulse` / `bar` axes are exercised in
// `<StatusStylesSpecimen />` below.
export const StatusBucketsSpecimen = () => (
  <div className="my-6 border border-faint rounded-md bg-panel px-5 py-1">
    {bucketRows.map((r) => (
      <div key={r.bucket} className={rowCx}>
        <div>
          <span className={nameCx}>bucket · {r.bucket}</span>
          <span className={subCx}>{r.meaning}</span>
        </div>
        <div className="min-w-0 flex items-center">
          <Status bucket={r.bucket} label={r.label} secondary={r.secondary} />
        </div>
        <div className={hexCx}>{r.hex}</div>
      </div>
    ))}
  </div>
)

// Styles — one row per style variant. Bucket is held constant
// (active) so the eye reads the *style* axis cleanly: a static dot, a
// pulsing dot, and a bar.
type StyleRow = {
  style: StatusStyle
  role: string
}

const styleRows: StyleRow[] = [
  {
    style: 'dot',
    role: 'Default. Static 8px circle in the bucket hue. Use for steady state — ok, queued, stale.',
  },
  {
    style: 'dot-pulse',
    role: 'Pulsing halo on the 8px dot. Reserve for live / running / streaming — anything that is genuinely ticking right now.',
  },
  {
    style: 'bar',
    role: '12×3 rounded rectangle. Inline shorthand when the dot would compete with a near-by glyph; reads as a tag-mark.',
  },
]

const styleRowCx =
  'grid grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)] gap-4 items-center py-3.5 ' +
  'border-b border-faint last:border-b-0 ' +
  'max-[880px]:grid-cols-1 max-[880px]:gap-1.5 max-[880px]:py-3'

const roleCx =
  'font-ui text-[12px] leading-[1.5] text-muted [text-wrap:pretty]'

export const StatusStylesSpecimen = () => (
  <div className="my-6 border border-faint rounded-md bg-panel px-5 py-1">
    {styleRows.map((r) => (
      <div key={r.style} className={styleRowCx}>
        <div className={nameCx}>style · {r.style}</div>
        <div className="min-w-0 flex items-center">
          <Status bucket="active" label="running" secondary="12s" style={r.style} />
        </div>
        <div className={roleCx}>{r.role}</div>
      </div>
    ))}
  </div>
)
