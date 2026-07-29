import { useMemo } from 'react'
import { layoutWorkflow, type WfOrientation, type WfRect } from './layout'
import type { WorkflowSpec } from './spec'
import { WF_KIND_TOKEN } from './nodes/chrome'

// A static, non-interactive mini-render of a WorkflowSpec — the grid-card
// thumbnail twin of PipelineThumb. Reuses the real layout engine so the thumb
// is a faithful shrink of the canvas: stage hubs and members are the SAME
// PipeNode-identical card (panel fill + faint border + 7×7 kind dot + mono
// 12/600 name, distinguished only by the kind-dot colour, exactly like
// WorkflowCanvas), joined by the canvas's quiet idle-grey edges. Simplified
// straight-flow beziers (no hub routing / ports / label pills) — just enough to
// recognise a workflow's shape at card size.

const FONT = 12          // world-space node title size — matches the card (156×72)
const PANEL = 'var(--color-uikit-panel)'
// SAME shared thumbnail greys as PipelineThumb (both SOLID, no alpha): a node
// border a touch darker than the live faint, and a connector edge a hair darker.
const BORDER = 'color-mix(in srgb, var(--color-uikit-ink) 24%, var(--color-uikit-panel))'
const EDGE = 'color-mix(in srgb, var(--color-uikit-ink) 30%, var(--color-uikit-panel))'
const INK = 'var(--color-uikit-ink)'

const MAX_CHARS = 18
const truncate = (s: string) => (s.length > MAX_CHARS ? `${s.slice(0, MAX_CHARS - 1)}…` : s)

const center = (r: WfRect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })

/** Flow-axis bezier between two rects: leaves the source's downstream face,
 *  enters the target's upstream face. */
function flowPath(from: WfRect, to: WfRect, vertical: boolean): string {
  if (vertical) {
    const x1 = from.x + from.w / 2, y1 = from.y + from.h
    const x2 = to.x + to.w / 2, y2 = to.y
    const dy = Math.max(18, (y2 - y1) / 2)
    return `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`
  }
  const x1 = from.x + from.w, y1 = from.y + from.h / 2
  const x2 = to.x, y2 = to.y + to.h / 2
  const dx = Math.max(18, (x2 - x1) / 2)
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
}

// A PipeNode-identical card: panel fill, faint border, 7×7 kind dot, mono name.
function NodeCard({ r, dot, title }: { r: WfRect; dot: string; title: string }) {
  const cy = r.y + r.h / 2
  return (
    <g>
      <rect
        x={r.x} y={r.y} width={r.w} height={r.h} rx={7}
        fill={PANEL} stroke={BORDER} strokeWidth={1} vectorEffect="non-scaling-stroke"
      />
      <rect x={r.x + 12} y={cy - 3.5} width={7} height={7} rx={2} fill={dot} />
      <text
        x={r.x + 26} y={cy}
        dominantBaseline="central"
        fontFamily="var(--font-uikit-mono)" fontSize={FONT} fontWeight={600}
        letterSpacing="-.005em" fill={INK}
      >
        {truncate(title)}
      </text>
    </g>
  )
}

export interface WorkflowThumbProps {
  spec: WorkflowSpec
  orientation?: WfOrientation
}

export function WorkflowThumb({ spec, orientation = 'horizontal' }: WorkflowThumbProps) {
  const layout = useMemo(() => layoutWorkflow(spec, orientation), [spec, orientation])
  const vertical = orientation === 'vertical'

  const rectOf = (id: string): WfRect | undefined =>
    layout.nodeRects[id] ?? layout.stageRects[id]

  // Members with no inbound data edge hang off their stage — mirror the
  // canvas's dispatch fan with a light dashed connector so nothing floats.
  const fedIds = useMemo(() => new Set(spec.edges.map((e) => e.to)), [spec.edges])

  if (spec.stages.length === 0) return null

  return (
    <svg
      viewBox={`0 0 ${layout.size.w} ${layout.size.h}`}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
      aria-hidden
      style={{ display: 'block', pointerEvents: 'none' }}
    >
      {/* spine — stage hub to stage hub */}
      {spec.stages.slice(0, -1).map((s, i) => {
        const a = layout.stageRects[s.id]
        const b = layout.stageRects[spec.stages[i + 1].id]
        if (!a || !b) return null
        const ca = center(a), cb = center(b)
        return (
          <line
            key={`spine-${s.id}`}
            x1={ca.x} y1={ca.y} x2={cb.x} y2={cb.y}
            stroke={EDGE} strokeWidth={0.6} vectorEffect="non-scaling-stroke"
          />
        )
      })}

      {/* dispatch fans — stage → members nothing feeds (dashed, like the canvas) */}
      {spec.nodes.filter((n) => !fedIds.has(n.id)).map((n) => {
        const s = layout.stageRects[n.stageId]
        const r = layout.nodeRects[n.id]
        if (!s || !r) return null
        return (
          <path
            key={`fan-${n.id}`}
            d={flowPath(s, r, vertical)}
            fill="none" stroke={EDGE} strokeWidth={0.5} strokeDasharray="3 4"
            vectorEffect="non-scaling-stroke"
          />
        )
      })}

      {/* data edges */}
      {spec.edges.map((e) => {
        const from = rectOf(e.from)
        const to = rectOf(e.to)
        if (!from || !to) return null
        return (
          <path
            key={e.id}
            d={flowPath(from, to, vertical)}
            fill="none" stroke={EDGE} strokeWidth={0.6}
            vectorEffect="non-scaling-stroke"
          />
        )
      })}

      {/* stage hubs — PipeNode-identical card, stage kind dot */}
      {spec.stages.map((s) => {
        const r = layout.stageRects[s.id]
        if (!r) return null
        return <NodeCard key={s.id} r={r} dot={WF_KIND_TOKEN.stage} title={s.title} />
      })}

      {/* member nodes — same card, member kind dot */}
      {spec.nodes.map((n) => {
        const r = layout.nodeRects[n.id]
        if (!r) return null
        return <NodeCard key={n.id} r={r} dot={WF_KIND_TOKEN[n.kind]} title={n.title} />
      })}
    </svg>
  )
}
