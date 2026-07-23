/**
 * Workflow v2 layout — one continuous flow direction, overlap-averse.
 *
 * vertical:   the root (first stage) sits at the TOP; everything flows
 *             top → bottom. Each stage node is centered on the flow axis;
 *             its members fan out below it. horizontal: root at the LEFT,
 *             flowing left → right.
 *
 * Overlap avoidance strategy:
 *  - Members within a stage are layered TOPOLOGICALLY by their intra-stage
 *    data edges (longest-path layering), so an edge between two members of
 *    the same stage always flows forward — never sideways or backward.
 *  - The stage→stage spine runs in a RESERVED side corridor (leaving from
 *    the stage's side face), so it never threads between member cards.
 *  - Generous gaps leave routing corridors for cross-stage data edges,
 *    which detour around cards via the canvas's obstacle-aware routing.
 *
 * All nodes share ONE card style/size (WF_NODE_W × WF_NODE_H). Run-time
 * agent instances stack below their uda card in both orientations.
 */
import type { AgentInstance, WorkflowSpec } from './spec'
import { WF_AGENT_H, WF_AGENT_W, WF_NODE_H, WF_NODE_W } from './nodes/chrome'

export type WfOrientation = 'vertical' | 'horizontal'

export interface WfRect { x: number; y: number; w: number; h: number }
export interface WfPt { x: number; y: number }

export interface WfAgentRect extends WfRect { nodeId: string; agentId: string }

export interface WorkflowLayoutResult {
  stageRects: Record<string, WfRect>
  nodeRects: Record<string, WfRect>
  agentRects: WfAgentRect[]
  /** stage → member fan-out stubs (structural, not data). */
  stubs: { stageId: string; nodeId: string }[]
  /** Side-axis coordinate of the reserved spine corridor (x in vertical
   *  orientation, y in horizontal). */
  corridor: number
  size: { w: number; h: number }
}

const MARGIN = 32
const CORRIDOR_W = 52       // reserved side lane for the stage→stage spine
const FAN_GAP = 64          // stage → its first member line, along the flow axis
const STAGE_GAP = 88        // last member line → next stage
const CELL_GAP_FLOW = 44    // between member lines, along the flow axis
const CELL_GAP_SIDE = 48    // between members within a line, across the flow
const AGENT_GAP = 6
const AGENT_INDENT = 10
const MAX_PER_LINE = 3      // members per fan line before wrapping

/** Extra flow-axis space a member cell needs for stacked agent instances. */
function agentExtent(count: number): number {
  return count > 0 ? count * (WF_AGENT_H + AGENT_GAP) + 8 : 0
}

type SpecNode = WorkflowSpec['nodes'][number]

/**
 * Layer a stage's members by their intra-stage data edges (longest-path
 * layering), then wrap each layer at MAX_PER_LINE. Members untouched by
 * intra-stage edges share layer 0; cycles fall back to declaration order.
 */
function buildLines(members: SpecNode[], spec: WorkflowSpec): SpecNode[][] {
  if (members.length === 0) return []
  const ids = new Set(members.map((m) => m.id))
  const intra = spec.edges.filter((e) => ids.has(e.from) && ids.has(e.to))

  const layer = new Map<string, number>()
  for (const m of members) layer.set(m.id, 0)
  // Relax longest-path layers; bounded passes guard against cycles.
  for (let pass = 0; pass < members.length; pass++) {
    let changed = false
    for (const e of intra) {
      const want = (layer.get(e.from) ?? 0) + 1
      if (want > (layer.get(e.to) ?? 0) && want < members.length + 1) {
        layer.set(e.to, want)
        changed = true
      }
    }
    if (!changed) break
  }

  const byLayer = new Map<number, SpecNode[]>()
  for (const m of members) {
    const l = layer.get(m.id) ?? 0
    const arr = byLayer.get(l) ?? []
    arr.push(m)
    byLayer.set(l, arr)
  }

  const lines: SpecNode[][] = []
  for (const l of [...byLayer.keys()].sort((a, b) => a - b)) {
    const nodes = byLayer.get(l)!
    for (let i = 0; i < nodes.length; i += MAX_PER_LINE) {
      lines.push(nodes.slice(i, i + MAX_PER_LINE))
    }
  }
  return lines
}

export function layoutWorkflow(
  spec: WorkflowSpec,
  orientation: WfOrientation,
  agentsByNodeId?: Record<string, AgentInstance[]>,
): WorkflowLayoutResult {
  const stageRects: Record<string, WfRect> = {}
  const nodeRects: Record<string, WfRect> = {}
  const agentRects: WfAgentRect[] = []
  const stubs: WorkflowLayoutResult['stubs'] = []

  const membersByStage = new Map<string, SpecNode[]>()
  for (const s of spec.stages) membersByStage.set(s.id, [])
  for (const n of spec.nodes) membersByStage.get(n.stageId)?.push(n)

  // Topological fan lines per stage + the widest line across the graph so
  // everything centers on one flow axis.
  interface Line { nodes: SpecNode[]; flowExtent: number; sideExtent: number }
  const linesByStage = new Map<string, Line[]>()
  let maxSide = orientation === 'vertical' ? WF_NODE_W : WF_NODE_H

  for (const s of spec.stages) {
    const raw = buildLines(membersByStage.get(s.id) ?? [], spec)
    const lines: Line[] = raw.map((nodes) => {
      if (orientation === 'vertical') {
        const flowExtent = Math.max(
          ...nodes.map((n) => WF_NODE_H + agentExtent(agentsByNodeId?.[n.id]?.length ?? 0)),
          WF_NODE_H,
        )
        const sideExtent = nodes.length * WF_NODE_W + (nodes.length - 1) * CELL_GAP_SIDE
        return { nodes, flowExtent, sideExtent }
      }
      // horizontal: agents stack BELOW the card → consume SIDE space.
      const sideExtent = nodes.reduce((acc, n, i) => {
        const cell = WF_NODE_H + agentExtent(agentsByNodeId?.[n.id]?.length ?? 0)
        return acc + cell + (i > 0 ? CELL_GAP_SIDE : 0)
      }, 0)
      return { nodes, flowExtent: WF_NODE_W, sideExtent }
    })
    for (const l of lines) maxSide = Math.max(maxSide, l.sideExtent)
    linesByStage.set(s.id, lines)
  }

  // Side geometry: [MARGIN | corridor | content(maxSide) | MARGIN]
  const corridor = MARGIN + CORRIDOR_W / 2
  const contentStart = MARGIN + CORRIDOR_W
  const center = contentStart + maxSide / 2
  let flowCursor = MARGIN

  for (const stage of spec.stages) {
    const lines = linesByStage.get(stage.id) ?? []

    const stageRect: WfRect = orientation === 'vertical'
      ? { x: center - WF_NODE_W / 2, y: flowCursor, w: WF_NODE_W, h: WF_NODE_H }
      : { x: flowCursor, y: center - WF_NODE_H / 2, w: WF_NODE_W, h: WF_NODE_H }
    stageRects[stage.id] = stageRect
    flowCursor += (orientation === 'vertical' ? WF_NODE_H : WF_NODE_W)

    if (lines.length) {
      flowCursor += FAN_GAP
      for (const line of lines) {
        if (orientation === 'vertical') {
          let x = center - line.sideExtent / 2
          for (const n of line.nodes) {
            const rect: WfRect = { x, y: flowCursor, w: WF_NODE_W, h: WF_NODE_H }
            nodeRects[n.id] = rect
            stubs.push({ stageId: stage.id, nodeId: n.id })
            const agents = agentsByNodeId?.[n.id] ?? []
            agents.forEach((a, i) => {
              agentRects.push({
                nodeId: n.id, agentId: a.agentId,
                x: rect.x + AGENT_INDENT,
                y: rect.y + WF_NODE_H + 8 + i * (WF_AGENT_H + AGENT_GAP),
                w: WF_AGENT_W, h: WF_AGENT_H,
              })
            })
            x += WF_NODE_W + CELL_GAP_SIDE
          }
          flowCursor += line.flowExtent + CELL_GAP_FLOW
        } else {
          let y = center - line.sideExtent / 2
          for (const n of line.nodes) {
            const rect: WfRect = { x: flowCursor, y, w: WF_NODE_W, h: WF_NODE_H }
            nodeRects[n.id] = rect
            stubs.push({ stageId: stage.id, nodeId: n.id })
            const agents = agentsByNodeId?.[n.id] ?? []
            agents.forEach((a, i) => {
              agentRects.push({
                nodeId: n.id, agentId: a.agentId,
                x: rect.x + AGENT_INDENT,
                y: rect.y + WF_NODE_H + 8 + i * (WF_AGENT_H + AGENT_GAP),
                w: WF_AGENT_W, h: WF_AGENT_H,
              })
            })
            y += WF_NODE_H + agentExtent(agents.length) + CELL_GAP_SIDE
          }
          flowCursor += line.flowExtent + CELL_GAP_FLOW
        }
      }
      flowCursor += STAGE_GAP - CELL_GAP_FLOW
    } else {
      flowCursor += STAGE_GAP
    }
  }

  const flowEnd = flowCursor - STAGE_GAP + MARGIN + (orientation === 'vertical' ? WF_NODE_H : WF_NODE_W)
  const sideTotal = MARGIN * 2 + CORRIDOR_W + maxSide
  const size = orientation === 'vertical'
    ? { w: sideTotal, h: flowEnd }
    : { w: flowEnd, h: sideTotal }

  return { stageRects, nodeRects, agentRects, stubs, corridor, size }
}

/**
 * Port anchor on a rect for edges. Ports sit on the flow-axis faces:
 * vertical → in on top / out on bottom; horizontal → in on left / out on
 * right. Multiple ports spread along the face, clustered at the center.
 */
export function portAnchor(
  rect: WfRect,
  dir: 'in' | 'out',
  index: number,
  count: number,
  orientation: WfOrientation,
): WfPt {
  const GAP = 15
  const span = orientation === 'vertical' ? rect.w : rect.h
  const gap = count <= 1 ? 0 : Math.min(GAP, (span - 12) / (count - 1))
  const start = span / 2 - (gap * (count - 1)) / 2
  const along = start + index * gap
  if (orientation === 'vertical') {
    return { x: rect.x + along, y: dir === 'in' ? rect.y : rect.y + rect.h }
  }
  return { x: dir === 'in' ? rect.x : rect.x + rect.w, y: rect.y + along }
}

/** Orthogonal polyline with rounded corners → SVG path. */
export function roundedPath(pts: WfPt[], r = 10): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i - 1]
    const c = pts[i]
    const n = pts[i + 1]
    const inLen = Math.hypot(c.x - p.x, c.y - p.y)
    const outLen = Math.hypot(n.x - c.x, n.y - c.y)
    const rr = Math.min(r, inLen / 2, outLen / 2)
    const inX = c.x - Math.sign(c.x - p.x) * rr
    const inY = c.y - Math.sign(c.y - p.y) * rr
    const outX = c.x + Math.sign(n.x - c.x) * rr
    const outY = c.y + Math.sign(n.y - c.y) * rr
    d += ` L ${inX} ${inY} Q ${c.x} ${c.y} ${outX} ${outY}`
  }
  const last = pts[pts.length - 1]
  d += ` L ${last.x} ${last.y}`
  return d
}
