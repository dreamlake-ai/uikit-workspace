/**
 * Workflow v2 spec — RENDER-SIDE types for the typed workflow graph.
 *
 * A workflow is a spine of ordered stages; member nodes (compute / uda /
 * sampler / control) fan out from their stage. Data edges connect member
 * nodes (and cross stages); the stage→stage spine is implied by array order.
 *
 * The CANONICAL schema + validator will live server-side in
 * dreamlake-server/src/lib/workflow-spec.ts (later subplan) — keep these
 * types structurally in sync with it. This file must stay dependency-free.
 */

export const WORKFLOW_SPEC_VERSION = 1

/** Closed IO type set for typed edges. */
export type WorkflowDataType =
  | 'nodes'     // DreamLake Node refs (episodes / videos / files)
  | 'dataset'   // a Dataset / Bindr
  | 'table'     // tabular rows
  | 'json'
  | 'text'
  | 'files'
  | 'artifact'
  | 'any'

export interface PortSpec {
  name: string
  type: WorkflowDataType
}

/** Spine node — one phase/stage of the workflow. */
export interface WorkflowStage {
  id: string
  title: string
  detail?: string
}

/**
 * Lakeshore provider / RunConfig block (see lakeshore admin-providers docs).
 * `provider` names a server-stored provider; `launcher` + `kwargs` is the
 * inline alternative. Per-machine RunConfig fields ride alongside.
 */
export interface ProviderRef {
  provider?: string
  launcher?: 'SSH' | 'SLURM' | 'EC2' | 'GCE' | 'Kube'
  kwargs?: Record<string, unknown>
  instance_type?: string
  image_id?: string
  image?: string
  partition?: string
  time_limit?: string
  resources?: { cpu?: number; gpu?: number; mem?: string }
  runner?: 'process' | 'docker'
  dispatch?: 'direct' | 'daemon'
}

/** Where a node's output lands in DreamLake (recorded per-run as OutputRefs). */
export interface OutputBinding {
  kind: 'dataset' | 'artifact' | 'node' | 'bindr'
  project?: string
  /** Template vars: {workflow} {runId} {nodeId} {stageId} {date} */
  pathTemplate: string
}

interface WorkflowNodeBase {
  id: string
  /** The stage this node fans out from. */
  stageId: string
  title: string
  detail?: string
  inputs?: PortSpec[]   // default [{ name: 'in',  type: 'any' }]
  outputs?: PortSpec[]  // default [{ name: 'out', type: 'any' }]
  outputBinding?: OutputBinding
}

export interface ComputeNode extends WorkflowNodeBase {
  kind: 'compute'
  compute: {
    /** UDF reference, e.g. "pipelines.bimanual_filter" */
    udf: string
    provider?: ProviderRef
    dispatch?: 'direct' | 'daemon'
  }
}

export interface UdaNode extends WorkflowNodeBase {
  kind: 'uda'
  uda: {
    prompt: string
    model?: string
    /** Permission grant strings, e.g. "ToolUse.Bash", "DreamLake.datasets.read" */
    permissions: string[]
    /** Exactly one of provider | queue. */
    provider?: ProviderRef
    queue?: string
  }
}

export interface SamplerNode extends WorkflowNodeBase {
  kind: 'sampler'
  sampler: {
    strategy: 'fraction' | 'count' | 'stratified' | 'first' | 'random'
    fraction?: number
    count?: number
    atLeast?: number
    stratifyBy?: string
    seed?: number
  }
}

export type ControlConfig =
  | { type: 'condition'; expression: string }                        // out ports: true / false
  | { type: 'branch'; cases: { name: string; expression: string }[] } // one out port per case
  | { type: 'loop'; over?: string; until?: string; maxIterations?: number }
  | { type: 'approval'; approvers?: string[]; message?: string }

export interface ControlNode extends WorkflowNodeBase {
  kind: 'control'
  control: ControlConfig
}

export type WorkflowNodeSpec = ComputeNode | UdaNode | SamplerNode | ControlNode
export type WorkflowNodeKind = WorkflowNodeSpec['kind']

export interface WorkflowSpecEdge {
  id: string
  from: string
  fromPort?: string // default 'out' (condition: 'true' | 'false'; branch: case name)
  to: string
  toPort?: string   // default 'in'
}

export interface WorkflowSpec {
  version: 1
  name: string
  description?: string
  /** Ordered — array order IS the spine. */
  stages: WorkflowStage[]
  nodes: WorkflowNodeSpec[]
  edges: WorkflowSpecEdge[]
  defaults?: { model?: string; provider?: string; queue?: string }
}

// ---------------------------------------------------------------------------
// Run overlay
// ---------------------------------------------------------------------------

/** Per-node runtime state (from trace.nodes[], keyed by spec node id). */
export type WorkflowNodeRunStateValue =
  | 'idle' | 'queued' | 'progress' | 'done' | 'error' | 'skipped'

export interface WorkflowNodeRunState {
  nodeId: string
  state: WorkflowNodeRunStateValue
  startedAt?: string
  durationMs?: number
  summary?: string
}

/** A fanned-out agent instance under a uda node during a run. */
export interface AgentInstance {
  agentId: string
  label?: string
  state: WorkflowNodeRunStateValue
  model?: string
  tokens?: number
  durationMs?: number
}

// ---------------------------------------------------------------------------
// Helpers (render-side conveniences, no validation)
// ---------------------------------------------------------------------------

export const DEFAULT_IN_PORT: PortSpec = { name: 'in', type: 'any' }
export const DEFAULT_OUT_PORT: PortSpec = { name: 'out', type: 'any' }

export function nodeInputs(n: WorkflowNodeSpec): PortSpec[] {
  return n.inputs && n.inputs.length ? n.inputs : [DEFAULT_IN_PORT]
}

/** Output ports — condition/branch control nodes derive theirs from config. */
export function nodeOutputs(n: WorkflowNodeSpec): PortSpec[] {
  if (n.kind === 'control') {
    if (n.control.type === 'condition') {
      return [
        { name: 'true', type: 'any' },
        { name: 'false', type: 'any' },
      ]
    }
    if (n.control.type === 'branch') {
      return n.control.cases.map((c) => ({ name: c.name, type: 'any' as const }))
    }
  }
  return n.outputs && n.outputs.length ? n.outputs : [DEFAULT_OUT_PORT]
}

/** One-line human summary of a sampler config, e.g. "10% · ≥50". */
export function samplerSummary(s: SamplerNode['sampler']): string {
  const parts: string[] = []
  switch (s.strategy) {
    case 'fraction':
      parts.push(`${Math.round((s.fraction ?? 0) * 100)}%`)
      break
    case 'count':
      parts.push(`n=${s.count ?? '?'}`)
      break
    case 'first':
      parts.push(`first ${s.count ?? '?'}`)
      break
    case 'random':
      parts.push(`random ${s.count ?? '?'}`)
      break
    case 'stratified':
      parts.push(`stratified: ${s.stratifyBy ?? '?'}`)
      break
  }
  if (s.atLeast != null) parts.push(`≥${s.atLeast}`)
  return parts.join(' · ')
}

/** One-line provider summary for chips, e.g. "SLURM · xeon-g6" or "queue: gpu-t4". */
export function providerSummary(p?: ProviderRef): string | null {
  if (!p) return null
  const head = p.launcher ?? p.provider ?? null
  const detail = p.instance_type ?? p.partition ?? null
  if (head && detail) return `${head} · ${detail}`
  return head ?? detail
}
