/**
 * PipelineSource — the read-only inspector that pairs with <PipelineGraph>.
 *
 * Tabs are contextual (design's PipeRightPanel):
 *  - nothing selected → one `PIPELINE` tab: pipeline status (counts + graph
 *    stats) on top, the full pipeline `.py` below.
 *  - a node selected → `NODE` (its execution status, default) + `CODE` (its
 *    source), plus `PIPELINE` to jump back (clears the selection).
 *
 * Pure and presentational: runtime status comes in via `statusById` (the same
 * overlay PipelineGraph takes); the Run button is a UI slot wired through
 * `onRun`. The tab bar matches the design's DLTabBar (UI-font text tabs over a
 * hairline with a sliding underline).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import { STATUS } from './flow'
import type { GraphNode, NodePreview, NodeStatus, PipelineGraphData, StatusOverlay } from './types'

/** What the Run button targets. Behaviour is the caller's (UI-only otherwise). */
export type RunTarget = { kind: 'pipeline' } | { kind: 'node'; id: string }

export interface PipelineSourceProps {
  graph: PipelineGraphData
  selectedNodeId?: string | null
  onSelectNode?: (id: string | null) => void
  /** Per-node runtime status (e.g. from the nodes endpoint). Drives the status
   *  panels; merged over each node's static `status`. */
  statusById?: StatusOverlay
  /** Run handler. When provided, a `▶ RUN` button shows on the PIPELINE tab and
   *  on a `review` node's NODE tab. */
  onRun?: (target: RunTarget) => void
  /** Continue the pipeline past a human-review node. When provided, a
   *  `▶ CONTINUE` button shows on a `review` node's NODE tab while it is
   *  `waiting`, so a human can release the pipeline to run downstream. */
  onContinue?: (nodeId: string) => void
  /** Whether a run is actively executing (host-controlled — e.g. the run driver's
   *  ticking flag). Drives the PIPELINE tab's RUN button into a disabled
   *  "running…" state. Left unset, the button stays clickable "▶ RUN". */
  running?: boolean
  /** The node a paused run is waiting on for human review. When set, the PIPELINE
   *  tab's RUN button becomes a `REVIEW` button that selects that node on click,
   *  so the reviewer can jump straight to it. Takes precedence over `running`. */
  reviewNodeId?: string | null
  /** The run has finished. Shows a `✓ DONE` marker in place of RUN (click to
   *  run again). */
  done?: boolean
  className?: string
}

type Tab = 'pipeline' | 'node' | 'code'

const ALL_STATUSES: NodeStatus[] = ['idle', 'running', 'waiting', 'ok', 'error', 'stale']

export function PipelineSource({ graph, selectedNodeId, onSelectNode, statusById, onRun, onContinue, running, reviewNodeId, done, className }: PipelineSourceProps) {
  const node = selectedNodeId ? graph.nodes[selectedNodeId] : null
  const [tab, setTab] = useState<Tab>('pipeline')

  // Selecting a node lands on NODE; clearing the selection lands on PIPELINE.
  useEffect(() => { setTab(node ? 'node' : 'pipeline') }, [selectedNodeId, node])

  const tabs: { key: Tab; label: string }[] = node
    ? [{ key: 'pipeline', label: 'PIPELINE' }, { key: 'node', label: 'NODE' }, { key: 'code', label: node.title }]
    : [{ key: 'pipeline', label: 'PIPELINE' }]

  // Sliding underline — measured from the active tab (design's DLTabBar).
  const wrapRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [bar, setBar] = useState({ left: 0, width: 0 })
  useEffect(() => {
    const el = tabRefs.current[tab]
    if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth })
  }, [tab, selectedNodeId, graph.id])

  const pick = (t: Tab) => {
    if (t === 'pipeline' && node) onSelectNode?.(null)
    setTab(t)
  }

  return (
    <div className={cn('flex flex-col h-full min-h-0', className)}>
      <div className="shrink-0 px-3 pt-2" style={{ maxWidth: '100%', overflow: 'hidden' }}>
        <div
          ref={wrapRef}
          className="relative inline-flex items-end gap-[18px] border-b border-uikit-faint"
          style={{ fontFamily: 'var(--font-uikit-ui)' }}
        >
          {tabs.map((t) => {
            const active = t.key === tab
            return (
              <button
                key={t.key}
                ref={(n) => { tabRefs.current[t.key] = n }}
                type="button"
                onClick={() => pick(t.key)}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = 'var(--color-uikit-ink)'; e.currentTarget.style.opacity = '1' } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.color = 'var(--color-uikit-muted)'; e.currentTarget.style.opacity = '0.75' } }}
                className="cursor-pointer border-0 bg-transparent whitespace-nowrap"
                style={{
                  height: 27, fontSize: 12, padding: '4px 0', fontWeight: 400, letterSpacing: '.02em',
                  color: active ? 'var(--color-uikit-ink)' : 'var(--color-uikit-muted)',
                  opacity: active ? 1 : 0.75,
                  transition: 'color 160ms ease, opacity 160ms ease',
                }}
              >
                {t.label}
              </button>
            )
          })}
          <span
            aria-hidden
            style={{
              position: 'absolute', left: bar.left, width: bar.width, bottom: -1, height: 2,
              background: 'var(--color-uikit-ink)', pointerEvents: 'none',
              transition: 'left 280ms cubic-bezier(.2,.7,.2,1), width 280ms cubic-bezier(.2,.7,.2,1)',
            }}
          />
        </div>
      </div>

      {tab === 'pipeline' && (
        <Pane>
          <PipelineStatus graph={graph} statusById={statusById} onRun={onRun} running={running} reviewNodeId={reviewNodeId} done={done} onSelectNode={onSelectNode} />
          <CodeBlock code={graph.code} ariaLabel={`${graph.id}.py`} />
        </Pane>
      )}
      {tab === 'node' && node && (
        <div className="flex-1 min-h-0 overflow-auto">
          <NodeDetails node={node} ov={statusById?.[node.id]} statusById={statusById} graph={graph} onContinue={onContinue} />
        </div>
      )}
      {tab === 'code' && node && (
        <CodeBlock code={node.code ?? ''} ariaLabel={`${node.title}.py`} />
      )}
    </div>
  )
}

// ── layout ───────────────────────────────────────────────────────────────────

function Pane({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 min-h-0 flex flex-col">{children}</div>
}

// ── code editor — read-only, line-number gutter + python highlight ──────────
// A small editor-style view (design's PipeCodeBlock): a sticky line-number
// gutter and a lightweight regex Python highlighter (theme-aware via uikit
// tone tokens). Read-only — this is a source inspector.

function CodeBlock({ code, ariaLabel }: { code: string; ariaLabel?: string }) {
  const lines = useMemo(() => pyHighlight(code), [code])
  return (
    <div
      className="flex-1 min-h-0 overflow-auto"
      aria-label={ariaLabel}
      style={{ fontFamily: 'var(--font-uikit-mono)', fontSize: 12, lineHeight: '18px', color: 'var(--color-uikit-ink)' }}
    >
      <div style={{ display: 'flex', minHeight: '100%' }}>
        <div
          aria-hidden
          style={{
            position: 'sticky', left: 0, zIndex: 1, flexShrink: 0,
            padding: '8px 8px 8px 12px', textAlign: 'right',
            color: 'var(--color-uikit-muted)', opacity: 0.5, userSelect: 'none',
            background: 'var(--color-uikit-panel)',
            borderRight: '1px solid var(--color-uikit-faint)',
          }}
        >
          {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
        </div>
        <div style={{ flex: 1, minWidth: 0, whiteSpace: 'pre', padding: '8px 12px' }}>
          {lines}
        </div>
      </div>
    </div>
  )
}

type Tok = { kind: string; t: string }

const PY_KEYWORDS = new Set([
  'def', 'return', 'import', 'from', 'as', 'if', 'else', 'elif', 'for', 'while',
  'in', 'is', 'not', 'and', 'or', 'lambda', 'class', 'with', 'try', 'except',
  'pass', 'raise', 'yield', 'await', 'async', 'True', 'False', 'None',
])
const PY_BUILTINS = new Set(['print', 'len', 'range', 'list', 'dict', 'set', 'tuple', 'str', 'int', 'float'])

/** Lightweight per-line Python highlighter (ported from the design prototype).
 *  Pure regex pass — not robust, but enough to read right. Returns one node per line. */
function pyHighlight(src: string): React.ReactNode[] {
  return src.split('\n').map((line, li) => {
    const tokens: Tok[] = []
    let i = 0
    while (i < line.length) {
      const ch = line[i]
      if (ch === '#') { tokens.push({ kind: 'cm', t: line.slice(i) }); break }
      if (ch === '"' || ch === "'") {
        if (line.slice(i, i + 3) === ch + ch + ch) {
          const close = line.indexOf(ch + ch + ch, i + 3)
          if (close === -1) { tokens.push({ kind: 's', t: line.slice(i) }); i = line.length; continue }
          tokens.push({ kind: 's', t: line.slice(i, close + 3) }); i = close + 3; continue
        }
        let j = i + 1
        while (j < line.length && line[j] !== ch) { if (line[j] === '\\') j++; j++ }
        tokens.push({ kind: 's', t: line.slice(i, j + 1) }); i = j + 1; continue
      }
      if (/\d/.test(ch)) {
        let j = i
        while (j < line.length && /[\d._]/.test(line[j])) j++
        tokens.push({ kind: 'n', t: line.slice(i, j) }); i = j; continue
      }
      if (/[A-Za-z_]/.test(ch)) {
        let j = i
        while (j < line.length && /[A-Za-z0-9_]/.test(line[j])) j++
        const word = line.slice(i, j)
        let kind = 'id'
        if (PY_KEYWORDS.has(word)) kind = 'kw'
        else if (PY_BUILTINS.has(word)) kind = 'bi'
        else if (line[j] === '(') kind = 'fn'
        tokens.push({ kind, t: word }); i = j; continue
      }
      if (ch === '@') {
        let j = i + 1
        while (j < line.length && /[A-Za-z0-9_.]/.test(line[j])) j++
        tokens.push({ kind: 'dec', t: line.slice(i, j) }); i = j; continue
      }
      tokens.push({ kind: 'p', t: ch }); i++
    }
    return (
      <div key={li} style={{ minHeight: 18 }}>
        {tokens.map((tok, ti) => (
          <span key={ti} style={pyTokStyle(tok.kind)}>{tok.t}</span>
        ))}
      </div>
    )
  })
}

function pyTokStyle(kind: string): React.CSSProperties {
  switch (kind) {
    case 'kw': return { color: 'var(--color-uikit-tone-purple)', fontWeight: 600 }
    case 'bi': return { color: 'var(--color-uikit-tone-green)' }
    case 'fn': return { color: 'var(--color-uikit-tone-blue)' }
    case 's': return { color: 'var(--color-uikit-tone-amber)' }
    case 'n': return { color: 'var(--color-uikit-tone-amber)' }
    case 'cm': return { color: 'var(--color-uikit-muted)', fontStyle: 'italic', opacity: 0.8 }
    case 'dec': return { color: 'var(--color-uikit-tone-red)' }
    case 'p': return { color: 'var(--color-uikit-ink)', opacity: 0.75 }
    default: return { color: 'var(--color-uikit-ink)' }
  }
}

// ── pipeline status (PIPELINE tab) — counts + graph stats ───────────────────

function PipelineStatus({ graph, statusById, onRun, running, reviewNodeId, done, onSelectNode }: { graph: PipelineGraphData; statusById?: StatusOverlay; onRun?: (t: RunTarget) => void; running?: boolean; reviewNodeId?: string | null; done?: boolean; onSelectNode?: (id: string | null) => void }) {
  const ids = Object.keys(graph.nodes)
  const counts = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<NodeStatus, number>
  for (const id of ids) {
    const s = statusById?.[id]?.status ?? graph.nodes[id].status ?? 'idle'
    counts[s] = (counts[s] ?? 0) + 1
  }
  return (
    <section className="shrink-0 px-3 pt-3 pb-2.5 border-b border-uikit-faint flex flex-col gap-2.5" style={{ fontFamily: 'var(--font-uikit-mono)' }}>
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-semibold text-uikit-ink truncate" style={{ fontFamily: 'var(--font-uikit-ui)', letterSpacing: '-.01em' }}>
          {graph.title}
        </span>
        <span className="flex-1" />
        {onRun && (
          reviewNodeId
            ? <ReviewButton onClick={() => onSelectNode?.(reviewNodeId)} />
            : done && !running
              ? <DoneButton onClick={() => onRun({ kind: 'pipeline' })} />
              : <RunButton running={running} onClick={() => onRun({ kind: 'pipeline' })} />
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '4px 12px' }}>
        {ALL_STATUSES.map((s) => (
          <span key={s} className="inline-flex items-center gap-2 text-[11px]">
            <span style={{ width: 6, height: 6, borderRadius: 3, background: STATUS[s].color, flexShrink: 0 }} />
            <span className="text-uikit-ink tabular-nums">{counts[s]}</span>
            <span className="text-uikit-muted">{STATUS[s].label}</span>
          </span>
        ))}
      </div>
      <div className="text-[10.5px] text-uikit-muted">
        {graph.nodeCount} nodes · {graph.edges.length} edges
      </div>
    </section>
  )
}

// ── node details (NODE tab) — status + i/o + schema + config + output ────────
// Ports the design's PipeDetailsTab: the status pill, an i/o block (each input
// port resolved to its upstream node, each output port to its downstream
// consumers), the result schema (columns), decorator config, and a runtime
// output summary. Everything but status comes straight off the static graph, so
// it reads even before a run.

function NodeDetails({
  node, ov, statusById, graph, onContinue,
}: {
  node: GraphNode
  ov?: StatusOverlay[string]
  statusById?: StatusOverlay
  graph: PipelineGraphData
  onContinue?: (nodeId: string) => void
}) {
  const status = (ov?.status ?? node.status ?? 'idle') as NodeStatus
  const st = STATUS[status]
  const duration = ov?.duration ?? node.duration
  const rows = ov?.rows ?? node.rows
  const progress = status === 'running' ? (ov?.progress ?? node.progress) : null
  const error = ov?.error
  const isReview = node.kind === 'review'
  const showContinue = onContinue && isReview && status === 'waiting'
  // A review node can only be released once every upstream node is `ok`.
  // No inputs → nothing to wait on. Drives the CONTINUE disabled state.
  const upstreamIds = graph.edges.filter((e) => e.to === node.id).map((e) => e.from)
  const upstreamReady = upstreamIds.every((id) => (statusById?.[id]?.status ?? graph.nodes[id]?.status ?? 'idle') === 'ok')

  // Resolve each port to the nodes on the other end (design's i/o lists).
  const inItems: [string, string][] = node.inputs.length === 0
    ? [['—', 'none']]
    : node.inputs.map((p) => {
        const e = graph.edges.find((e) => e.to === node.id && e.toPort === p)
        return [p, e ? (graph.nodes[e.from]?.title ?? e.from) : '—']
      })
  const outItems: [string, string][] = node.outputs.length === 0
    ? [['—', 'none']]
    : node.outputs.map((p) => {
        const dsts = graph.edges
          .filter((e) => e.from === node.id && e.fromPort === p)
          .map((e) => graph.nodes[e.to]?.title ?? e.to)
        return [p, dsts.length ? dsts.join(', ') : '—']
      })
  const columns = node.columns ?? []
  const configEntries = node.config ? Object.entries(node.config) : []

  return (
    <div className="flex flex-col gap-5 px-3 pt-3 pb-6" style={{ fontFamily: 'var(--font-uikit-mono)' }}>
      <span className="text-[13px] font-semibold text-uikit-ink" style={{ fontFamily: 'var(--font-uikit-ui)', letterSpacing: '-.015em' }}>
        {node.title}
      </span>

      {/* Status pill */}
      <div
        className="flex items-center gap-2.5 px-2.5 py-2 rounded-md"
        style={{ background: 'color-mix(in oklab, var(--color-uikit-ink) 4%, transparent)' }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 4, background: st.color, flexShrink: 0 }} />
        <span className="text-[12px] font-semibold" style={{ color: st.color, letterSpacing: '.02em' }}>{st.label}</span>
        <span className="flex-1" />
        {progress != null && <span className="text-[11px] text-uikit-muted">{Math.round(progress * 100)}%</span>}
        {status !== 'running' && duration != null && <span className="text-[11px] text-uikit-muted">{duration < 60 ? `${duration.toFixed(1)}s` : `${(duration / 60).toFixed(1)}m`}</span>}
        {rows != null && <span className="text-[11px] text-uikit-muted">· {fmtCount(rows)} rows</span>}
        {showContinue && <ContinueButton disabled={!upstreamReady} onClick={() => onContinue!(node.id)} />}
      </div>

      {/* i/o */}
      <div>
        <SectionLabel>i/o</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <KVList title="inputs" items={inItems} />
          <KVList title="outputs" items={outItems} />
        </div>
      </div>

      {/* Result schema (output columns) */}
      {columns.length > 0 && (
        <div>
          <SectionLabel>schema</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {columns.map((c) => (
              <span
                key={c}
                className="text-[11px]"
                style={{
                  color: 'var(--color-uikit-ink)', padding: '1px 7px', borderRadius: 3, lineHeight: '18px',
                  background: 'color-mix(in oklab, var(--color-uikit-ink) 6%, transparent)',
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Config (decorator kwargs) */}
      {configEntries.length > 0 && (
        <div>
          <SectionLabel>config</SectionLabel>
          <KVList items={configEntries.map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : String(v)])} />
        </div>
      )}

      {/* Output — runtime result: a sampled preview table once ok, else a
          status-keyed one-liner. */}
      <div>
        <SectionLabel>output</SectionLabel>
        <OutputSummary status={status} rows={rows ?? null} columns={columns} progress={progress} error={error ?? null} preview={ov?.preview ?? null} />
      </div>
    </div>
  )
}

// The runtime output — once `ok`, a sampled preview table (schema header + a
// few real-looking rows, supplied by the runner); otherwise a status-keyed
// one-liner.
function OutputSummary({
  status, rows, columns, progress, error, preview,
}: {
  status: NodeStatus
  rows: number | null
  columns: string[]
  progress?: number | null
  error: string | null
  preview?: NodePreview | null
}) {
  if (status === 'error') {
    return (
      <div className="text-[11px] leading-[1.5] whitespace-pre-wrap break-words" style={{ color: 'var(--color-uikit-tone-red)' }}>
        {error ?? 'failed'}
      </div>
    )
  }
  const muted = (t: string) => <span className="text-[11px] text-uikit-muted">{t}</span>
  if (status === 'ok') {
    if (preview && preview.columns.length > 0 && preview.rows.length > 0) {
      return <PreviewTable preview={preview} totalRows={rows} />
    }
    const cols = columns.length ? ` · ${columns.length} column${columns.length > 1 ? 's' : ''}` : ''
    return <span className="text-[11px] text-uikit-ink">{rows != null ? `${fmtCount(rows)} rows` : 'done'}{cols}</span>
  }
  if (status === 'running') return muted(`producing rows…${progress != null ? ` ${Math.round(progress * 100)}%` : ''}`)
  if (status === 'waiting') return muted('waiting for human review')
  if (status === 'stale') return muted('stale — upstream changed, re-run to refresh')
  return muted('not run yet')
}

// Rows shown before the "show all" expander kicks in.
const PREVIEW_ROWS = 10

// Sampled output preview (design's PipeOutputTab table): a caption + a bordered
// grid whose columns are the result schema and whose rows are the sample. Shows
// the first PREVIEW_ROWS rows with a toggle to expand downward to the full
// sample.
function PreviewTable({ preview, totalRows }: { preview: NodePreview; totalRows: number | null }) {
  const { columns, rows } = preview
  const [expanded, setExpanded] = useState(false)
  const total = preview.total ?? totalRows
  const cols = `repeat(${columns.length}, minmax(0, 1fr))`
  const canExpand = rows.length > PREVIEW_ROWS
  const shown = expanded ? rows : rows.slice(0, PREVIEW_ROWS)
  return (
    <div className="flex flex-col gap-2" style={{ fontFamily: 'var(--font-uikit-mono)' }}>
      <div className="flex items-baseline gap-2 text-[10.5px] text-uikit-muted">
        <span style={{ letterSpacing: '.06em', textTransform: 'uppercase', opacity: 0.7 }}>preview</span>
        <span style={{ opacity: 0.35 }}>·</span>
        <span>{shown.length} of {total != null ? fmtCount(total) : fmtCount(rows.length)} rows</span>
      </div>
      <div
        className="text-[10.5px]"
        style={{ border: '1px solid var(--color-uikit-faint)', borderRadius: 6, overflow: 'hidden' }}
      >
        <div
          style={{
            display: 'grid', gridTemplateColumns: cols,
            background: 'color-mix(in oklab, var(--color-uikit-ink) 4%, transparent)',
            fontWeight: 600, fontSize: 9.5, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--color-uikit-muted)',
          }}
        >
          {columns.map((c) => (
            <div key={c} className="truncate" style={{ padding: '6px 8px' }} title={c}>{c}</div>
          ))}
        </div>
        {shown.map((row, ri) => (
          <div
            key={ri}
            style={{ display: 'grid', gridTemplateColumns: cols, borderTop: '1px solid var(--color-uikit-faint)' }}
          >
            {columns.map((_, ci) => (
              <div key={ci} className="truncate text-uikit-ink" style={{ padding: '5px 8px' }} title={String(row[ci] ?? '')}>
                {String(row[ci] ?? '')}
              </div>
            ))}
          </div>
        ))}
      </div>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="cursor-pointer border-0 bg-transparent self-start text-[10.5px]"
          style={{ fontFamily: 'var(--font-uikit-mono)', color: 'var(--color-uikit-muted)', letterSpacing: '.02em', padding: '2px 0' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-uikit-ink)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-uikit-muted)' }}
        >
          {expanded ? '▴ collapse' : `▾ show all ${fmtCount(rows.length)} rows`}
        </button>
      )}
    </div>
  )
}

// ── small detail helpers (design's PipeSectionLabel / PipeKVList) ────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-2"
      style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-uikit-muted)', opacity: 0.55 }}
    >
      {children}
    </div>
  )
}

function KVList({ title, items }: { title?: string; items: [string, string][] }) {
  return (
    <div>
      {title && (
        <div className="mb-1.5" style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: '.04em', color: 'var(--color-uikit-muted)', opacity: 0.65 }}>
          {title}
        </div>
      )}
      <div className="flex flex-col gap-1">
        {items.map(([k, v], i) => (
          <div key={i} className="flex items-baseline gap-2 text-[11px]">
            <span style={{ color: 'var(--color-uikit-muted)', width: 56, flexShrink: 0 }}>{k}</span>
            <span style={{ color: 'var(--color-uikit-ink)', wordBreak: 'break-word' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Compact count (design's formatPipeCount): 1200 → 1.2k, 3_400_000 → 3.4M. */
function fmtCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

// ── Run button (design: ▶ RUN, ink pill) ────────────────────────────────────

function RunButton({ onClick, running, disabled }: { onClick: () => void; running?: boolean; disabled?: boolean }) {
  const off = !!running || !!disabled
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); if (!off) onClick() }}
      disabled={off}
      className="border-0"
      style={{
        fontFamily: 'var(--font-uikit-mono)', fontSize: 11, fontWeight: 600,
        color: off ? 'var(--color-uikit-muted)' : 'var(--color-uikit-panel)',
        background: off
          ? 'color-mix(in oklab, var(--color-uikit-ink) 8%, transparent)'
          : 'var(--color-uikit-ink)',
        padding: '4px 10px', borderRadius: 4, letterSpacing: '.04em', textTransform: 'uppercase',
        flexShrink: 0, cursor: off ? 'default' : 'pointer',
        // Disabled-because-upstream-not-ready reads as inert; the running state
        // keeps full opacity (it has the spinner to signal activity).
        opacity: disabled && !running ? 0.5 : 1,
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}
    >
      {running ? <><RunSpinner /> running…</> : '▶ run'}
    </button>
  )
}

// Shown in place of RUN once a run has finished — green to match the `ok` tone.
// Clicking runs the pipeline again.
function DoneButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick() }}
      title="Run again"
      className="cursor-pointer border-0"
      style={{
        fontFamily: 'var(--font-uikit-mono)', fontSize: 11, fontWeight: 600,
        color: 'var(--color-uikit-panel)', background: 'var(--color-uikit-tone-green)',
        padding: '4px 10px', borderRadius: 4, letterSpacing: '.04em', textTransform: 'uppercase',
        flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
      }}
    >
      ✓ done
    </button>
  )
}

// Shown in place of RUN when a run is paused on a human-review node — purple to
// match the `waiting` status tone. Clicking selects that node.
function ReviewButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="cursor-pointer border-0"
      style={{
        fontFamily: 'var(--font-uikit-mono)', fontSize: 11, fontWeight: 600,
        color: 'var(--color-uikit-panel)', background: 'var(--color-uikit-tone-purple)',
        padding: '4px 10px', borderRadius: 4, letterSpacing: '.04em', textTransform: 'uppercase',
        flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
      }}
    >
      ⏸ review
    </button>
  )
}

// Small inline spinner shown on the RUN button while a run is in progress.
function RunSpinner() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.7s" repeatCount="indefinite" />
      </path>
    </svg>
  )
}

// Continue past a waiting human-review node (design's affirmative pill) — green
// to read as "proceed", distinct from the ink RUN button.
function ContinueButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); if (!disabled) onClick() }}
      disabled={disabled}
      className="border-0"
      style={{
        fontFamily: 'var(--font-uikit-mono)', fontSize: 11, fontWeight: 600,
        color: 'var(--color-uikit-panel)', background: 'var(--color-uikit-tone-green)',
        padding: '4px 10px', borderRadius: 4, letterSpacing: '.04em', textTransform: 'uppercase',
        flexShrink: 0, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
      }}
    >
      ▶ continue
    </button>
  )
}
