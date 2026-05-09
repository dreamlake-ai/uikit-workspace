// Live gallery for `<Chip />` — exercises every tone in the 6-color
// semantic palette plus the leading-icon affordance. Strings are
// borrowed from staging/design.md so each tone is paired with a
// concept from its canonical bucket (running / ok / model / stale /
// error / queued).

import type { ReactNode } from 'react'
import { Chip, type ChipTone } from '../Chip'

type Row = {
  tone: ChipTone
  hex: string
  /** What this bucket means cross-page (mirrors staging/design.md). */
  bucket: string
  /** Example chip labels rendered with this tone. */
  examples: string[]
}

const rows: Row[] = [
  {
    tone: 'neutral',
    hex: '—',
    bucket: 'no tint · panel surface + faint border',
    examples: ['pipeline:classify', 'kind:transform', '3 columns'],
  },
  {
    tone: 'accent',
    hex: '#23aaff',
    bucket: 'active · running · accent',
    examples: ['running', 'main', 'rc'],
  },
  {
    tone: 'ok',
    hex: '#1f8f4a',
    bucket: 'ok · source · success',
    examples: ['ok', 'ingest', 'add'],
  },
  {
    tone: 'warn',
    hex: '#c0922e',
    bucket: 'stale · scheduled · filter',
    examples: ['stale', 'schedule', 'modify'],
  },
  {
    tone: 'error',
    hex: '#c8513b',
    bucket: 'error · sink · quarantine',
    examples: ['error', 'sink', 'remove'],
  },
  {
    tone: 'muted',
    hex: '#9c907a',
    bucket: 'idle · queued · muted',
    examples: ['queued', 'manual', 'noop'],
  },
]

// Bucket-coloured 1.0 dot — mirrors the same dot used elsewhere in the
// guide's status-indicator lab. Lifted inline as a node here (the
// chip's `icon` slot accepts any ReactNode).
const Dot = ({ color }: { color: string }) => (
  <span
    aria-hidden="true"
    className="inline-block w-[7px] h-[7px] rounded-full"
    style={{ background: color }}
  />
)

const rowCx =
  'grid grid-cols-[180px_minmax(0,1fr)_220px] gap-4 items-center py-3.5 ' +
  'border-b border-faint last:border-b-0 max-[880px]:grid-cols-1 max-[880px]:gap-1.5 max-[880px]:py-3'

const nameCx =
  'font-mono text-[10px] font-semibold text-muted tracking-[0.12em] uppercase opacity-85'
const subCx =
  'block font-ui text-[11px] font-normal text-muted tracking-[-0.005em] mt-0.5 normal-case opacity-80'

const hexCx =
  'font-mono text-[10.5px] font-medium text-muted leading-[1.5] [text-wrap:pretty] max-[880px]:text-[10px]'

export const ChipSpecimen = () => (
  <div className="my-6 border border-faint rounded-md bg-panel px-5 py-1">
    {rows.map((r) => (
      <div key={r.tone} className={rowCx}>
        <div>
          <span className={nameCx}>tone · {r.tone}</span>
          <span className={subCx}>{r.bucket}</span>
        </div>
        <div className="min-w-0 flex flex-wrap items-center gap-2">
          {r.examples.map((label) => (
            <Chip key={label} tone={r.tone}>
              {label}
            </Chip>
          ))}
        </div>
        <div className={hexCx}>{r.hex}</div>
      </div>
    ))}
  </div>
)

// Second specimen: the leading-icon affordance. Mirrors the source
// HTML's `glyph` knob — any ReactNode (mono character, SVG dot,
// emoji-class glyph) flows into the `icon` slot.
const iconRowCx =
  'flex flex-wrap items-center gap-2 my-6 border border-faint rounded-md bg-panel px-5 py-4'

export const ChipWithIconSpecimen = () => {
  const examples: { tone: ChipTone; icon: ReactNode; children: ReactNode }[] = [
    { tone: 'accent', icon: <Dot color="#23aaff" />, children: 'running' },
    { tone: 'ok', icon: <Dot color="#1f8f4a" />, children: 'ingest · webhook' },
    { tone: 'warn', icon: <Dot color="#c0922e" />, children: 'stale · 3d' },
    { tone: 'error', icon: <Dot color="#c8513b" />, children: 'error · exit 137' },
    { tone: 'muted', icon: <Dot color="#9c907a" />, children: 'queued' },
    { tone: 'neutral', icon: <span className="text-[11px]">●</span>, children: 'pipeline:classify' },
  ]

  return (
    <div className={iconRowCx}>
      {examples.map((e, i) => (
        <Chip key={i} tone={e.tone} icon={e.icon}>
          {e.children}
        </Chip>
      ))}
    </div>
  )
}
