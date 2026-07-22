/**
 * WorkflowGraph — a vertical "metro map" of a workflow run trace. Pure and
 * presentational: phase bands stack top-down (header row + a wrapping grid of
 * agent node cards), joined by a central spine with orthogonal fan-out /
 * fan-in stubs (SVG underlay, rounded elbows — the vertical cousin of
 * PipelineGraph's edge routing). Re-render with each trace snapshot and the
 * graph grows in place while a run is live.
 *
 * Skeleton mode (`skeleton`, or no agents at all) renders one dashed ghost
 * node per declared phase — the ordering is real, the run hasn't happened.
 *
 * The container scrolls vertically like a document — no pan/zoom (v1). The
 * page owns agent detail (promptPreview / resultPreview): this component only
 * reports clicks via `onSelectAgent` and draws the `selectedAgentId` ring.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import type { WorkflowAgentNode, WorkflowAgentState, WorkflowPhase, WorkflowRunStatus } from './types'

export interface WorkflowGraphProps {
  /** Declared (meta) or traced (run) phases, in band order. */
  phases: WorkflowPhase[]
  /** Fanned-out agents from the run trace; empty ⇒ skeleton rendering. */
  agents: WorkflowAgentNode[]
  /** Overall run status — colours the spine's bottom terminus. */
  status?: WorkflowRunStatus
  /** Run-wide default model; an agent's model chip only shows when it differs. */
  defaultModel?: string | null
  /** Force skeleton (ghost) rendering even when agents exist. */
  skeleton?: boolean
  /** Highlight ring — matched against `agentId`, falling back to
   *  `String(index)` for agents the trace gave no id. */
  selectedAgentId?: string | null
  onSelectAgent?: (agent: WorkflowAgentNode) => void
  className?: string
}

// Injected once — progress pulse (HTML dot) + marching-dash flow (SVG stubs).
const CSS = `
@keyframes dlWfPulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--color-uikit-tone-blue) 45%,transparent)}50%{box-shadow:0 0 0 5px transparent}}
.dl-wf-pulse{animation:dlWfPulse 1.6s ease-in-out infinite}
@keyframes dlWfFlow{to{stroke-dashoffset:-20}}
.dl-wf-flow{animation:dlWfFlow 1s linear infinite}
`
function useInjectedStyles() {
  useEffect(() => {
    const ID = 'dl-workflow-graph-styles'
    if (document.getElementById(ID)) return
    const el = document.createElement('style')
    el.id = ID
    el.textContent = CSS
    document.head.appendChild(el)
  }, [])
}

// Node card size (spec: ~200 × 64) and metro geometry.
const CARD_W = 200
const CARD_H = 64
const GAP_X = 12
const STUB = 14      // vertical run between a bus line and a card edge
const ROW_GAP = 10   // spine length between a row's fan-in and the next fan-out
const HEADER_H = 40
const BAND_GAP = 18  // spine length between a band's fan-in and the next header
const PAD_X = 16
const PAD_Y = 12
const ELBOW_R = 8    // rounded-corner radius where a bus turns into a stub

const SPINE_C = 'var(--color-uikit-ink-50)'

/** Agent state → accent colour (uikit tone token, theme-aware). */
const AGENT_STATE: Record<WorkflowAgentState, { label: string; color: string }> = {
  queued: { label: 'queued', color: 'var(--color-uikit-tone-warm-gray)' },
  progress: { label: 'in progress', color: 'var(--color-uikit-tone-blue)' },
  done: { label: 'done', color: 'var(--color-uikit-tone-green)' },
  error: { label: 'error', color: 'var(--color-uikit-tone-red)' },
}

/** Run status → bottom-terminus colour. */
const RUN_STATUS: Record<string, string> = {
  running: 'var(--color-uikit-tone-blue)',
  completed: 'var(--color-uikit-tone-green)',
  killed: 'var(--color-uikit-tone-red)',
  error: 'var(--color-uikit-tone-red)',
}

/** Compact token count: 950 · 96k · 1.2M. */
function fmtTokens(n: number | null | undefined): string | null {
  if (n == null || !Number.isFinite(n) || n < 0) return null
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`
  if (n >= 1000) return `${Math.round(n / 1000)}k`
  return String(n)
}

/** Compact duration: 800ms → 1s · 137s → 2m17s · 64m → 1h4m. */
function fmtDuration(ms: number | null | undefined): string | null {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return null
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m${s % 60 ? `${s % 60}s` : ''}`
  return `${Math.floor(m / 60)}h${m % 60 ? `${m % 60}m` : ''}`
}

// ---------------------------------------------------------------------------
// Layout — pure geometry, memoised on (phases, agents, width, skeleton).
// ---------------------------------------------------------------------------

interface BandSpec {
  title: string
  detail: string | null
  agents: WorkflowAgentNode[]
}

/**
 * Group agents into phase bands. Declared phases keep their order (by `index`,
 * falling back to array position); agents whose `phaseIndex` matches no
 * declared phase get synthetic bands appended after (titled from `phaseTitle`)
 * so a drifted trace still renders every agent.
 */
function bandSpecs(phases: WorkflowPhase[], agents: WorkflowAgentNode[]): BandSpec[] {
  const declared = phases.map((p, i) => ({
    key: p.index ?? i,
    title: p.title,
    detail: p.detail ?? null,
    agents: [] as WorkflowAgentNode[],
  }))
  const byKey = new Map(declared.map(d => [d.key, d]))
  const strays = new Map<number | null, WorkflowAgentNode[]>()
  for (const a of agents) {
    const band = a.phaseIndex != null ? byKey.get(a.phaseIndex) : undefined
    if (band) band.agents.push(a)
    else {
      const k = a.phaseIndex ?? null
      strays.set(k, [...(strays.get(k) ?? []), a])
    }
  }
  const extra: BandSpec[] = [...strays.entries()]
    .sort((a, b) => (a[0] ?? Infinity) - (b[0] ?? Infinity))
    .map(([k, list]) => ({
      title: list[0].phaseTitle ?? (k != null ? `phase ${k + 1}` : 'agents'),
      detail: null,
      agents: list,
    }))
  const bands = [...declared].sort((a, b) => a.key - b.key).concat(
    extra.map(e => ({ key: Infinity, ...e })),
  )
  for (const b of bands) b.agents.sort((x, y) => x.index - y.index)
  return bands
}

interface CardLayout {
  agent: WorkflowAgentNode | null // null = skeleton ghost
  detail: string | null           // ghost body text (the phase's meta detail)
  key: string
  x: number
  y: number
  cx: number
}
interface RowLayout {
  busTop: number
  busBottom: number
  cards: CardLayout[]
}
interface BandLayout {
  title: string
  ghost: boolean
  headerTop: number
  stationY: number
  rows: RowLayout[]
  done: number
  total: number
  durationMs: number | null
  color: string
  hasProgress: boolean
}
interface SpineSeg {
  y1: number
  y2: number
  active: boolean // feeding a band that's currently in progress → animated
}

function layoutGraph(
  phases: WorkflowPhase[], agents: WorkflowAgentNode[], w: number, allGhost: boolean,
) {
  const centerX = w / 2
  const contentW = Math.max(140, w - PAD_X * 2)
  const cardW = Math.min(CARD_W, contentW)
  const cols = Math.max(1, Math.floor((contentW + GAP_X) / (cardW + GAP_X)))

  const bands: BandLayout[] = []
  const capTop = PAD_Y + 4
  let y = capTop + 10
  for (const spec of bandSpecs(phases, agents)) {
    if (bands.length > 0) y += BAND_GAP
    const headerTop = y
    const stationY = headerTop + HEADER_H / 2
    y += HEADER_H
    const ghost = allGhost || spec.agents.length === 0
    const items: (WorkflowAgentNode | null)[] = ghost ? [null] : spec.agents
    const rows: RowLayout[] = []
    for (let r = 0; r * cols < items.length; r++) {
      const slice = items.slice(r * cols, (r + 1) * cols)
      if (r > 0) y += ROW_GAP
      const busTop = y
      const cardTop = busTop + STUB
      const x0 = (w - (slice.length * cardW + (slice.length - 1) * GAP_X)) / 2
      rows.push({
        busTop,
        busBottom: cardTop + CARD_H + STUB,
        cards: slice.map((a, ci) => ({
          agent: a,
          detail: a ? null : spec.detail,
          key: a ? (a.agentId ?? `i${a.index}`) : `ghost-${bands.length}`,
          x: x0 + ci * (cardW + GAP_X),
          y: cardTop,
          cx: x0 + ci * (cardW + GAP_X) + cardW / 2,
        })),
      })
      y = cardTop + CARD_H + STUB
    }
    const done = spec.agents.filter(a => a.state === 'done').length
    const hasProgress = !allGhost && spec.agents.some(a => a.state === 'progress')
    const hasError = !allGhost && spec.agents.some(a => a.state === 'error')
    const total = spec.agents.length
    // Band duration ~ the slowest agent (they fan out in parallel).
    const durs = spec.agents.map(a => a.durationMs).filter((d): d is number => d != null && Number.isFinite(d))
    bands.push({
      title: spec.title,
      ghost,
      headerTop,
      stationY,
      rows,
      done,
      total,
      durationMs: durs.length ? Math.max(...durs) : null,
      color: hasError
        ? 'var(--color-uikit-tone-red)'
        : hasProgress
          ? 'var(--color-uikit-tone-blue)'
          : total > 0 && done === total && !allGhost
            ? 'var(--color-uikit-tone-green)'
            : 'var(--color-uikit-muted)',
      hasProgress,
    })
  }

  const capBottom = y + 18
  const height = capBottom + 4 + PAD_Y

  // Spine segments: cap → station → bus → (rows…) → next station → … → cap.
  // A segment feeding a band with an in-progress agent animates (marching
  // dashes) — the run is flowing into that phase right now.
  const segments: SpineSeg[] = []
  let cursor = capTop + 3.5
  for (const b of bands) {
    segments.push({ y1: cursor, y2: b.stationY - 5.5, active: b.hasProgress })
    cursor = b.stationY + 5.5
    for (const row of b.rows) {
      segments.push({ y1: cursor, y2: row.busTop, active: b.hasProgress })
      cursor = row.busBottom
    }
  }
  if (bands.length > 0) segments.push({ y1: cursor, y2: capBottom - 4.5, active: false })

  return { bands, segments, centerX, cardW, height, capTop, capBottom }
}

/** Horizontal bus with quarter-turn ends toward the cards (dir +1 = cards
 *  below the bus, -1 = above). Stubs T-off the straight middle. */
function busPath(minX: number, maxX: number, busY: number, dir: 1 | -1): string {
  const r = Math.min(ELBOW_R, (maxX - minX) / 2)
  return (
    `M ${minX} ${busY + dir * r}` +
    ` Q ${minX} ${busY} ${minX + r} ${busY}` +
    ` L ${maxX - r} ${busY}` +
    ` Q ${maxX} ${busY} ${maxX} ${busY + dir * r}`
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorkflowGraph({
  phases, agents, status, defaultModel, skeleton, selectedAgentId, onSelectAgent, className,
}: WorkflowGraphProps) {
  useInjectedStyles()

  // Cards wrap to the container's live width (the panel hosting this can be
  // narrow); 640 covers the pre-measure first paint.
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setWidth(el.clientWidth)
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setWidth(e.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const w = width || 640

  const allGhost = !!skeleton || agents.length === 0
  const layout = useMemo(
    () => layoutGraph(phases, agents, w, allGhost),
    [phases, agents, w, allGhost],
  )
  const { bands, segments, centerX, cardW, height, capTop, capBottom } = layout

  if (bands.length === 0) {
    return (
      <div
        ref={containerRef}
        className={cn('relative w-full h-full overflow-y-auto overflow-x-hidden', className)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-uikit-mono)', fontSize: 11, color: 'var(--color-uikit-muted)',
          backgroundColor: 'var(--color-uikit-canvas-bg, var(--color-uikit-panel))',
        }}
      >
        no phases declared
      </div>
    )
  }

  const capColor = allGhost ? SPINE_C : (status && RUN_STATUS[status]) || SPINE_C

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={`workflow run graph${status ? ` (${status})` : ''}`}
      className={cn('relative w-full h-full overflow-y-auto overflow-x-hidden', className)}
    >
      <div
        style={{
          position: 'relative', width: '100%', height,
          // Same dotted canvas plane as PipelineGraph (static — no pan/zoom).
          backgroundColor: 'var(--color-uikit-canvas-bg, var(--color-uikit-panel))',
          backgroundImage: 'radial-gradient(circle, var(--color-uikit-canvas-dot, var(--color-uikit-faint)) 1.2px, transparent 1.5px)',
          backgroundSize: '20px 20px',
        }}
      >
        <svg width={w} height={height} className="absolute top-0 left-0 pointer-events-none overflow-visible">
          {/* Central spine (+ terminus caps). Skeleton runs render it dashed. */}
          {segments.map((s, i) => (
            <line
              key={`seg-${i}`}
              x1={centerX} y1={s.y1} x2={centerX} y2={s.y2}
              stroke={s.active ? 'var(--color-uikit-tone-blue)' : SPINE_C}
              strokeWidth={2}
              strokeDasharray={s.active ? '6 5' : allGhost ? '4 5' : undefined}
              strokeLinecap="round"
              className={s.active ? 'dl-wf-flow' : undefined}
              opacity={allGhost ? 0.7 : 1}
            />
          ))}
          <circle cx={centerX} cy={capTop} r={3.5} fill={SPINE_C} opacity={allGhost ? 0.7 : 1} />
          <circle
            cx={centerX} cy={capBottom} r={4.5}
            fill={capColor}
            className={!allGhost && status === 'running' ? 'dl-wf-pulse' : undefined}
            opacity={allGhost ? 0.7 : 1}
          />

          {/* Fan-out / fan-in buses + per-card stubs, band by band. */}
          {bands.map((b, bi) => (
            <g key={`band-${bi}`}>
              {b.rows.map((row, ri) => {
                const minCx = row.cards[0].cx
                const maxCx = row.cards[row.cards.length - 1].cx
                const multi = row.cards.length > 1
                const elbow = Math.min(ELBOW_R, (maxCx - minCx) / 2)
                return (
                  <g key={`row-${ri}`}>
                    {multi && (
                      <path
                        d={busPath(minCx, maxCx, row.busTop, 1)}
                        fill="none" stroke={SPINE_C} strokeWidth={1.4}
                        strokeDasharray={b.ghost ? '4 5' : undefined}
                        opacity={b.ghost ? 0.7 : 1}
                      />
                    )}
                    {multi && (
                      <path
                        d={busPath(minCx, maxCx, row.busBottom, -1)}
                        fill="none" stroke={SPINE_C} strokeWidth={1.4}
                        strokeDasharray={b.ghost ? '4 5' : undefined}
                        opacity={b.ghost ? 0.7 : 1}
                      />
                    )}
                    {row.cards.map(card => {
                      const st = card.agent ? AGENT_STATE[card.agent.state] ?? AGENT_STATE.queued : null
                      const progress = card.agent?.state === 'progress'
                      const stroke = st ? st.color : SPINE_C
                      // Outermost stubs start past the bus's rounded elbow.
                      const outer = multi && (card.cx === minCx || card.cx === maxCx)
                      const dash = progress ? '5 4' : card.agent == null ? '3 4' : card.agent.state === 'queued' ? '3 5' : undefined
                      const anim = progress ? 'dl-wf-flow' : undefined
                      return (
                        <g key={card.key} opacity={card.agent ? 1 : 0.7}>
                          <line
                            x1={card.cx} y1={row.busTop + (outer ? elbow : 0)}
                            x2={card.cx} y2={card.y}
                            stroke={stroke} strokeWidth={1.6} strokeDasharray={dash}
                            strokeLinecap="round" className={anim}
                          />
                          <line
                            x1={card.cx} y1={card.y + CARD_H}
                            x2={card.cx} y2={row.busBottom - (outer ? elbow : 0)}
                            stroke={stroke} strokeWidth={1.6} strokeDasharray={dash}
                            strokeLinecap="round" className={anim}
                          />
                        </g>
                      )
                    })}
                  </g>
                )
              })}
              {/* Phase station — the metro stop on the spine, inside the header. */}
              <circle
                cx={centerX} cy={b.stationY} r={5.5}
                fill="var(--color-uikit-panel)"
                stroke={b.color} strokeWidth={2}
                opacity={b.ghost ? 0.8 : 1}
              />
            </g>
          ))}
        </svg>

        {/* Band headers — title · done/total on the left, band duration right;
            the centre stays clear for the spine station. */}
        {bands.map((b, bi) => (
          <div
            key={`hdr-${bi}`}
            style={{
              position: 'absolute', left: PAD_X, top: b.headerTop,
              width: w - PAD_X * 2, height: HEADER_H,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontFamily: 'var(--font-uikit-mono)', pointerEvents: 'none',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, maxWidth: '44%', minWidth: 0 }}>
              <span
                title={b.title}
                style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase',
                  color: b.ghost ? 'var(--color-uikit-muted)' : 'var(--color-uikit-ink)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                {b.title}
              </span>
              {!b.ghost && (
                <span style={{ fontSize: 10, color: 'var(--color-uikit-muted)', flexShrink: 0 }}>
                  {b.done}/{b.total}
                </span>
              )}
            </span>
            <span style={{ fontSize: 10, color: 'var(--color-uikit-muted)', maxWidth: '28%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {b.ghost ? 'pending' : fmtDuration(b.durationMs) ?? ''}
            </span>
          </div>
        ))}

        {/* Agent node cards (+ skeleton ghosts). */}
        {bands.map(b =>
          b.rows.map(row =>
            row.cards.map(card =>
              card.agent ? (
                <AgentCard
                  key={card.key}
                  agent={card.agent}
                  x={card.x} y={card.y} w={cardW}
                  selected={
                    selectedAgentId != null &&
                    selectedAgentId === (card.agent.agentId ?? String(card.agent.index))
                  }
                  defaultModel={defaultModel}
                  onSelect={onSelectAgent}
                />
              ) : (
                <GhostCard key={card.key} x={card.x} y={card.y} w={cardW} detail={card.detail} />
              ),
            ),
          ),
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Node card — ~200×64, state accent (3px left border + status dot), second
// line tokens · duration · retry badge. Mirrors PipeNode's tinting.
// ---------------------------------------------------------------------------

function AgentCard({ agent, x, y, w, selected, defaultModel, onSelect }: {
  agent: WorkflowAgentNode
  x: number
  y: number
  w: number
  selected: boolean
  defaultModel?: string | null
  onSelect?: (agent: WorkflowAgentNode) => void
}) {
  const st = AGENT_STATE[agent.state] ?? AGENT_STATE.queued
  const quiet = agent.state === 'queued'
  const panel = 'var(--color-uikit-panel)'
  const label = agent.label || `agent #${agent.index}`
  const attempt = agent.attempt ?? 1
  const tokens = fmtTokens(agent.tokens)
  const duration = fmtDuration(agent.durationMs)
  const stats = [tokens, duration].filter(Boolean).join(' · ')

  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-pressed={onSelect ? selected : undefined}
      aria-label={`${label} — ${st.label}`}
      title={label}
      onClick={onSelect ? () => onSelect(agent) : undefined}
      onKeyDown={onSelect ? e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(agent)
        }
      } : undefined}
      style={{
        position: 'absolute', left: x, top: y, width: w, height: CARD_H,
        background: quiet ? panel : `color-mix(in srgb, ${panel} 92%, ${st.color})`,
        border: `1px solid ${
          selected
            ? 'var(--color-uikit-accent)'
            : quiet
              ? 'var(--color-uikit-faint)'
              : `color-mix(in srgb, var(--color-uikit-faint) 55%, ${st.color})`
        }`,
        borderLeft: `3px solid ${st.color}`,
        borderRadius: 7,
        padding: '9px 10px 8px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        cursor: onSelect ? 'pointer' : 'default',
        boxShadow: selected
          ? '0 0 0 2px color-mix(in srgb, var(--color-uikit-accent) 40%, transparent), 0 6px 18px rgba(0,0,0,.10)'
          : '0 1px 0 rgba(0,0,0,.04)',
        transition: 'border-color 120ms ease, box-shadow 120ms ease, background 120ms ease',
        fontFamily: 'var(--font-uikit-mono)',
        outline: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
        <span
          className={agent.state === 'progress' ? 'dl-wf-pulse' : undefined}
          style={{ width: 7, height: 7, borderRadius: 999, background: st.color, flexShrink: 0 }}
        />
        <span style={{
          fontSize: 12, fontWeight: 600, color: 'var(--color-uikit-ink)', letterSpacing: '-.005em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: 1,
        }}>{label}</span>
        {agent.model && agent.model !== defaultModel && (
          <span
            title={agent.model}
            style={{
              fontSize: 9, lineHeight: 1, color: 'var(--color-uikit-muted)',
              background: 'var(--color-uikit-chip)',
              border: '1px solid var(--color-uikit-faint)',
              borderRadius: 999, padding: '2px 6px', flexShrink: 1, minWidth: 0,
              maxWidth: '42%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            {agent.model}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, fontSize: 9.5, color: 'var(--color-uikit-muted)' }}>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {stats || st.label}
        </span>
        {attempt > 1 && (
          <span style={{
            fontSize: 9, fontWeight: 600, lineHeight: 1, flexShrink: 0,
            color: 'var(--color-uikit-tone-amber)',
            background: 'color-mix(in srgb, var(--color-uikit-tone-amber) 14%, transparent)',
            borderRadius: 4, padding: '2px 4px',
          }}>
            retry ×{attempt - 1}
          </span>
        )}
      </div>
    </div>
  )
}

// Skeleton ghost — one per declared-but-unrun phase: dashed, muted, showing
// the phase's meta detail (if any) so the skeleton still explains itself.
function GhostCard({ x, y, w, detail }: { x: number; y: number; w: number; detail: string | null }) {
  return (
    <div
      style={{
        position: 'absolute', left: x, top: y, width: w, height: CARD_H,
        border: '1px dashed var(--color-uikit-faint-dashed, var(--color-uikit-muted))',
        borderRadius: 7,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '8px 12px', textAlign: 'center',
        fontFamily: 'var(--font-uikit-mono)', fontSize: 10, color: 'var(--color-uikit-muted)',
        opacity: 0.8,
      }}
    >
      <span style={{
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {detail || 'pending'}
      </span>
    </div>
  )
}
