/**
 * Workflow v2 spec — RENDER-SIDE types for the typed workflow graph.
 *
 * A workflow is a spine of ordered stages; member nodes (compute / uda /
 * sampler / control) fan out from their stage. Data edges connect member
 * nodes (and may cross stages); the stage→stage spine is implied by array
 * order. Stages GROUP work — they are not barriers (cross-stage edges are
 * legal; cf. GitLab's stageless-pipeline lesson).
 *
 * Vocabulary is grounded in established systems:
 *  - port types: KFP v2 artifact lattice rooted at `artifact`, with Flyte's
 *    table-vs-blob distinction and CWL's single File-with-format principle
 *  - control flow: BPMN 2.0 gateways / workflow control-flow patterns
 *    (WCP-4 exclusive choice → switch; WCP-21 structured loop vs
 *    multi-instance → loop.mode) and Argo's `suspend` for approval
 *  - sampler: statistical naming (Bernoulli vs fixed-n SRS) with
 *    Spark/Pandas/SQL parameter conventions (`fraction`, `size`, `seed`)
 *  - uda: OpenAI Agents SDK / Claude Agent SDK / A2A field conventions
 *    (`instructions`, `tools`, `model`), IAM/K8s-style permission grants
 *
 * The CANONICAL schema + validator will live server-side in
 * dreamlake-server/src/lib/workflow-spec.ts (later subplan) — keep these
 * types structurally in sync with it. This file must stay dependency-free.
 */

export const WORKFLOW_SPEC_VERSION = 1

/**
 * Closed port-type set: a KFP-style artifact lattice. `artifact` is the
 * ROOT type and doubles as "any" (KFP `system.Artifact` is compatible with
 * every subtype — no separate `any` escape hatch).
 *
 *  - `file` / `directory` — opaque blob, single vs multipart (CWL
 *    File/Directory; Flyte Blob dimensionality). Format is metadata, not
 *    more types.
 *  - `table` — schema-carrying tabular data (Flyte StructuredDataset).
 *  - `dataset` — a versioned data PRODUCT (KFP system.Dataset); may span
 *    many shards + manifest. A table is a shape; a dataset is a product.
 *  - `model` / `metrics` — KFP system.Model / system.Metrics.
 *  - `samples` — domain type: an addressable collection of media samples /
 *    episodes (DreamLake Node refs), modeled like KFP models Dataset.
 */
export type WorkflowDataType =
  | 'artifact'   // root — accepts every subtype
  | 'file'
  | 'directory'
  | 'table'
  | 'dataset'
  | 'model'
  | 'metrics'
  | 'samples'

/** Subtype → root assignability (KFP rule): equal types, or into `artifact`. */
export function portTypesCompatible(from: WorkflowDataType, to: WorkflowDataType): boolean {
  return from === to || to === 'artifact'
}

export interface PortSpec {
  name: string
  type: WorkflowDataType
}

/** Spine node — one stage of the workflow (Azure DevOps-style grouping). */
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
  inputs?: PortSpec[]   // default [{ name: 'in',  type: 'artifact' }]
  outputs?: PortSpec[]  // default [{ name: 'out', type: 'artifact' }]
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

/**
 * User-Defined Agent ("remote agent"). Field names follow agent-framework
 * conventions (OpenAI Agents SDK / Claude Agent SDK / A2A):
 *  - `instructions` — the system prompt (NOT `prompt`, which is ambiguous
 *    with the per-run task input)
 *  - `description` — when to delegate to this agent (routing metadata)
 *  - `tools` — tool grants by name (own field per every major framework;
 *    tool access is NOT expressed as permission strings)
 *  - `permissions` — data/resource grants, IAM-style `domain.resource.verb`
 *    (lowercase; verbs read|create|update|delete + registered custom verbs
 *    like `release`, `run`, `submit`; optional `:scope` suffix), e.g.
 *    "dreamlake.datasets.read", "dreamlake.datasets.release",
 *    "lakeshore.queues.submit:gpu-a10g"
 */
export interface UdaNode extends WorkflowNodeBase {
  kind: 'uda'
  uda: {
    instructions: string
    description?: string
    model?: string
    tools?: string[]
    permissions: string[]
    /** Turn budget (Claude Agent SDK `maxTurns` precedent). */
    max_turns?: number
    /** JSON Schema for the agent's structured final output (MCP/OpenAI). */
    output_schema?: Record<string, unknown>
    /** Exactly one of provider | queue. */
    provider?: ProviderRef
    queue?: string
  }
}

/**
 * Sampler strategies use statistically correct names:
 *  - `bernoulli` — each item kept independently with prob `fraction`
 *    (what SQL TABLESAMPLE BERNOULLI / Spark df.sample do; the resulting
 *    count is probabilistic). `min_size` is OUR floor extension (no
 *    standard API has one): if fraction·N < min_size, degrade to an
 *    exact-size simple random sample of min(min_size, N).
 *  - `random_n` — exact-size simple random sample without replacement
 *    (reservoir sampling is the streaming implementation, not the name).
 *  - `stratified` — per-stratum sampling by `stratify_by` (Spark sampleBy /
 *    sklearn stratify); uniform `fraction` or per-stratum `fractions`.
 *  - `first_n` — head/LIMIT. Deterministic and order-dependent; NOT a
 *    statistical sample — kept for convenience, named honestly.
 * Determinism: identical input + identical `seed` ⇒ identical output
 * (SQL REPEATABLE semantics); absent seed ⇒ non-reproducible.
 */
export interface SamplerNode extends WorkflowNodeBase {
  kind: 'sampler'
  sampler:
    | { strategy: 'bernoulli'; fraction: number; min_size?: number; seed?: number }
    | { strategy: 'random_n'; size: number; with_replacement?: boolean; seed?: number }
    | {
        strategy: 'stratified'
        stratify_by: string
        fraction?: number
        fractions?: Record<string, number>
        min_size?: number
        seed?: number
      }
    | { strategy: 'first_n'; size: number }
}

/**
 * Control-flow nodes (BPMN 2.0 / workflow control-flow patterns):
 *  - `condition` — binary exclusive choice; out ports `true` / `false`.
 *  - `switch` — n-way exclusive choice (WCP-4); one out port per case
 *    plus a REQUIRED `default` port (keeps XOR semantics total).
 *  - `loop` — `mode: 'while'` is a condition-bounded structured loop
 *    (WCP-21); `mode: 'foreach'` is collection-driven multi-instance
 *    (BPMN multi-instance / CWL scatter).
 *  - `approval` — human gate with Argo `suspend` semantics: pauses
 *    indefinitely (or until `timeout_s`), and the approver may supply
 *    output values (reviewer feedback is data).
 * Plain fan-out/fan-in stays IMPLICIT in DAG edges (as in CWL / Flyte /
 * Argo DAG) — no AND-gateway nodes.
 */
export type ControlConfig =
  | { type: 'condition'; expression: string }
  | { type: 'switch'; cases: { name: string; expression: string }[] }
  | {
      type: 'loop'
      mode: 'while' | 'foreach'
      until?: string        // while: exit condition
      over?: string         // foreach: collection expression
      max_iterations?: number
      max_concurrency?: number // foreach
    }
  | { type: 'approval'; approvers?: string[]; message?: string; timeout_s?: number }

export interface ControlNode extends WorkflowNodeBase {
  kind: 'control'
  control: ControlConfig
}

export type WorkflowNodeSpec = ComputeNode | UdaNode | SamplerNode | ControlNode
export type WorkflowNodeKind = WorkflowNodeSpec['kind']

export interface WorkflowSpecEdge {
  id: string
  from: string
  fromPort?: string // default 'out' (condition: 'true'|'false'; switch: case name or 'default')
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

export const DEFAULT_IN_PORT: PortSpec = { name: 'in', type: 'artifact' }
export const DEFAULT_OUT_PORT: PortSpec = { name: 'out', type: 'artifact' }

export function nodeInputs(n: WorkflowNodeSpec): PortSpec[] {
  return n.inputs && n.inputs.length ? n.inputs : [DEFAULT_IN_PORT]
}

/** Output ports — condition/switch control nodes derive theirs from config. */
export function nodeOutputs(n: WorkflowNodeSpec): PortSpec[] {
  if (n.kind === 'control') {
    if (n.control.type === 'condition') {
      return [
        { name: 'true', type: 'artifact' },
        { name: 'false', type: 'artifact' },
      ]
    }
    if (n.control.type === 'switch') {
      return [
        ...n.control.cases.map((c) => ({ name: c.name, type: 'artifact' as const })),
        { name: 'default', type: 'artifact' as const },
      ]
    }
  }
  return n.outputs && n.outputs.length ? n.outputs : [DEFAULT_OUT_PORT]
}

/** One-line human summary of a sampler config, e.g. "bernoulli 10% · ≥50". */
export function samplerSummary(s: SamplerNode['sampler']): string {
  switch (s.strategy) {
    case 'bernoulli': {
      const parts = [`${Math.round(s.fraction * 100)}%`]
      if (s.min_size != null) parts.push(`≥${s.min_size}`)
      return parts.join(' · ')
    }
    case 'random_n':
      return `n=${s.size}${s.with_replacement ? ' · w/ repl' : ''}`
    case 'stratified': {
      const parts = [`by ${s.stratify_by}`]
      if (s.fraction != null) parts.push(`${Math.round(s.fraction * 100)}%`)
      if (s.min_size != null) parts.push(`≥${s.min_size}`)
      return parts.join(' · ')
    }
    case 'first_n':
      return `first ${s.size}`
  }
}

/** One-line provider summary for chips, e.g. "SLURM · xeon-g6" or a name. */
export function providerSummary(p?: ProviderRef): string | null {
  if (!p) return null
  const head = p.launcher ?? p.provider ?? null
  const detail = p.instance_type ?? p.partition ?? null
  if (head && detail) return `${head} · ${detail}`
  return head ?? detail
}
