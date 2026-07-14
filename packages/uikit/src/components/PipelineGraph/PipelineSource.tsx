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
import type { GraphNode, NodeStatus, PipelineGraphData, StatusOverlay } from './types'

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
  className?: string
}

type Tab = 'pipeline' | 'node' | 'code'

const ALL_STATUSES: NodeStatus[] = ['idle', 'running', 'waiting', 'ok', 'error', 'stale']

export function PipelineSource({ graph, selectedNodeId, onSelectNode, statusById, onRun, className }: PipelineSourceProps) {
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
          <PipelineStatus graph={graph} statusById={statusById} onRun={onRun} />
          <CodeBlock code={graph.code} ariaLabel={`${graph.id}.py`} />
        </Pane>
      )}
      {tab === 'node' && node && (
        <div className="flex-1 min-h-0 overflow-auto">
          <NodeStatusPanel node={node} ov={statusById?.[node.id]} onRun={onRun} />
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

function PipelineStatus({ graph, statusById, onRun }: { graph: PipelineGraphData; statusById?: StatusOverlay; onRun?: (t: RunTarget) => void }) {
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
        {onRun && <RunButton onClick={() => onRun({ kind: 'pipeline' })} />}
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

// ── node status (NODE tab) — status row + error ─────────────────────────────

function NodeStatusPanel({ node, ov, onRun }: { node: GraphNode; ov?: StatusOverlay[string]; onRun?: (t: RunTarget) => void }) {
  const status = (ov?.status ?? node.status ?? 'idle') as NodeStatus
  const st = STATUS[status]
  const duration = ov?.duration ?? node.duration
  const rows = ov?.rows ?? node.rows
  const progress = status === 'running' ? (ov?.progress ?? node.progress) : null
  const error = ov?.error
  const showRun = onRun && node.kind === 'review'
  return (
    <section className="shrink-0 px-3 pt-3 pb-2.5 border-b border-uikit-faint flex flex-col gap-2" style={{ fontFamily: 'var(--font-uikit-mono)' }}>
      <span className="text-[12px] font-semibold text-uikit-ink truncate" style={{ fontFamily: 'var(--font-uikit-ui)', letterSpacing: '-.01em' }}>
        {node.title}
      </span>
      <div
        className="flex items-center gap-2.5 px-2.5 py-2 rounded-md"
        style={{ background: 'color-mix(in oklab, var(--color-uikit-ink) 4%, transparent)' }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 4, background: st.color, flexShrink: 0 }} />
        <span className="text-[12px] font-semibold" style={{ color: st.color, letterSpacing: '.02em' }}>{st.label}</span>
        <span className="flex-1" />
        {progress != null && <span className="text-[11px] text-uikit-muted">{Math.round(progress * 100)}%</span>}
        {duration != null && <span className="text-[11px] text-uikit-muted">{duration < 60 ? `${duration.toFixed(1)}s` : `${(duration / 60).toFixed(1)}m`}</span>}
        {rows != null && <span className="text-[11px] text-uikit-muted">· {rows} rows</span>}
        {showRun && <RunButton onClick={() => onRun!({ kind: 'node', id: node.id })} />}
      </div>
      {error && (
        <div className="text-[11px] leading-[1.5] whitespace-pre-wrap break-words" style={{ color: 'var(--color-uikit-tone-red)' }}>
          {error}
        </div>
      )}
    </section>
  )
}

// ── Run button (design: ▶ RUN, ink pill) ────────────────────────────────────

function RunButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="cursor-pointer border-0"
      style={{
        fontFamily: 'var(--font-uikit-mono)', fontSize: 11, fontWeight: 600,
        color: 'var(--color-uikit-panel)', background: 'var(--color-uikit-ink)',
        padding: '4px 10px', borderRadius: 4, letterSpacing: '.04em', textTransform: 'uppercase',
        flexShrink: 0,
      }}
    >
      ▶ run
    </button>
  )
}
