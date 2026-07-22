/**
 * WorkflowGraph — a vertical "metro map" of a workflow run trace. Pure and
 * presentational: phase bands stack top-down (header row + a wrapping grid of
 * agent node cards), joined by a central spine with smooth bezier fan-out /
 * fan-in edges (SVG underlay). Re-render with each trace snapshot and the graph
 * grows in place while a run is live.
 *
 * Visual language mirrors the app's workflow-editor canvas so the two surfaces
 * read as one product: a full-bleed dot-grid plane, editor-style rounded node
 * cards (12px radius, kind/state left accent, floating shadow), and bezier
 * edges — phases are delimited by band-header typography, spacing, and the
 * spine, not by boxed bands.
 *
 * Skeleton mode (`skeleton`, or no agents at all) renders one dashed ghost
 * node per declared phase — the ordering is real, the run hasn't happened.
 *
 * The container scrolls vertically like a document — no pan/zoom (v1). With
 * `fillHeight` the dot-grid plane fills the viewport and short graphs (skeleton,
 * small runs) center vertically so a full-height column shows no whitespace.
 * The page owns agent detail (promptPreview / resultPreview): this component
 * only reports clicks via `onSelectAgent` and draws the `selectedAgentId` ring.
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
  /** Fill the host's full height: the dot-grid plane grows to the viewport and
   *  a graph shorter than the viewport is centred vertically (no bottom
   *  whitespace in skeleton / small-run / empty states). Additive — the default
   *  keeps the classic document-flow behaviour. */
  fillHeight?: boolean
  className?: string
}

// Injected once — progress pulse (HTML dot) + marching-dash flow (SVG edges).
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

// Node card size (editor-matched ~200 × 70, 12px radius) and metro geometry.
const CARD_W = 200
const CARD_H = 70
const GAP_X = 14
const FAN = 40       // vertical run between a spine junction and a card edge —
                     // the bezier fan curves live in this band; generous so the
                     // curves read as curves (and help fill height).
const ROW_GAP = 14   // spine length between a row's fan-in and the next fan-out
const HEADER_H = 40
const BAND_GAP = 22  // spine length between a band's fan-in and the next header
const PAD_X = 16
const PAD_Y = 14
const RADIUS = 12    // card corner radius (matches the editor's node cards)
const ACCENT_W = 4   // kind/state left-accent bar width (editor treatment)

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
  fanOutY: number // spine junction the row's cards fan OUT from (top)
  fanInY: number  // spine junction the row's cards fan IN to (bottom)
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
      const fanOutY = y
      const cardTop = fanOutY + FAN
      const x0 = (w - (slice.length * cardW + (slice.length - 1) * GAP_X)) / 2
      rows.push({
        fanOutY,
        fanInY: cardTop + CARD_H + FAN,
        cards: slice.map((a, ci) => ({
          agent: a,
          detail: a ? null : spec.detail,
          key: a ? (a.agentId ?? `i${a.index}`) : `ghost-${bands.length}`,
          x: x0 + ci * (cardW + GAP_X),
          y: cardTop,
          cx: x0 + ci * (cardW + GAP_X) + cardW / 2,
        })),
      })
      y = cardTop + CARD_H + FAN
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

  // Spine segments: cap → station → (rows…) → next station → … → cap. A segment
  // feeding a band with an in-progress agent animates (marching dashes) — the
  // run is flowing into that phase right now.
  const segments: SpineSeg[] = []
  let cursor = capTop + 3.5
  for (const b of bands) {
    segments.push({ y1: cursor, y2: b.stationY - 5.5, active: b.hasProgress })
    cursor = b.stationY + 5.5
    for (const row of b.rows) {
      segments.push({ y1: cursor, y2: row.fanOutY, active: b.hasProgress })
      cursor = row.fanInY
    }
  }
  if (bands.length > 0) segments.push({ y1: cursor, y2: capBottom - 4.5, active: false })

  return { bands, segments, centerX, cardW, height, capTop, capBottom }
}

/** Vertical cubic bezier — control points pushed along y so the curve leaves
 *  and enters its endpoints vertically (the vertical cousin of the editor's
 *  horizontal edge routing). A centred card (x1 === x2) draws a straight line. */
function fanPath(x1: number, y1: number, x2: number, y2: number): string {
  const dy = Math.max(14, (y2 - y1) * 0.5)
  return `M ${x1} ${y1} C ${x1} ${y1 + dy} ${x2} ${y2 - dy} ${x2} ${y2}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorkflowGraph({
  phases, agents, status, defaultModel, skeleton, selectedAgentId, onSelectAgent, fillHeight, className,
}: WorkflowGraphProps) {
  useInjectedStyles()

  // Cards wrap to the container's live width (the panel hosting this can be
  // narrow); 640 covers the pre-measure first paint. Height is measured too so
  // `fillHeight` can centre a short graph in the viewport.
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setSize({ w: el.clientWidth, h: el.clientHeight })
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setSize({ w: e.contentRect.width, h: e.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const w = size.w || 640

  const allGhost = !!skeleton || agents.length === 0
  const layout = useMemo(
    () => layoutGraph(phases, agents, w, allGhost),
    [phases, agents, w, allGhost],
  )
  const { bands, segments, centerX, cardW, height, capTop, capBottom } = layout

  // Full-bleed dotted canvas plane — the editor's visual language (app bg + a
  // faint 22px dot grid), not a boxed/tinted band.
  const planeBg = {
    backgroundColor: 'var(--color-uikit-bg)',
    backgroundImage:
      'radial-gradient(circle, var(--color-uikit-faint) 1.2px, transparent 1.2px)',
    backgroundSize: '22px 22px',
  } as const

  if (bands.length === 0) {
    return (
      <div
        ref={containerRef}
        className={cn('relative w-full h-full overflow-y-auto overflow-x-hidden', className)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-uikit-mono)', fontSize: 11, color: 'var(--color-uikit-muted)',
          ...planeBg,
        }}
      >
        no phases declared
      </div>
    )
  }

  const capColor = allGhost ? SPINE_C : (status && RUN_STATUS[status]) || SPINE_C

  // Plane fills the viewport when asked; a graph shorter than the viewport is
  // centred (offsetY) so skeleton / small-run states leave no bottom whitespace.
  const planeH = fillHeight ? Math.max(size.h, height) : height
  const offsetY = fillHeight && size.h > height ? Math.round((size.h - height) / 2) : 0

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={`workflow run graph${status ? ` (${status})` : ''}`}
      className={cn('relative w-full h-full overflow-y-auto overflow-x-hidden', className)}
    >
      <div style={{ position: 'relative', width: '100%', height: planeH, ...planeBg }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: offsetY, height }}>
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

            {/* Bezier fan-out / fan-in edges, band by band. */}
            {bands.map((b, bi) => (
              <g key={`band-${bi}`}>
                {b.rows.map((row, ri) => (
                  <g key={`row-${ri}`}>
                    {row.cards.map(card => {
                      const st = card.agent ? AGENT_STATE[card.agent.state] ?? AGENT_STATE.queued : null
                      const progress = card.agent?.state === 'progress'
                      const stroke = st ? st.color : SPINE_C
                      const dash = progress ? '5 4' : card.agent == null ? '3 4' : card.agent.state === 'queued' ? '3 5' : undefined
                      const anim = progress ? 'dl-wf-flow' : undefined
                      return (
                        <g key={card.key} opacity={card.agent ? 1 : 0.7}>
                          <path
                            d={fanPath(centerX, row.fanOutY, card.cx, card.y)}
                            fill="none" stroke={stroke} strokeWidth={1.6}
                            strokeDasharray={dash} strokeLinecap="round" className={anim}
                          />
                          <path
                            d={fanPath(card.cx, card.y + CARD_H, centerX, row.fanInY)}
                            fill="none" stroke={stroke} strokeWidth={1.6}
                            strokeDasharray={dash} strokeLinecap="round" className={anim}
                          />
                        </g>
                      )
                    })}
                  </g>
                ))}
                {/* Phase station — the metro stop on the spine, inside the header. */}
                <circle
                  cx={centerX} cy={b.stationY} r={5.5}
                  fill="var(--color-uikit-bg)"
                  stroke={b.color} strokeWidth={2}
                  opacity={b.ghost ? 0.8 : 1}
                />
              </g>
            ))}
          </svg>

          {/* Band headers — title · done/total on the left, band duration right;
              the centre stays clear for the spine station. Phases are delimited
              by this typography + spacing + the spine, not a boxed band. */}
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
    </div>
  )
}

// ---------------------------------------------------------------------------
// Node card — editor-matched: 12px radius, a kind/state left-accent bar, a
// floating shadow on the dot-grid plane. Line 1: state dot · label · model
// chip; line 2: tokens · duration · retry badge.
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
  const bg = 'var(--color-uikit-bg)'
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
        // Cards sit on the dot-grid plane and read via border + shadow (like the
        // editor); a whisper of the state tint keeps state legible at a glance.
        background: quiet ? bg : `color-mix(in srgb, ${bg} 93%, ${st.color})`,
        border: `1px solid ${
          selected
            ? 'var(--color-uikit-accent)'
            : quiet
              ? 'var(--color-uikit-faint)'
              : `color-mix(in srgb, var(--color-uikit-faint) 55%, ${st.color})`
        }`,
        borderRadius: RADIUS,
        padding: '10px 12px 9px 14px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        cursor: onSelect ? 'pointer' : 'default',
        boxShadow: selected
          ? '0 0 0 3px color-mix(in srgb, var(--color-uikit-accent) 28%, transparent), 0 6px 18px rgba(0,0,0,.10)'
          : '0 2px 8px rgba(0,0,0,.06)',
        transition: 'border-color 120ms ease, box-shadow 120ms ease, background 120ms ease',
        fontFamily: 'var(--font-uikit-mono)',
        outline: 'none',
        // No overflow:hidden — the accent bar hugs the rounded left edge and the
        // title clips its own overflow for the ellipsis.
      }}
    >
      {/* Kind/state left-accent bar (editor treatment). */}
      <span style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: ACCENT_W,
        background: st.color, borderRadius: `${RADIUS}px 0 0 ${RADIUS}px`,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
        <span
          className={agent.state === 'progress' ? 'dl-wf-pulse' : undefined}
          style={{ width: 7, height: 7, borderRadius: 999, background: st.color, flexShrink: 0 }}
        />
        <span style={{
          fontSize: 13, fontWeight: 600, color: 'var(--color-uikit-ink)', letterSpacing: '-.01em',
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, fontSize: 10, color: 'var(--color-uikit-muted)' }}>
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

// Skeleton ghost — one per declared-but-unrun phase: dashed, muted, showing the
// phase's meta detail (if any) so the skeleton still explains itself. Matches
// the agent card's geometry (12px radius) so the skeleton reads as the same
// surface, just un-run.
function GhostCard({ x, y, w, detail }: { x: number; y: number; w: number; detail: string | null }) {
  return (
    <div
      style={{
        position: 'absolute', left: x, top: y, width: w, height: CARD_H,
        border: '1px dashed var(--color-uikit-faint-dashed, var(--color-uikit-muted))',
        borderRadius: RADIUS,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '8px 14px', textAlign: 'center',
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
