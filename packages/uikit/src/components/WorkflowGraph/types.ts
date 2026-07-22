/**
 * Workflow graph data model — the run-trace JSON a Claude Code workflow run
 * pushes to dreamlake-server (`WorkflowRun.trace`) and this component renders.
 *
 * Unlike PipelineGraph's dataflow DAG, a workflow graph is a RUNTIME trace:
 * `phases` are declared up front in the script's `export const meta` literal,
 * but `agents` only exist once a run fans them out. Before any run, only the
 * phase skeleton renders; while a run is live, re-rendering with each trace
 * snapshot grows the graph in place.
 *
 * The CLI that reduces run files to this shape tolerates format drift, so
 * every field beyond `title` / `index` / `state` is best-effort — render code
 * must survive any of them missing.
 */

/** A phase band — declared (script meta, `detail` optional) or traced (run). */
export interface WorkflowPhase {
  /** Position in the phase order; falls back to array order when omitted. */
  index?: number
  title: string
  /** Meta-declared description — shown on the skeleton ghost node. */
  detail?: string | null
}

/** Agent lifecycle state within a run. */
export type WorkflowAgentState = 'queued' | 'progress' | 'done' | 'error'

/** One fanned-out agent in the run trace. */
export interface WorkflowAgentNode {
  /** Spawn order — unique within a run (label / agentId may be missing). */
  index: number
  label?: string | null
  /** Matches `WorkflowPhase.index`; unmatched agents get a synthetic band. */
  phaseIndex?: number | null
  phaseTitle?: string | null
  agentId?: string | null
  model?: string | null
  state: WorkflowAgentState
  queuedAt?: string | number | null
  startedAt?: string | number | null
  lastProgressAt?: string | number | null
  durationMs?: number | null
  /** 1-based; > 1 means the agent errored and was retried. */
  attempt?: number | null
  tokens?: number | null
  toolCalls?: number | null
  lastToolName?: string | null
  lastToolSummary?: string | null
  promptPreview?: string | null
  resultPreview?: string | null
}

/** Overall run status (`WorkflowRun.status` server-side). */
export type WorkflowRunStatus = 'running' | 'completed' | 'killed' | 'error' | (string & {})

/** The full run-trace contract (stored opaque server-side). The graph consumes
 *  `phases` + `agents` + `defaultModel`; the rest is carried for detail UIs. */
export interface WorkflowTrace {
  phases: WorkflowPhase[]
  agents: WorkflowAgentNode[]
  logs?: string[]
  totalToolCalls?: number
  defaultModel?: string
}
