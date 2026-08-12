/**
 * Member node cards — compute / uda / sampler / control — plus the run-time
 * AgentInstanceCard. All share the PipelineGraph card DNA via chrome.ts and
 * render in-flow unless `pos` is given.
 */
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { Diamond, Pause, RotateCcw, Split, type LucideIcon } from 'lucide-react'
import type {
  AgentInstance, ComputeNode, ControlNode, SamplerNode, UdaNode,
  WorkflowNodeRunStateValue,
} from '../spec'
import { providerSummary, samplerSummary } from '../spec'
import {
  WF_AGENT_H, WF_AGENT_W, WF_KIND_ICON, WF_KIND_LABEL, WF_STATE_COLOR,
  cardStyle, chipFlexStyle, chipRowStyle, chipStyle, metaStyle,
  titleRowStyle, titleStyle,
} from './chrome'

interface MemberCardCommon {
  pos?: { x: number; y: number }
  state?: WorkflowNodeRunStateValue
  selected?: boolean
  dimmed?: boolean
  onPointerDown?: (e: ReactPointerEvent) => void
  onPointerMove?: (e: ReactPointerEvent) => void
  onPointerUp?: (e: ReactPointerEvent) => void
}

function pulseStyle(state?: WorkflowNodeRunStateValue) {
  return state === 'progress' ? { animation: 'wfNodePulse 2s ease-in-out infinite' } : undefined
}

const handlers = (p: MemberCardCommon) => ({
  onPointerDown: p.onPointerDown,
  onPointerMove: p.onPointerMove,
  onPointerUp: p.onPointerUp,
})

/** A node's leading glyph: the kind's lucide icon carries the TYPE (shape), tinted
 *  by run STATUS (neutral muted when there's no run state) — so colour never
 *  encodes type. Sized to sit at the title's visual height and vertically centred
 *  with it (titleRowStyle centres the row). `color`/`size` override for the legend. */
export function NodeKindIcon({ icon: Icon, state, color, size = 13 }: {
  icon: LucideIcon
  state?: WorkflowNodeRunStateValue
  color?: string
  size?: number
}) {
  const c = color ?? (state ? WF_STATE_COLOR[state] : 'var(--color-uikit-muted)')
  return (
    <span style={{
      flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: c,
    }}>
      <Icon size={size} strokeWidth={2} />
    </span>
  )
}

// ---------------------------------------------------------------------------

/** How to display a compute node's dispatch mode. Which icon / label a mode
 *  gets is business config, so the host injects it — the card renders only what
 *  it's handed (label falls back to the raw mode string, icon is optional). */
export type DispatchMeta = Record<string, { icon?: ReactNode; label?: string }>

export interface ComputeNodeCardProps extends MemberCardCommon {
  node: ComputeNode
  dispatchMeta?: DispatchMeta
}

export function ComputeNodeCard({ node, dispatchMeta, ...p }: ComputeNodeCardProps) {
  const prov = providerSummary(node.compute.provider)
  const dispatch = node.compute.dispatch ?? node.compute.provider?.dispatch
  const dispatchInfo = dispatch ? dispatchMeta?.[dispatch] : undefined
  return (
    <div
      data-node={node.id}
      title={node.detail ?? node.compute.udf}
      style={{ ...cardStyle(p), ...pulseStyle(p.state) }}
      {...handlers(p)}
    >
      <div style={titleRowStyle}>
        <NodeKindIcon icon={WF_KIND_ICON.compute} state={p.state} />
        <span style={titleStyle}>{node.title}</span>
      </div>
      <span style={metaStyle}>{WF_KIND_LABEL.compute}</span>
      <div style={chipRowStyle}>
        {prov && <span style={chipFlexStyle}>{prov}</span>}
        {dispatch && (
          // Dispatch mode as a soft pill. The icon + label come from the injected
          // dispatchMeta (business config), not from any mode logic in here.
          <span style={{ ...chipStyle, gap: 4 }}>
            {dispatchInfo?.icon}
            {dispatchInfo?.label ?? dispatch}
          </span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

export interface UdaNodeCardProps extends MemberCardCommon { node: UdaNode }

export function UdaNodeCard({ node, ...p }: UdaNodeCardProps) {
  const target = node.uda.queue
    ? `queue: ${node.uda.queue}`
    : providerSummary(node.uda.provider)
  const perms = node.uda.permissions.length
  return (
    <div
      data-node={node.id}
      title={node.uda.description ?? node.uda.instructions}
      style={{ ...cardStyle(p), ...pulseStyle(p.state) }}
      {...handlers(p)}
    >
      <div style={titleRowStyle}>
        <NodeKindIcon icon={WF_KIND_ICON.uda} state={p.state} />
        <span style={titleStyle}>{node.title}</span>
      </div>
      <span style={metaStyle}>{WF_KIND_LABEL.uda}</span>
      <div style={chipRowStyle}>
        {/* perms count is short and always visible; model + target truncate */}
        <span style={chipStyle}>{perms} perm{perms === 1 ? '' : 's'}</span>
        {node.uda.model && <span style={chipFlexStyle}>{node.uda.model}</span>}
        {target && <span style={chipFlexStyle}>{target}</span>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

export interface SamplerNodeCardProps extends MemberCardCommon { node: SamplerNode }

export function SamplerNodeCard({ node, ...p }: SamplerNodeCardProps) {
  return (
    <div
      data-node={node.id}
      title={node.detail ?? node.title}
      style={{ ...cardStyle(p), ...pulseStyle(p.state) }}
      {...handlers(p)}
    >
      <div style={titleRowStyle}>
        <NodeKindIcon icon={WF_KIND_ICON.sampler} state={p.state} />
        <span style={titleStyle}>{node.title}</span>
      </div>
      <span style={metaStyle}>{WF_KIND_LABEL.sampler} · {samplerSummary(node.sampler)}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------

// Per-subtype control-flow icons. Rendered through the shared NodeKindIcon, so
// they match every other kind's icon exactly (same size + stroke weight, tinted
// by run status).
const CONTROL_ICON: Record<ControlNode['control']['type'], LucideIcon> = {
  condition: Diamond,
  switch: Split,
  loop: RotateCcw,
  approval: Pause,
}

export interface ControlNodeCardProps extends MemberCardCommon { node: ControlNode }

export function ControlNodeCard({ node, ...p }: ControlNodeCardProps) {
  const c = node.control
  const detail =
    c.type === 'condition' ? c.expression
    : c.type === 'switch' ? `${c.cases.length} cases + default`
    : c.type === 'loop'
      ? c.mode === 'foreach'
        ? `foreach ${c.over ?? '?'}`
        : `while · until ${c.until ?? `× ${c.max_iterations ?? '∞'}`}`
    : (c.message ?? 'human approval')
  return (
    <div
      data-node={node.id}
      title={node.detail ?? detail}
      style={{ ...cardStyle(p), ...pulseStyle(p.state) }}
      {...handlers(p)}
    >
      <div style={titleRowStyle}>
        {/* Control nodes keep a per-SUBTYPE icon (condition / switch / loop /
            approval) — its shape is the type; the colour tracks run status. */}
        <NodeKindIcon icon={CONTROL_ICON[c.type]} state={p.state} />
        <span style={titleStyle}>{node.title}</span>
      </div>
      <span style={metaStyle}>{WF_KIND_LABEL.control} · {c.type}</span>
      {/* detail (expression / loop bounds / approval message) on its own line
          below the meta — normal-case so expressions stay readable. */}
      <span style={{ ...metaStyle, textTransform: 'none', letterSpacing: 0, fontSize: 9.5 }}>{detail}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------

export interface AgentInstanceCardProps {
  agent: AgentInstance
  pos?: { x: number; y: number }
  dimmed?: boolean
}

/** Small run-time card fanned under its uda node. */
export function AgentInstanceCard({ agent, pos, dimmed }: AgentInstanceCardProps) {
  const base = cardStyle({
    pos, width: WF_AGENT_W, height: WF_AGENT_H,
    state: agent.state, dimmed, recessed: true,
  })
  const bits: string[] = []
  if (agent.tokens != null) bits.push(`${agent.tokens >= 1000 ? `${(agent.tokens / 1000).toFixed(1)}k` : agent.tokens} tok`)
  if (agent.durationMs != null) bits.push(`${(agent.durationMs / 1000).toFixed(0)}s`)
  return (
    <div
      data-agent={agent.agentId}
      title={agent.label ?? agent.agentId}
      style={{ ...base, padding: '5px 8px', gap: 2, justifyContent: 'center', cursor: 'default', ...pulseStyle(agent.state) }}
    >
      <div style={titleRowStyle}>
        <span style={{
          width: 6, height: 6, borderRadius: 3, flexShrink: 0,
          background: WF_STATE_COLOR[agent.state],
        }} />
        <span style={{ ...titleStyle, fontSize: 10.5 }}>{agent.label ?? agent.agentId}</span>
      </div>
      {bits.length > 0 && <span style={{ ...metaStyle, fontSize: 8 }}>{bits.join(' · ')}</span>}
    </div>
  )
}
