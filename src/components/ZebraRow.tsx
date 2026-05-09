// ZebraRow — the foundational selectable list row used across every
// list panel in the guide (run lists, schema diff, runs feed, etc.).
// Mirrors the source CSS in `staging/dreamlake-design-guide.html`
// §lab-row (lines 1802-1847) verbatim:
//
//   grid 56px 1fr auto auto · gap 12 · padding 6/10 · radius 7
//   font-mono 11.5 · transition background+radius 120ms
//   selected → radius 10, every span forced to row-selected-fg
//   focus    → outline 2px accent · -2px inset
//
// API kept minimal so the atom can graduate to `@dreamlake/uikit`:
//
//   <ZebraRow rowId="r_8a14" label="classify-prod" meta="2m 04s" status="run" />
//   <ZebraRow rowId="r_8a13" label="…" parity="odd" state="selected" />
//
// `state` is a static-showcase prop — for interactive use the consumer
// wires real :hover / :focus / aria-selected on the host, and the
// descendant selectors below take care of the rest.

import type { HTMLAttributes, ReactNode } from 'react'

export type ZebraRowStatus = 'run' | 'ok' | 'err' | 'warn' | 'idle'
export type ZebraRowState = 'rest' | 'hover' | 'selected' | 'focus'
export type ZebraRowParity = 'even' | 'odd'

export type ZebraRowProps = {
  rowId: string
  label: ReactNode
  meta?: ReactNode
  status?: ZebraRowStatus
  parity?: ZebraRowParity
  state?: ZebraRowState
} & Omit<HTMLAttributes<HTMLDivElement>, 'id'>

// Grid mirrors the source `.rrow`: 56px id · flex label · auto meta ·
// auto stat. 12px column gap. 6/10 px y/x padding. 7px resting radius
// (selected state will override to 10px).
const rowBaseCx =
  'grid grid-cols-[56px_minmax(0,1fr)_auto_auto] items-center gap-3 ' +
  'px-2.5 py-1.5 rounded-[7px] font-mono text-[11.5px] text-ink ' +
  'transition-[background-color,border-radius] duration-[120ms] ' +
  'bg-row-base data-[parity=odd]:bg-row-zebra'

// State overrides — additive on top of base + parity. `!` ensures
// these win over the parity-conditional bg in source-order.
const stateCx: Record<ZebraRowState, string> = {
  rest: '',
  hover: 'bg-row-hover! data-[parity=odd]:bg-row-hover!',
  selected:
    'bg-row-selected! data-[parity=odd]:bg-row-selected! rounded-[10px]! ' +
    'text-row-selected-fg [&>*]:text-row-selected-fg [&>*]:opacity-100',
  focus: 'outline-2 outline-accent -outline-offset-2',
}

const idCx = 'text-[10.5px] text-muted opacity-70 whitespace-nowrap'
const labelCx =
  'font-medium overflow-hidden text-ellipsis whitespace-nowrap'
const metaCx = 'text-[9.5px] text-muted tracking-[0.04em] whitespace-nowrap'
const statBase =
  'text-[9px] tracking-[0.04em] uppercase text-muted whitespace-nowrap'

// Status text colors — inline literals per `staging/design.md`'s rule
// (tokens.css is for surface chrome only; status hexes stay at the use
// site so a `grep '#1f8f4a'` tells the truth about which buckets a
// page touches). `ok` and `idle` keep the muted base; `idle` is dimmed
// further to read as queued/sand.
const statusInk: Record<ZebraRowStatus, string> = {
  run: 'text-[#1f8f4a]!',
  ok: '',
  err: 'text-[#c8513b]!',
  warn: 'text-[#c0922e]!',
  idle: 'opacity-70',
}

// Default visible status text. Consumers can pass `meta` for time/size
// columns; the status word is rendered from the bucket name itself.
const statusLabel: Record<ZebraRowStatus, string> = {
  run: 'running',
  ok: 'ok',
  err: 'error',
  warn: 'stale',
  idle: 'queued',
}

export const ZebraRow = ({
  rowId,
  label,
  meta,
  status,
  parity = 'even',
  state = 'rest',
  className,
  ...rest
}: ZebraRowProps) => {
  const cx = `${rowBaseCx} ${stateCx[state]}${className ? ` ${className}` : ''}`
  return (
    <div
      role="row"
      data-parity={parity}
      data-state={state}
      className={cx}
      {...rest}
    >
      <span className={idCx}>{rowId}</span>
      <span className={labelCx}>{label}</span>
      <span className={metaCx}>{meta}</span>
      {status ? (
        <span className={`${statBase} ${statusInk[status]}`}>
          {statusLabel[status]}
        </span>
      ) : (
        <span aria-hidden="true" />
      )}
    </div>
  )
}
