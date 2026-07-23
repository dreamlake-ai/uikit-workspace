/**
 * StageNode — a stage/phase rendered as a NODE in the flow, using the same
 * card style as every other node (one style across the canvas). Only the
 * kind dot (ink) and the meta line distinguish it.
 */
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { WorkflowStage } from '../spec'
import {
  WF_KIND_TOKEN, cardStyle, kindDotStyle, metaStyle, titleRowStyle, titleStyle,
} from './chrome'

export interface StageNodeProps {
  stage: WorkflowStage
  memberCount?: number
  doneCount?: number
  pos?: { x: number; y: number }
  selected?: boolean
  dimmed?: boolean
  onPointerDown?: (e: ReactPointerEvent) => void
  onPointerMove?: (e: ReactPointerEvent) => void
  onPointerUp?: (e: ReactPointerEvent) => void
}

export function StageNode({
  stage, memberCount, doneCount, pos, selected, dimmed,
  onPointerDown, onPointerMove, onPointerUp,
}: StageNodeProps) {
  const bits: string[] = ['stage']
  if (memberCount != null) bits.push(`${memberCount} member${memberCount === 1 ? '' : 's'}`)
  if (doneCount != null) bits.push(`${doneCount} done`)
  return (
    <div
      data-node={stage.id}
      title={stage.detail ?? stage.title}
      style={cardStyle({ pos, selected, dimmed })}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div style={titleRowStyle}>
        <span style={kindDotStyle(WF_KIND_TOKEN.stage)} />
        <span style={titleStyle}>{stage.title}</span>
      </div>
      <span style={metaStyle}>{bits.join(' · ')}</span>
      {stage.detail && <span style={{ ...metaStyle, textTransform: 'none', letterSpacing: 0, fontSize: 9.5 }}>{stage.detail}</span>}
    </div>
  )
}
