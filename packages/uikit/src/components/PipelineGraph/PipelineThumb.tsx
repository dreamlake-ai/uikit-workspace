import { useMemo } from 'react'
import { kindColor, NODE_W, NODE_H } from './flow'
import { buildEdgePath, type Obstacle } from './edge-path'
import type { PipelineGraphData } from './types'

// A static, non-interactive mini-render of a pipeline's DAG — the grid-card
// thumbnail twin of WorkflowThumb. A faithful shrink of the detail-page
// <PipelineGraph>: idle node cards (panel fill + faint border) with a small
// kind-coloured square dot and the node name, joined by the SAME
// orthogonally-routed idle-grey edges. Nodes, names, and edges only — no ports,
// no param tags, no status chrome.

const PAD = 30       // world-space padding around the graph bounds
const FONT = 12      // world-space node title size — matches PipeNode (156×72)
const PANEL = 'var(--color-uikit-panel)'                 // idle node fill (PipeNode idle)
// Shared thumbnail greys (WorkflowThumb uses the SAME), both SOLID (no alpha, so
// overlapping lines never stack/darken): a node border a touch darker than the
// live faint, and a connector edge a hair darker again so lines read.
const BORDER = 'color-mix(in srgb, var(--color-uikit-ink) 24%, var(--color-uikit-panel))'
const EDGE = 'color-mix(in srgb, var(--color-uikit-ink) 30%, var(--color-uikit-panel))'
const INK = 'var(--color-uikit-ink)'                     // node title

// Rough char budget so a title fits the node width without an SVG text overflow.
const MAX_CHARS = Math.floor((NODE_W - 40) / (FONT * 0.6))
const truncate = (s: string) => (s.length > MAX_CHARS ? `${s.slice(0, MAX_CHARS - 1)}…` : s)

// Single in/out dot per side at the edge centre — matches PipelineGraph's portPos.
const outPt = (n: { pos: { x: number; y: number } }) => ({ x: n.pos.x + NODE_W, y: n.pos.y + NODE_H / 2 })
const inPt = (n: { pos: { x: number; y: number } }) => ({ x: n.pos.x, y: n.pos.y + NODE_H / 2 })
// The edge's own two cards — passed to the router SEPARATELY from `obstacles`
// (the line must reach their ports, so it must not detour around them) so it can
// still keep the line out of their bodies.
const cardRect = (n: { pos: { x: number; y: number } }): Obstacle =>
  ({ x0: n.pos.x, y0: n.pos.y, x1: n.pos.x + NODE_W, y1: n.pos.y + NODE_H })

export interface PipelineThumbProps {
  graph: PipelineGraphData
}

export function PipelineThumb({ graph }: PipelineThumbProps) {
  const nodes = useMemo(() => Object.values(graph.nodes), [graph])

  const view = useMemo(() => {
    if (nodes.length === 0) return null
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const n of nodes) {
      minX = Math.min(minX, n.pos.x)
      minY = Math.min(minY, n.pos.y)
      maxX = Math.max(maxX, n.pos.x + NODE_W)
      maxY = Math.max(maxY, n.pos.y + NODE_H)
    }
    return { x: minX - PAD, y: minY - PAD, w: maxX - minX + PAD * 2, h: maxY - minY + PAD * 2 }
  }, [nodes])

  if (!view) return null

  return (
    <svg
      viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
      aria-hidden
      style={{ display: 'block', pointerEvents: 'none' }}
    >
      {/* Edges under the nodes — same orthogonal routing (buildEdgePath) and
          idle-grey flow colour as PipelineGraph; kept crisp regardless of scale. */}
      {graph.edges.map((e, i) => {
        const s = graph.nodes[e.from]
        const d = graph.nodes[e.to]
        if (!s || !d) return null
        const from = outPt(s)
        const to = inPt(d)
        const obstacles: Obstacle[] = nodes
          .filter((n) => n.id !== e.from && n.id !== e.to)
          .map((n) => ({ x0: n.pos.x - 4, x1: n.pos.x + NODE_W + 4, y0: n.pos.y - 4, y1: n.pos.y + NODE_H + 4 }))
        return (
          <path
            key={i}
            d={buildEdgePath(from, to, { obstacles, fromRect: cardRect(s), toRect: cardRect(d) })}
            fill="none"
            stroke={EDGE}
            strokeWidth={0.6}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )
      })}

      {/* Nodes: idle PipeNode card — panel fill + faint border + 7×7 kind dot + name. */}
      {nodes.map((n) => {
        const cy = n.pos.y + NODE_H / 2
        const kc = kindColor(n.kind)
        return (
          <g key={n.id}>
            <rect
              x={n.pos.x} y={n.pos.y} width={NODE_W} height={NODE_H} rx={7}
              fill={PANEL}
              stroke={BORDER}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <rect x={n.pos.x + 12} y={cy - 3.5} width={7} height={7} rx={2} fill={kc} />
            <text
              x={n.pos.x + 26} y={cy}
              dominantBaseline="central"
              style={{
                fontFamily: 'var(--font-uikit-mono)',
                fontSize: FONT, fontWeight: 600, letterSpacing: '-.005em',
                fill: INK,
              }}
            >
              {truncate(n.title)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
