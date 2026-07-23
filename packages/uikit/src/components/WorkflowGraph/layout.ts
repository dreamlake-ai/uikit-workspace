/**
 * Workflow v2 layout — pure geometry for the stage-spine + fan-out canvas.
 *
 * The spine is `spec.stages` in array order along the MAIN axis; each stage's
 * member nodes fan out on the CROSS axis, wrapping into rows (vertical
 * orientation: spine top-down on the left, members fan right) or columns
 * (horizontal: spine left-right on top, members fan down). Run-time agent
 * instances stack below their uda card in both orientations.
 *
 * Output rects are in canvas coordinates; the canvas renders cards
 * absolutely from these and routes edges between the returned anchors.
 */
import type { AgentInstance, WorkflowSpec } from './spec'
import {
  WF_AGENT_H, WF_NODE_H, WF_NODE_W, WF_STAGE_H, WF_STAGE_W,
} from './nodes/chrome'

export type WfOrientation = 'vertical' | 'horizontal'

export interface WfRect { x: number; y: number; w: number; h: number }
export interface WfPt { x: number; y: number }

export interface WfAgentRect extends WfRect { nodeId: string; agentId: string }

export interface WorkflowLayoutResult {
  stageRects: Record<string, WfRect>
  nodeRects: Record<string, WfRect>
  agentRects: WfAgentRect[]
  /** stage → stage spine segments (order-implied edges). */
  spine: { from: WfPt; to: WfPt }[]
  /** stage → member membership stubs. */
  stubs: { stageId: string; nodeId: string; from: WfPt; to: WfPt }[]
  size: { w: number; h: number }
}

const MARGIN = 28
const STAGE_GAP = 64        // main-axis gap between stage blocks
const FAN_GAP = 64          // cross-axis gap spine → member cluster
const CELL_GAP_MAIN = 20    // main-axis gap between member rows/cells
const CELL_GAP_CROSS = 30   // cross-axis gap between member columns
const AGENT_GAP = 6         // stack gap between agent instance cards
const AGENT_INDENT = 10     // agent stack x-offset under its uda card
const MAX_PER_LINE = 3      // members per row (vertical) / per column (horizontal)

/** Extra main-axis space a node cell needs for its fanned agent instances. */
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
  const spine: WorkflowLayoutResult['spine'] = []
  const stubs: WorkflowLayoutResult['stubs'] = []

  const membersByStage = new Map<string, typeof spec.nodes>()
  for (const s of spec.stages) membersByStage.set(s.id, [])
  for (const n of spec.nodes) {
    const bucket = membersByStage.get(n.stageId)
    if (bucket) bucket.push(n)
  }

  let mainCursor = MARGIN
  let maxCross = 0

  for (const stage of spec.stages) {
    const members = membersByStage.get(stage.id) ?? []

    // Partition members into lines of MAX_PER_LINE; each cell's main-axis
    // extent grows when the node has agent instances stacked below it.
    const lines: { nodes: typeof members; mainExtent: number }[] = []
    for (let i = 0; i < members.length; i += MAX_PER_LINE) {
      const nodes = members.slice(i, i + MAX_PER_LINE)
      const mainExtent = Math.max(
        ...nodes.map((n) => WF_NODE_H + agentExtent(agentsByNodeId?.[n.id]?.length ?? 0)),
        WF_NODE_H,
      )
      lines.push({ nodes, mainExtent })
    }

    if (orientation === 'vertical') {
      // Spine on the left (x = MARGIN); members fan right in wrapping rows.
      const clusterH = lines.length
        ? lines.reduce((a, l) => a + l.mainExtent, 0) + (lines.length - 1) * CELL_GAP_MAIN
        : 0
      const blockH = Math.max(WF_STAGE_H, clusterH)
      const blockTop = mainCursor
      const stageRect: WfRect = {
        x: MARGIN,
        y: blockTop + (blockH - WF_STAGE_H) / 2,
        w: WF_STAGE_W,
        h: WF_STAGE_H,
      }
      stageRects[stage.id] = stageRect

      let rowY = blockTop
      const memberX0 = MARGIN + WF_STAGE_W + FAN_GAP
      for (const line of lines) {
        line.nodes.forEach((n, col) => {
          const rect: WfRect = {
            x: memberX0 + col * (WF_NODE_W + CELL_GAP_CROSS),
            y: rowY,
            w: WF_NODE_W,
            h: WF_NODE_H,
          }
          nodeRects[n.id] = rect
          stubs.push({
            stageId: stage.id,
            nodeId: n.id,
            from: { x: stageRect.x + stageRect.w, y: stageRect.y + stageRect.h / 2 },
            to: { x: rect.x, y: rect.y + rect.h / 2 },
          })
          const agents = agentsByNodeId?.[n.id] ?? []
          agents.forEach((a, i) => {
            agentRects.push({
              nodeId: n.id,
              agentId: a.agentId,
              x: rect.x + AGENT_INDENT,
              y: rect.y + WF_NODE_H + 8 + i * (WF_AGENT_H + AGENT_GAP),
              w: 140,
              h: WF_AGENT_H,
            })
          })
          maxCross = Math.max(maxCross, rect.x + rect.w)
        })
        rowY += line.mainExtent + CELL_GAP_MAIN
      }
      maxCross = Math.max(maxCross, stageRect.x + stageRect.w)
      mainCursor = blockTop + blockH + STAGE_GAP
    } else {
      // Spine on top (y = MARGIN); members fan down in wrapping columns.
      const clusterW = lines.length
        ? lines.length * WF_NODE_W + (lines.length - 1) * CELL_GAP_CROSS
        : 0
      const blockW = Math.max(WF_STAGE_W, clusterW)
      const blockLeft = mainCursor
      const stageRect: WfRect = {
        x: blockLeft + (blockW - WF_STAGE_W) / 2,
        y: MARGIN,
        w: WF_STAGE_W,
        h: WF_STAGE_H,
      }
      stageRects[stage.id] = stageRect

      const memberY0 = MARGIN + WF_STAGE_H + FAN_GAP
      lines.forEach((line, colIdx) => {
        let cellY = memberY0
        const colX = blockLeft + colIdx * (WF_NODE_W + CELL_GAP_CROSS)
        for (const n of line.nodes) {
          const rect: WfRect = { x: colX, y: cellY, w: WF_NODE_W, h: WF_NODE_H }
          nodeRects[n.id] = rect
          stubs.push({
            stageId: stage.id,
            nodeId: n.id,
            from: { x: stageRect.x + stageRect.w / 2, y: stageRect.y + stageRect.h },
            to: { x: rect.x + rect.w / 2, y: rect.y },
          })
          const agents = agentsByNodeId?.[n.id] ?? []
          agents.forEach((a, i) => {
            agentRects.push({
              nodeId: n.id,
              agentId: a.agentId,
              x: rect.x + AGENT_INDENT,
              y: rect.y + WF_NODE_H + 8 + i * (WF_AGENT_H + AGENT_GAP),
              w: 140,
              h: WF_AGENT_H,
            })
          })
          const cellExtent = WF_NODE_H + agentExtent(agents.length)
          maxCross = Math.max(maxCross, cellY + cellExtent)
          cellY += cellExtent + CELL_GAP_MAIN
        }
      })
      maxCross = Math.max(maxCross, memberY0)
      mainCursor = blockLeft + blockW + STAGE_GAP
    }
  }

  // Spine segments between consecutive stage rects.
  for (let i = 0; i + 1 < spec.stages.length; i++) {
    const a = stageRects[spec.stages[i].id]
    const b = stageRects[spec.stages[i + 1].id]
    if (!a || !b) continue
    if (orientation === 'vertical') {
      spine.push({
        from: { x: a.x + a.w / 2, y: a.y + a.h },
        to: { x: b.x + b.w / 2, y: b.y },
      })
    } else {
      spine.push({
        from: { x: a.x + a.w, y: a.y + a.h / 2 },
        to: { x: b.x, y: b.y + b.h / 2 },
      })
    }
  }

  const size =
    orientation === 'vertical'
      ? { w: maxCross + MARGIN, h: mainCursor - STAGE_GAP + MARGIN }
      : { w: mainCursor - STAGE_GAP + MARGIN, h: maxCross + MARGIN }

  return { stageRects, nodeRects, agentRects, spine, stubs, size }
}

/**
 * Port anchor on a rect for data edges. Ports sit on the main-axis faces:
 * vertical orientation → out on bottom, in on top; horizontal → out on
 * right, in on left. Multiple ports spread along the face (portAlong-style,
 * clustered around the center with a fixed gap).
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
