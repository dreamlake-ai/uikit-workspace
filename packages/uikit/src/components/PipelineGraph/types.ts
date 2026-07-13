/**
 * Pipeline graph data model — the JSON the `dl_trace` tracer emits and this
 * component renders. Mirrors the DreamLake Studio pipeline design prototype
 * (node / edge / pipeline). The Python tracer is the source of truth for the
 * JSON; keep these in sync with it.
 *
 * A pipeline is a plain `@dl.pipeline` function whose stages are `@ls.udf`
 * functions; the graph is a DERIVED view of that code (dataflow-traced), never
 * hand-authored. Placeholder bodies (`...`) trace like real ones, so a graph
 * renders long before any node is implemented.
 *
 * Edges carry NO runtime style: an edge's visual "flow" (running / ok / error
 * / stalled / queued / idle) is derived at render time from the `status` of its
 * two endpoint nodes. Keeping node `status` live is all it takes to animate the
 * graph while a pipeline runs.
 */

/** Cosmetic node category — drives the card's kind dot colour. */
export type NodeKind =
  | 'source'
  | 'transform'
  | 'model'
  | 'filter'
  | 'merge'
  | 'sink'
  | 'review'
  | (string & {})

/** Runtime state. A freshly traced graph is entirely `idle`. `waiting` is the
 *  human-in-the-loop pause (the node is serving a labeling UI, not computing) —
 *  distinct from `running`. */
export type NodeStatus = 'idle' | 'running' | 'waiting' | 'ok' | 'error' | 'stale'

export interface GraphNode {
  // —— static (filled by the tracer) ——
  id: string
  title: string
  kind: NodeKind
  /** Input ports = the udf's parameters (one dot each). */
  inputs: string[]
  /** Output ports = the result. A udf returns ONE table, so this is a single
   *  port (`['out']`); a sink has none (`[]`). Columns live in `columns`. */
  outputs: string[]
  /** The result's schema — the return column names (not ports). */
  columns?: string[]
  /** This stage's source (null for synthetic source/sink nodes). */
  code: string | null
  /** Decorator kwargs, e.g. `{ kind: 'review' }`. */
  config?: Record<string, unknown>
  /** Auto-laid-out canvas position (longest-path layering). */
  pos: { x: number; y: number }
  status: NodeStatus
  // —— runtime (filled by the runner; optional) ——
  progress?: number | null
  duration?: number | null
  rows?: number | null
  output?: unknown
}

export interface GraphEdge {
  from: string
  fromPort: string
  to: string
  toPort: string
  /** `data` = the value flows through (solid); `mask` = the source only
   *  gates/filters the target — a review veto or confidence mask (dashed). */
  kind?: 'data' | 'mask'
}

export interface PipelineGraphData {
  id: string
  title: string
  /** One-line human description (the pipeline / module docstring). */
  subtitle?: string | null
  nodeCount: number
  /** Canonical pipeline source (the graph derives from this). */
  code: string
  nodes: Record<string, GraphNode>
  edges: GraphEdge[]
}

/** Per-node live status overlay (e.g. streamed from a remote runner). Merged
 *  onto the static graph so edges re-derive their flow — see PipelineGraph. */
export type StatusOverlay = Record<
  string,
  {
    status?: NodeStatus
    progress?: number | null
    duration?: number | null
    rows?: number | null
    /** Error message when status is `error` (shown in the node status panel). */
    error?: string | null
  }
>
