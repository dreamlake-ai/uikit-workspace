/**
 * Workflow v2 layout — one continuous flow direction.
 *
 * vertical:   the root (first stage) sits at the TOP; everything flows
 *             top → bottom. Each stage node is centered on the flow axis;
 *             its members fan out in centered wrapping rows directly below
 *             it; the next stage follows below the members.
 * horizontal: the root sits at the LEFT; everything flows left → right,
 *             members fanning out in centered wrapping columns to the right
 *             of their stage.
 *
 * All nodes share ONE card style/size (WF_NODE_W × WF_NODE_H). Run-time
 * agent instances stack below their uda card in both orientations.
 * Output rects are canvas coordinates; the canvas routes edges between the
 * returned anchors (spine edges detour around member clusters via the
 * canvas's obstacle-aware routing).
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
  size: { w: number; h: number }
}

const MARGIN = 32
const FAN_GAP = 56          // stage → its member line, along the flow axis
const STAGE_GAP = 72        // last member line → next stage
const CELL_GAP_FLOW = 24    // between member lines, along the flow axis
const CELL_GAP_SIDE = 30    // between members within a line, across the flow
const AGENT_GAP = 6
const AGENT_INDENT = 10
const MAX_PER_LINE = 3      // members per fan line before wrapping

/** Extra flow-axis space a member cell needs for stacked agent instances. */
function agentExtent(count: number): number {
  return count > 0 ? count * (WF_AGENT_H + AGENT_GAP) + 8 : 0
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

  const membersByStage = new Map<string, typeof spec.nodes>()
  for (const s of spec.stages) membersByStage.set(s.id, [])
  for (const n of spec.nodes) membersByStage.get(n.stageId)?.push(n)

  // Pre-compute each stage's fan lines and the widest line across the whole
  // graph, so everything can center on one flow axis.
  interface Line { nodes: typeof spec.nodes; flowExtent: number; sideExtent: number }
  const linesByStage = new Map<string, Line[]>()
  let maxSide = WF_NODE_W // at least one card wide across the flow

  for (const s of spec.stages) {
    const members = membersByStage.get(s.id) ?? []
    const lines: Line[] = []
    for (let i = 0; i < members.length; i += MAX_PER_LINE) {
      const nodes = members.slice(i, i + MAX_PER_LINE)
      const flowExtent = Math.max(
        ...nodes.map((n) => WF_NODE_H + agentExtent(agentsByNodeId?.[n.id]?.length ?? 0)),
        WF_NODE_H,
      )
      const sideExtent = nodes.length * WF_NODE_W + (nodes.length - 1) * CELL_GAP_SIDE
      lines.push({ nodes, flowExtent, sideExtent })
      maxSide = Math.max(maxSide, sideExtent)
    }
    linesByStage.set(s.id, lines)
  }

  // In horizontal orientation the flow axis is x and the side axis is y —
  // member cells stack agents BELOW the card, which consumes SIDE space, so
  // side extent per line must account for the tallest cell.
  if (orientation === 'horizontal') {
    maxSide = WF_NODE_H
    for (const lines of linesByStage.values()) {
      for (const line of lines) {
        const sideExtent = line.nodes.reduce((acc, n, i) => {
          const cell = WF_NODE_H + agentExtent(agentsByNodeId?.[n.id]?.length ?? 0)
          return acc + cell + (i > 0 ? CELL_GAP_SIDE : 0)
        }, 0)
        line.sideExtent = sideExtent
        line.flowExtent = WF_NODE_W
        maxSide = Math.max(maxSide, sideExtent)
      }
    }
  }

  const center = MARGIN + maxSide / 2 // side-axis center line
  let flowCursor = MARGIN

  for (const stage of spec.stages) {
    const lines = linesByStage.get(stage.id) ?? []

    // Stage node, centered on the flow axis.
    const stageRect: WfRect = orientation === 'vertical'
      ? { x: center - WF_NODE_W / 2, y: flowCursor, w: WF_NODE_W, h: WF_NODE_H }
      : { x: flowCursor, y: center - WF_NODE_H / 2, w: WF_NODE_W, h: WF_NODE_H }
    stageRects[stage.id] = stageRect
    flowCursor += (orientation === 'vertical' ? WF_NODE_H : WF_NODE_W)

    if (lines.length) {
      flowCursor += FAN_GAP
      for (const line of lines) {
        if (orientation === 'vertical') {
          // Row of members, centered on the side axis.
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
          // Column of members, centered on the side axis; agents stack below
          // each card (consuming side space within the column).
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
  const size = orientation === 'vertical'
    ? { w: MARGIN * 2 + maxSide, h: flowEnd }
    : { w: flowEnd, h: MARGIN * 2 + maxSide }

  return { stageRects, nodeRects, agentRects, stubs, size }
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
