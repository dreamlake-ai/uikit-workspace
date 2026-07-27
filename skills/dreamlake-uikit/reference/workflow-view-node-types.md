# Node Types

A workflow is a spine of ordered stages; typed member nodes fan out from their
stage and connect through typed data edges. This page defines every node family
and the data types edges can carry — rendered with the **real** card components
from [`WorkflowCanvas`](reference/workflow-view-workflow-canvas.md).

The vocabulary is grounded in established systems: the artifact type system
follows Kubeflow Pipelines v2 and Flyte, control flow follows BPMN 2.0 and the
workflow control-flow-patterns literature, and samplers use statistical naming
with Spark / SQL parameter conventions.

## Stage

A **stage** groups the work of one phase and renders as a node on the spine.
Stages are **hubs, not barriers**: work converges into a stage node and fans out
to its members, but data edges may cross stage boundaries freely. Array order is
the spine.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | unique |
| `title` | string | display name |
| `detail` | string? | one-line description |

## Compute (UDF)

A **compute** node runs a user-defined function on Lakeshore. The `provider`
block follows the Lakeshore provider schema: a **launcher class** (`SSH` ·
`SLURM` · `EC2` · `GCE` · `Kube`) or a named server-stored provider, plus
per-machine RunConfig fields.

| Field | Type | Notes |
| --- | --- | --- |
| `compute.udf` | string | UDF reference, e.g. `pipelines.bimanual_filter` |
| `compute.params` | object? | static UDF arguments — small inline values are node **parameters**, never port data (the KFP / Snakemake split) |
| `compute.provider` | ProviderRef? | `provider` (named) XOR `launcher` + `kwargs`; per-machine: `instance_type`, `image`, `partition`, `resources`, `runner` |
| `compute.dispatch` | `direct` \| `daemon` | how the launch happens |
| `execution` | ExecutionPolicy? | `retry { max_attempts (1 = no retry), retry_on, backoff }`, per-attempt `timeout`, `cache { enabled, version }` |

## UDA (User-Defined Agent)

A **uda** node runs a remote agent. Field names follow agent-framework
conventions (OpenAI Agents SDK, Claude Agent SDK, A2A):

| Field | Type | Notes |
| --- | --- | --- |
| `uda.instructions` | string | the system prompt (fixed persona — distinct from any per-run input) |
| `uda.description` | string? | *when to delegate* to this agent (routing metadata) |
| `uda.model` | string? | model id |
| `uda.tools` | string[]? | tool grants by name — tools are **not** permission strings |
| `uda.permissions` | string[] | data/resource grants, IAM-style `domain.resource.verb` |
| `uda.max_turns` | number? | turn budget |
| `uda.output_schema` | object? | JSON Schema for the structured final output |
| `uda.provider` XOR `uda.queue` | ProviderRef / string | where the agent runs |
| `execution` | ExecutionPolicy? | retry + timeout only — **`cache` is forbidden on agents**: agent runs are non-deterministic; caching one replays a stale answer |

## Sampler

Sampler strategies use statistically correct names. The result of `bernoulli` is
**probabilistic in count** — that is what SQL `TABLESAMPLE BERNOULLI` and Spark
`df.sample(fraction)` actually do.

| Strategy | Parameters | Semantics |
| --- | --- | --- |
| `bernoulli` | `fraction` ∈ (0, 1], `min_size?`, `seed?` | each item kept independently with probability `fraction`. `min_size` is a DreamLake extension: if `fraction·N < min_size`, degrade to an exact-size random sample |
| `random_n` | `size`, `with_replacement? = false`, `seed?` | exact-size simple random sample |
| `stratified` | `stratify_by`, `fraction?` or `fractions?`, `min_size?`, `seed?` | per-stratum sampling, Spark `sampleBy` shape |
| `first_n` | `size` | head / LIMIT — deterministic and order-dependent; **not** a statistical sample |

Samplers are **type-preserving** pass-throughs: the output port carries the input
port's type (a sample of a clip collection is a clip collection). Identical input
+ identical `seed` ⇒ identical sample.

## Control flow

| Type | Out ports | Semantics |
| --- | --- | --- |
| `condition` | `true: T`, `false: T` | binary exclusive choice (`expression`) |
| `switch` | one per case + **required `default`**, all `T` | n-way exclusive choice (WCP-4); first matching case wins; `default` keeps routing total |
| `loop` | `out: T` | `mode: 'while'` — `until` + `max_iterations` **required** (no unbounded loops); `mode: 'foreach'` — collection-driven (`over`, `max_concurrency`) |
| `approval` | `out: T` | human gate with Argo-suspend semantics: pauses until a decision; timeout without decision ⇒ `error`, **never auto-approve** |

Control nodes are **type-preserving pass-throughs**: every derived out port
carries the input port's type `T`. Plain fan-out / fan-in stays **implicit in
edges** — there are no AND-gateway nodes. An input port accepts **one** inbound
edge by default; fan-in is either a `collect: true` port (ordered collection of
same-type producers) or the XOR-merge exception (branches of the same
condition / switch may share a target port, since at most one fires).

## Edge data types

Every port carries a type from a closed **artifact lattice**. `artifact` is the
root and doubles as "any": any subtype is accepted where `artifact` is expected.

| Type | Meaning |
| --- | --- |
| `artifact` | root — compatible with everything |
| `file` / `directory` | opaque blob, single vs multipart; format is metadata, not more types |
| `table` | schema-carrying tabular data (a *shape*) |
| `dataset` | a versioned data *product* — shards + manifest |
| `model` | trained model / checkpoint |
| `metrics` | evaluation metrics |
| `samples` | DreamLake domain type — an addressable collection of media samples / episodes |

Small inline values (strings, numbers, JSON config) are **node configuration**,
not edge data — a type never exists on both sides of the parameter / artifact
boundary.

## Run states

During a run each node carries a state — `idle` · `queued` · `progress` · `done`
· `error` · `skipped` — tinting the same card (via `statusByNodeId`). Agent
instances fan out under their `uda` node (via `agentsByNodeId`):

## On the canvas

Put together, stages are the hubs the work flows through — members fan out from
their stage node and converge into the next. Two orientations, one card style
(toggle top-right):

---

**Back to:** [Workflow Canvas](reference/workflow-view-workflow-canvas.md) is the component
reference (props, the run overlay, the thumbnail) · [Pipeline
Graph](reference/pipeline-view-pipeline-graph.md) is the sibling it shares its canvas
language with.
