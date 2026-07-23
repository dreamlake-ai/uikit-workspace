/**
 * Shared card chrome for Workflow v2 node cards — the PipelineGraph card DNA
 * (156×72, radius 7, status-tinted panel, faint border, mono font) expressed
 * as style helpers so every card stays pixel-consistent.
 *
 * Cards are IN-FLOW by default; passing `pos` switches to absolute
 * positioning (the canvas does this). Docs render them without `pos`.
 */
import type { CSSProperties } from 'react'
import type { WorkflowNodeKind, WorkflowNodeRunStateValue } from '../spec'

export const WF_NODE_W = 156
export const WF_NODE_H = 72
export const WF_STAGE_W = 156
export const WF_STAGE_H = 48
export const WF_AGENT_W = 140
export const WF_AGENT_H = 40

/** Kind → uikit tone token (extends PipelineGraph's KIND_TOKEN vocabulary). */
export const WF_KIND_TOKEN: Record<WorkflowNodeKind | 'stage' | 'agent', string> = {
  stage: 'var(--color-uikit-ink)',
  compute: 'var(--color-uikit-tone-blue)',
  uda: 'var(--color-uikit-tone-purple)',
  sampler: 'var(--color-uikit-tone-amber)',
  control: 'var(--color-uikit-tone-red)',
  agent: 'var(--color-uikit-tone-purple)',
}

export const WF_KIND_LABEL: Record<WorkflowNodeKind | 'stage', string> = {
  stage: 'stage',
  compute: 'compute · udf',
  uda: 'uda · agent',
  sampler: 'sampler',
  control: 'control',
}

/** Run state → status color (mirrors PipelineGraph STATUS colors). */
export const WF_STATE_COLOR: Record<WorkflowNodeRunStateValue, string> = {
  idle: 'var(--color-uikit-muted)',
  queued: 'var(--color-uikit-tone-warm-gray)',
  progress: 'var(--color-uikit-tone-blue)',
  done: 'var(--color-uikit-tone-green)',
  error: 'var(--color-uikit-tone-red)',
  skipped: 'var(--color-uikit-muted)',
}

export interface CardChromeOpts {
  pos?: { x: number; y: number }
  width?: number
  height?: number
  state?: WorkflowNodeRunStateValue
  selected?: boolean
  dimmed?: boolean
}

/** Base card style — panel surface tinted by run state, PipeNode-identical. */
export function cardStyle(opts: CardChromeOpts): CSSProperties {
  const { pos, width = WF_NODE_W, height = WF_NODE_H, state, selected, dimmed } = opts
  const panel = 'var(--color-uikit-panel)'
  const active = state && state !== 'idle' && state !== 'skipped'
  const stateColor = state ? WF_STATE_COLOR[state] : undefined
  const bg = active
    ? `color-mix(in srgb, ${panel} ${selected ? '84%' : '90%'}, ${stateColor})`
    : panel
  const border = selected
    ? 'var(--color-uikit-accent)'
    : active
      ? `color-mix(in srgb, var(--color-uikit-faint) 55%, ${stateColor})`
      : 'var(--color-uikit-faint)'
  return {
    ...(pos ? { position: 'absolute', left: pos.x, top: pos.y } : { position: 'relative' }),
    width,
    height,
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 7,
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    boxSizing: 'border-box',
    boxShadow: selected
      ? '0 1px 0 rgba(0,0,0,.05), 0 6px 18px rgba(0,0,0,.10)'
      : '0 1px 0 rgba(0,0,0,.04)',
    opacity: dimmed ? 0.4 : state === 'skipped' ? 0.55 : 1,
    transition: 'opacity 160ms ease, border-color 120ms ease, background 120ms ease',
    fontFamily: 'var(--font-uikit-mono)',
    cursor: 'grab',
    userSelect: 'none',
  }
}

/** Title row: kind dot + ellipsized title. */
export const titleRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  minWidth: 0,
}

export function kindDotStyle(color: string): CSSProperties {
  return { width: 7, height: 7, borderRadius: 2, background: color, flexShrink: 0 }
}

export const titleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-uikit-ink)',
  letterSpacing: '-.005em',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  minWidth: 0,
  flex: 1,
}

/** 9px uppercase meta line (PipeNode's second row). */
export const metaStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 500,
  color: 'var(--color-uikit-muted)',
  opacity: 0.75,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

/** Tiny inline chip (launcher badge, model chip, queue chip). */
export const chipStyle: CSSProperties = {
  fontSize: 8.5,
  fontWeight: 600,
  letterSpacing: '.04em',
  textTransform: 'uppercase',
  color: 'var(--color-uikit-muted)',
  background: 'color-mix(in oklab, var(--color-uikit-ink) 5%, transparent)',
  border: '1px solid color-mix(in oklab, var(--color-uikit-ink) 10%, transparent)',
  borderRadius: 4,
  padding: '1px 5px',
  whiteSpace: 'nowrap',
  lineHeight: 1.4,
}

/** Prompt / free-text preview line (uda cards). */
export const previewStyle: CSSProperties = {
  fontSize: 9.5,
  color: 'var(--color-uikit-muted)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontStyle: 'italic',
}
