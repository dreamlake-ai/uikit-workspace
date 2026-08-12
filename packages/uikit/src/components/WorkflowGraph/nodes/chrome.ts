/**
 * Shared card chrome for Workflow v2 node cards — the PipelineGraph card DNA
 * (156×72, radius 7, status-tinted panel, faint border, mono font) expressed
 * as style helpers so every card stays pixel-consistent.
 *
 * Cards are IN-FLOW by default; passing `pos` switches to absolute
 * positioning (the canvas does this). Docs render them without `pos`.
 */
import type { CSSProperties } from 'react'
import { Bot, Cpu, GitBranch, Layers, Shuffle, type LucideIcon } from 'lucide-react'
import type { WorkflowNodeKind, WorkflowNodeRunStateValue } from '../spec'

export const WF_NODE_W = 156
export const WF_NODE_H = 72
// Stage nodes share the ONE card style/size — no special chrome.
export const WF_STAGE_W = WF_NODE_W
export const WF_STAGE_H = WF_NODE_H
export const WF_AGENT_W = 140
export const WF_AGENT_H = 40

/** Kind → lucide icon. TYPE is carried by the icon SHAPE (colour is reserved for
 *  run status), so the card's leading glyph is this icon tinted by state rather
 *  than a status-colliding coloured dot. `control` here is the generic branch
 *  icon (the control CARD still uses a per-subtype icon: condition / switch / …). */
export const WF_KIND_ICON: Record<WorkflowNodeKind | 'stage' | 'agent', LucideIcon> = {
  stage: Layers,
  compute: Cpu,
  uda: Bot,
  sampler: Shuffle,
  control: GitBranch,
  agent: Bot,
}

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
  /** Subordinate sub-card chrome (agent instances fanned under a uda node):
   *  flat (no drop shadow), thinner + fainter border, tighter radius — so it
   *  reads as belonging to its parent node rather than as a peer member. */
  recessed?: boolean
}

/** Base card style — panel surface tinted by run state, PipeNode-identical. */
export function cardStyle(opts: CardChromeOpts): CSSProperties {
  const { pos, width = WF_NODE_W, height = WF_NODE_H, state, selected, dimmed, recessed } = opts
  const panel = 'var(--color-uikit-panel)'
  const active = state && state !== 'idle' && state !== 'skipped'
  const stateColor = state ? WF_STATE_COLOR[state] : undefined
  // The colour that carries a selection. A running / done / failed node keeps its
  // status colour; an idle / not-yet-run node (or a stage) uses NEUTRAL grey
  // (muted) — never a status colour like the accent blue, which would read as
  // "running", and softer than full ink. The strengthened border/ring/tint below
  // keep even the grey selection clearly readable.
  const selColor = stateColor ?? 'var(--color-uikit-muted)'
  const bg = selected
    ? `color-mix(in srgb, ${panel} ${active ? '85%' : '92%'}, ${selColor})`
    : active
      ? `color-mix(in srgb, ${panel} 90%, ${stateColor})`
      : panel
  const border = selected
    ? selColor
    : active
      ? `color-mix(in srgb, var(--color-uikit-faint) 55%, ${stateColor})`
      // Recessed idle sub-cards use an even fainter outline than a member card
      // so they don't compete with their parent node.
      : recessed
        ? 'color-mix(in srgb, var(--color-uikit-faint) 60%, transparent)'
        : 'var(--color-uikit-faint)'
  return {
    ...(pos ? { position: 'absolute', left: pos.x, top: pos.y } : { position: 'relative' }),
    width,
    height,
    background: bg,
    // Member cards: border a touch heavier than the edge lines (~1.4px) so card
    // outline and connectors read at one consistent weight. Recessed sub-cards
    // (agents) drop to 1px so they read as subordinate, not peer.
    border: `${recessed ? 1 : selected ? 2 : 1.5}px solid ${border}`,
    borderRadius: recessed ? 6 : 7,
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    boxSizing: 'border-box',
    overflow: 'hidden',
    // The drop shadow is what makes a card read as a floating peer. Recessed
    // sub-cards sit FLAT on the plane (no shadow) so they belong to their
    // parent node rather than standing alongside the members.
    boxShadow: recessed
      ? 'none'
      : selected
        // A soft ring in the selection colour + a slightly deeper drop shadow
        // lift the selected card off the plane — stronger than the original, but
        // dialled back from the first (too-heavy) pass.
        ? `0 0 0 2px color-mix(in srgb, ${selColor} 22%, transparent), 0 1px 0 rgba(0,0,0,.05), 0 8px 20px rgba(0,0,0,.11)`
        : '0 1px 0 rgba(0,0,0,.04)',
    opacity: dimmed ? 0.4 : state === 'skipped' ? 0.55 : 1,
    transition: 'opacity 160ms ease, border-color 120ms ease, background 120ms ease, box-shadow 120ms ease',
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

/** 9px uppercase meta line (PipeNode's second row). Block-level so
 *  text-overflow ellipsis actually applies (spans are inline by default). */
export const metaStyle: CSSProperties = {
  display: 'block',
  minWidth: 0,
  maxWidth: '100%',
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

/** Chip row inside a card: clips its children, lets flexible chips shrink. */
export const chipRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  minWidth: 0,
  width: '100%',
  overflow: 'hidden',
}

/** Fixed chip height — content is vertically centred against it. */
const CHIP_H = 15

/** Tiny inline chip (launcher badge, model chip, queue chip). A flex box with a
 *  fixed height centres its content (text, or icon + text) vertically in the
 *  pill — no baseline drift. */
export const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: CHIP_H,
  boxSizing: 'border-box',
  fontSize: 8.5,
  fontWeight: 600,
  letterSpacing: '.04em',
  textTransform: 'uppercase',
  lineHeight: 1,
  color: 'var(--color-uikit-muted)',
  // Borderless soft chip — a faint fill carries the shape, no outline (keeps
  // the compute/uda chip rows quieter than the bordered pills they were).
  background: 'color-mix(in oklab, var(--color-uikit-ink) 6%, transparent)',
  borderRadius: 4,
  padding: '0 6px',
  whiteSpace: 'nowrap',
  flexShrink: 0,
}

/** A chip allowed to truncate when the row runs out of room. Uses inline-block
 *  (not flex) so text-overflow ellipsis still applies; a line-height equal to
 *  the chip height keeps the single line vertically centred. */
export const chipFlexStyle: CSSProperties = {
  ...chipStyle,
  display: 'inline-block',
  lineHeight: `${CHIP_H}px`,
  flexShrink: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

/** Prompt / free-text preview line (uda cards). Block-level for ellipsis. */
export const previewStyle: CSSProperties = {
  display: 'block',
  minWidth: 0,
  maxWidth: '100%',
  fontSize: 9.5,
  color: 'var(--color-uikit-muted)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontStyle: 'italic',
}
