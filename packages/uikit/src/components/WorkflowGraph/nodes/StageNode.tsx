/**
 * StageNode — a stage/phase rendered as a NODE in the flow, using the same
 * card style as every other node (one style across the canvas). Only the
 * kind dot (ink) and the meta line distinguish it.
 */
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { WorkflowStage } from '../spec'
import {
  WF_KIND_ICON, cardStyle, metaStyle, titleRowStyle, titleStyle,
} from './chrome'
import { NodeKindIcon } from './MemberCards'
import { CardTooltip } from './CardTooltip'

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
  return (
    <CardTooltip
      label={stage.detail ?? stage.title}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        data-node={stage.id}
        style={cardStyle({ pos, selected, dimmed })}
      >
        <div style={titleRowStyle}>
          <NodeKindIcon icon={WF_KIND_ICON.stage} />
          <span style={titleStyle}>{stage.title}</span>
        </div>
        <span style={metaStyle}>{bits.join(' · ')}</span>
        {/* Run-time done count on its own line below the meta. */}
        {doneCount != null && <span style={metaStyle}>{doneCount} done</span>}
      </div>
    </CardTooltip>
  )
}
