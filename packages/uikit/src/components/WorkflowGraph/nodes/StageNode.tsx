/**
 * StageNode — a spine station card. Distinct from member cards: shorter
 * (156×48), 3px ink accent bar on the spine side, member/done counts.
 */
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { WorkflowStage } from '../spec'
import {
  WF_KIND_TOKEN, WF_STAGE_H, WF_STAGE_W, cardStyle, metaStyle, titleStyle,
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
  const base = cardStyle({ pos, width: WF_STAGE_W, height: WF_STAGE_H, selected, dimmed })
  const style: CSSProperties = {
    ...base,
    // Slightly darker than member cards so the spine reads as structure.
    background: selected
      ? base.background
      : 'color-mix(in oklab, var(--color-uikit-panel) 92%, var(--color-uikit-ink))',
    borderLeft: `3px solid ${selected ? 'var(--color-uikit-accent)' : WF_KIND_TOKEN.stage}`,
    padding: '7px 10px',
    gap: 3,
    justifyContent: 'center',
  }
  const meta =
    memberCount != null
      ? doneCount != null
        ? `${memberCount} member${memberCount === 1 ? '' : 's'} · ${doneCount} done`
        : `${memberCount} member${memberCount === 1 ? '' : 's'}`
      : stage.detail
  return (
    <div
      data-node={stage.id}
      title={stage.detail ?? stage.title}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <span style={{ ...titleStyle, fontSize: 12.5 }}>{stage.title}</span>
      {meta && <span style={metaStyle}>{meta}</span>}
    </div>
  )
}
