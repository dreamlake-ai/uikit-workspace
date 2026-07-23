/**
 * Member node cards — compute / uda / sampler / control — plus the run-time
 * AgentInstanceCard. All share the PipelineGraph card DNA via chrome.ts and
 * render in-flow unless `pos` is given.
 */
import type { PointerEvent as ReactPointerEvent } from 'react'
import type {
  AgentInstance, ComputeNode, ControlNode, SamplerNode, UdaNode,
  WorkflowNodeRunStateValue,
} from '../spec'
import { providerSummary, samplerSummary } from '../spec'
import {
  WF_AGENT_H, WF_AGENT_W, WF_KIND_LABEL, WF_KIND_TOKEN, WF_STATE_COLOR,
  cardStyle, chipStyle, kindDotStyle, metaStyle, previewStyle, titleRowStyle, titleStyle,
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

// ---------------------------------------------------------------------------

export interface ComputeNodeCardProps extends MemberCardCommon { node: ComputeNode }

export function ComputeNodeCard({ node, ...p }: ComputeNodeCardProps) {
  const prov = providerSummary(node.compute.provider)
  const dispatch = node.compute.dispatch ?? node.compute.provider?.dispatch
  return (
    <div
      data-node={node.id}
      title={node.detail ?? node.compute.udf}
      style={{ ...cardStyle(p), ...pulseStyle(p.state) }}
      {...handlers(p)}
    >
      <div style={titleRowStyle}>
        <span style={kindDotStyle(WF_KIND_TOKEN.compute)} />
        <span style={titleStyle}>{node.title}</span>
      </div>
      <span style={metaStyle}>{WF_KIND_LABEL.compute} · {node.compute.udf}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
        {prov && <span style={chipStyle}>{prov}</span>}
        {dispatch && (
          <span style={{ ...chipStyle, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <span style={{
              width: 4, height: 4, borderRadius: 2, flexShrink: 0,
              background: dispatch === 'daemon'
                ? 'var(--color-uikit-tone-green)' : 'var(--color-uikit-tone-blue)',
            }} />
            {dispatch}
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
      title={node.uda.prompt}
      style={{ ...cardStyle(p), ...pulseStyle(p.state) }}
      {...handlers(p)}
    >
      <div style={titleRowStyle}>
        <span style={kindDotStyle(WF_KIND_TOKEN.uda)} />
        <span style={titleStyle}>{node.title}</span>
      </div>
      <span style={previewStyle}>“{node.uda.prompt}”</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
        {node.uda.model && <span style={chipStyle}>{node.uda.model}</span>}
        <span style={chipStyle}>{perms} perm{perms === 1 ? '' : 's'}</span>
        {target && <span style={{ ...chipStyle, overflow: 'hidden', textOverflow: 'ellipsis' }}>{target}</span>}
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
      style={{ ...cardStyle(p), ...pulseStyle(p.state), justifyContent: 'center' }}
      {...handlers(p)}
    >
      <div style={titleRowStyle}>
        <span style={kindDotStyle(WF_KIND_TOKEN.sampler)} />
        <span style={titleStyle}>{node.title}</span>
      </div>
      <span style={metaStyle}>{WF_KIND_LABEL.sampler} · {samplerSummary(node.sampler)}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------

const CONTROL_GLYPH: Record<ControlNode['control']['type'], string> = {
  condition: '◇',
  branch: '⑃',
  loop: '⟲',
  approval: '⏸',
}

export interface ControlNodeCardProps extends MemberCardCommon { node: ControlNode }

export function ControlNodeCard({ node, ...p }: ControlNodeCardProps) {
  const c = node.control
  const detail =
    c.type === 'condition' ? c.expression
    : c.type === 'branch' ? `${c.cases.length} cases`
    : c.type === 'loop' ? (c.until ? `until ${c.until}` : `× ${c.maxIterations ?? '∞'}`)
    : (c.message ?? 'human approval')
  return (
    <div
      data-node={node.id}
      title={node.detail ?? detail}
      style={{ ...cardStyle(p), ...pulseStyle(p.state), justifyContent: 'center' }}
      {...handlers(p)}
    >
      <div style={titleRowStyle}>
        <span style={{
          fontSize: 11, lineHeight: 1, color: WF_KIND_TOKEN.control, flexShrink: 0, width: 11, textAlign: 'center',
        }}>{CONTROL_GLYPH[c.type]}</span>
        <span style={titleStyle}>{node.title}</span>
      </div>
      <span style={metaStyle}>{WF_KIND_LABEL.control} · {c.type} · {detail}</span>
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
    state: agent.state, dimmed,
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
