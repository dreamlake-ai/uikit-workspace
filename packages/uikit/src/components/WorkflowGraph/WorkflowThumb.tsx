import { useMemo } from 'react'
import { layoutWorkflow, type WfOrientation, type WfRect } from './layout'
import type { WorkflowSpec } from './spec'
import { WF_KIND_TOKEN } from './nodes/chrome'

// A static, non-interactive mini-render of a WorkflowSpec — the grid-card
// thumbnail twin of PipelineThumb. Reuses the real layout engine so the thumb
// is a faithful shrink of the canvas: stage hubs on the spine with members
// fanned out, joined by quiet edges. No hub routing, no ports, no labels'
// pills — just enough to recognise a workflow's shape at card size.

const FONT = 15          // world-space node title size (nodes are 156×72)
const EDGE = 'var(--color-uikit-ink-50, var(--color-uikit-muted))'

// Rough char budget so a title fits the node width without overflow.
const MAX_CHARS = 16
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
            stroke={EDGE} strokeWidth={1.1} vectorEffect="non-scaling-stroke" opacity={0.5}
          />
        )
      })}

      {/* dispatch fans — stage → members nothing feeds */}
      {spec.nodes.filter((n) => !fedIds.has(n.id)).map((n) => {
        const s = layout.stageRects[n.stageId]
        const r = layout.nodeRects[n.id]
        if (!s || !r) return null
        return (
          <path
            key={`fan-${n.id}`}
            d={flowPath(s, r, vertical)}
            fill="none" stroke={EDGE} strokeWidth={0.8} strokeDasharray="3 4"
            vectorEffect="non-scaling-stroke" opacity={0.55}
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
            fill="none" stroke={EDGE} strokeWidth={0.9}
            vectorEffect="non-scaling-stroke"
          />
        )
      })}

      {/* stage hubs */}
      {spec.stages.map((s) => {
        const r = layout.stageRects[s.id]
        if (!r) return null
        return (
          <g key={s.id}>
            <rect
              x={r.x} y={r.y} width={r.w} height={r.h} rx={7}
              fill="color-mix(in oklab, var(--color-uikit-ink) 6%, var(--color-uikit-panel))"
              stroke="color-mix(in oklab, var(--color-uikit-ink) 40%, transparent)"
              strokeWidth={1.2} vectorEffect="non-scaling-stroke"
            />
            <text
              x={r.x + r.w / 2} y={r.y + r.h / 2}
              textAnchor="middle" dominantBaseline="central"
              fontFamily="var(--font-uikit-mono)" fontSize={FONT} fontWeight={600}
              fill="var(--color-uikit-ink)"
            >
              {truncate(s.title)}
            </text>
          </g>
        )
      })}

      {/* member nodes — panel card + kind dot + title */}
      {spec.nodes.map((n) => {
        const r = layout.nodeRects[n.id]
        if (!r) return null
        const tone = WF_KIND_TOKEN[n.kind]
        return (
          <g key={n.id}>
            <rect
              x={r.x} y={r.y} width={r.w} height={r.h} rx={7}
              fill="var(--color-uikit-panel)"
              stroke="color-mix(in oklab, var(--color-uikit-faint) 90%, var(--color-uikit-ink))"
              strokeWidth={1} vectorEffect="non-scaling-stroke"
            />
            <circle cx={r.x + 14} cy={r.y + r.h / 2} r={4} fill={tone} />
            <text
              x={r.x + 24} y={r.y + r.h / 2}
              dominantBaseline="central"
              fontFamily="var(--font-uikit-mono)" fontSize={FONT}
              fill="var(--color-uikit-ink)"
            >
              {truncate(n.title)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
