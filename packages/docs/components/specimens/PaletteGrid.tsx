// The 6-color semantic palette from staging/design.md.
// Domain mappings ported verbatim — each bucket carries a status
// meaning AND a kind meaning AND a domain-concept meaning. The
// collision is the point.

type Domain = { name: string; concepts: string[] }
type Bucket = {
  hex: string
  name: string
  also: string
  domains: Domain[]
}

const buckets: Bucket[] = [
  {
    hex: '#23aaff',
    name: 'active · running',
    also: 'also: --accent, primary CTAs',
    domains: [
      { name: 'pipelines', concepts: ['running', 'transform', 'running edge'] },
      { name: 'timetravel', concepts: ['classify', 'upload', 'main', 'rc'] },
    ],
  },
  {
    hex: '#1f8f4a',
    name: 'ok · source',
    also: 'also: passed, complete',
    domains: [
      { name: 'pipelines', concepts: ['ok', 'source', 'ok edge'] },
      { name: 'timetravel', concepts: ['normalize', 'webhook', 'ingest', 'draft', 'add'] },
    ],
  },
  {
    hex: '#7c5bd9',
    name: 'model · merge · human',
    also: 'also: code / notebook authorship',
    domains: [
      { name: 'pipelines', concepts: ['model kind'] },
      { name: 'timetravel', concepts: ['merge', 'pr', 'public', 'tag op'] },
    ],
  },
  {
    hex: '#c0922e',
    name: 'stale · scheduled',
    also: 'also: warning, needs review',
    domains: [
      { name: 'pipelines', concepts: ['filter', 'stale', 'stalled edge'] },
      { name: 'timetravel', concepts: ['filter', 'schedule', 'modify'] },
    ],
  },
  {
    hex: '#c8513b',
    name: 'error · sink · quarantine',
    also: 'also: destructive actions',
    domains: [
      { name: 'pipelines', concepts: ['sink', 'error', 'error edge'] },
      { name: 'timetravel', concepts: ['patch', 'incident', 'remove'] },
    ],
  },
  {
    hex: '#9c907a',
    name: 'idle · queued · muted',
    also: 'also: placeholder rows, neutral chips',
    domains: [
      { name: 'pipelines', concepts: ['idle edge'] },
      { name: 'timetravel', concepts: ['manual', 'tag-only', 'fork', 'queued'] },
    ],
  },
]

const cardCx = 'border border-uikit-faint rounded-md overflow-hidden flex flex-col'

const headCx =
  'flex items-center justify-between px-3.5 py-2.5 font-mono text-[11px] font-semibold text-white tracking-[-0.005em]'

const bucketLabelCx = 'truncate'
const hexCx = 'opacity-80 tracking-[0.02em] tabular-nums'

const bodyCx = 'bg-uikit-panel px-3 py-3 flex flex-col gap-2 flex-1'

const alsoCx =
  'font-mono text-[10px] font-medium text-uikit-muted tracking-[0.04em] uppercase opacity-85'

const domainRowCx = 'flex flex-wrap items-baseline gap-1.5'

const domainNameCx =
  'font-mono text-[9.5px] font-semibold text-uikit-ink tracking-[0.1em] uppercase opacity-75 mr-1'

const conceptCx =
  'font-mono text-[10.5px] font-medium text-uikit-ink leading-tight px-1.5 py-px rounded border border-uikit-faint bg-uikit-bg'

export const PaletteGrid = () => (
  <div className="grid grid-cols-2 gap-2.5 my-6 max-[700px]:grid-cols-1">
    {buckets.map((b) => (
      <div key={b.hex} className={cardCx}>
        <div className={headCx} style={{ background: b.hex }}>
          <span className={bucketLabelCx}>{b.name}</span>
          <span className={hexCx}>{b.hex}</span>
        </div>
        <div className={bodyCx}>
          <div className={alsoCx}>{b.also}</div>
          {b.domains.map((d) => (
            <div key={d.name} className={domainRowCx}>
              <span className={domainNameCx}>{d.name}</span>
              {d.concepts.map((c) => (
                <span key={c} className={conceptCx}>{c}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
)
