# Workflow Canvas

`WorkflowCanvas` draws a **Workflow v2 spec** as an interactive flow-chart. Like
[`PipelineGraph`](reference/pipeline-view-pipeline-graph.md) it is purely presentational —
you hand it one typed JSON object and it renders the graph, with **no data
fetching of its own**. `WorkflowThumb` is the paired static mini-render.

A **workflow** is a spine of ordered **stages** whose member nodes do the work —
deterministic **compute** (UDFs), judgment-making **agents** (`uda`), statistical
**samplers**, and **control flow** — joined by typed data edges. Unlike a
pipeline (a *derived* view of traced Python), a workflow spec is **authored**:
pushed from the CLI, versioned, and rendered here for review.

For the full node vocabulary — every family's fields, the artifact type system,
run states — see [Node Types](reference/workflow-view-node-types.md).

## Shared DNA with PipelineGraph

This is the same canvas language as `PipelineGraph`, reused rather than
re-implemented: the beige dot-grid plane, the `156 × 72` status-tinted cards, the
orthogonal rounded edges that detour around cards, the connector-tag pills, and
pan / zoom / drag. `WorkflowCanvas` imports PipelineGraph's edge router
(`buildEdgePath`) and its edge-flow vocabulary (`FLOW`), and the cards share the
same chrome. What's new is the **data model** (a typed, authored spec instead of
a traced pipeline) and one structural idea: **stages are hubs.**

## Stages are hubs

The spine is the ordered list of stages; every other node is a **member** that
fans out from its stage. Work visibly converges into a stage node and fans back
out to the next stage's members:

- an **intra-stage** data edge draws directly member → member;
- a **cross-stage** edge routes *through* the downstream stage node — drawn as
  two segments (source member → stage, then stage → target member);
- a **source member** (no inbound edge) gets a dispatch fan from its own stage;
- a plain stage → stage spine edge appears only where no member path already
  connects two consecutive stages.

Stages **group and order** the work; they are **not barriers** — cross-stage
edges are legal (GitLab's stageless-pipeline lesson).

## A workflow, mid-run

The demo below is the `driving-scene-annotation` workflow — model pre-labels
routed by a confidence **switch** to auto-accept, sampled review, or expert
review; the three label streams merge on a `collect` port; an **approval** gate
protects the release. It's caught mid-run: ingest and triage are `done`, both
review agents are `progress` with **fanned-out sub-agents** stacked beneath them,
and the release gate is still `queued`.

**Drag** to pan, **scroll** (or two-finger drag) to pan, **⌘/ctrl-scroll or
pinch** to zoom, **click** a node to select it. Switch the layout with the
**orientation toggle** (top-right) — `vertical` (root at top) or `horizontal`
(root at left).

## The run overlay

The spec is static; runtime state arrives as two lightweight overlays, keyed by
spec node id — exactly the `PipelineGraph` pattern:

- **`statusByNodeId`** — each node's run state (`idle` · `queued` · `progress` ·
  `done` · `error` · `skipped`). It tints the card and drives every edge's
  derived flow, so animating a run is just feeding new states in.
- **`agentsByNodeId`** — the live **agent instances** fanned out under a `uda`
  node during a run; each renders as a compact card stacked below its agent, in
  both orientations.

Here is a smaller two-stage blueprint with the same overlay (legend off; the
orientation switcher stays). Toggle the layout to see one spec re-laid-out:

## Real-world shapes

The same four families compose the standard data-production programs.
`WorkflowThumb` renders each as a faithful, non-interactive shrink of the canvas
(same layout engine, no ports or pills) — the card-sized twin for galleries and
list rows:

## Props

### `WorkflowCanvas`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `spec` | `WorkflowSpec` | — | The typed workflow spec (stages + nodes + edges). |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Initial (or host-persisted) layout direction. |
| `onOrientationChange` | `(o: WfOrientation) => void` | — | Fired by the built-in orientation switcher. |
| `statusByNodeId` | `Record<string, WorkflowNodeRunStateValue>` | — | Live per-node run states; absent = plain blueprint. |
| `agentsByNodeId` | `Record<string, AgentInstance[]>` | — | Agent instances fanned under their `uda` node. |
| `selectedId` | `string \| null` | — | Controlled selection. Omit for uncontrolled. |
| `onSelect` | `(id: string \| null) => void` | — | Selection change (also fires on background click). |
| `showControls` | `boolean` | `true` | Show the canvas controls — the legend and the orientation switcher. |
| `showLegend` | `boolean` | `true` | The node-kind / edge-state legend specifically — turn off for small embeds while keeping the switcher. |
| `className` | `string` | — | Extra classes on the canvas. |

### `WorkflowThumb`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `spec` | `WorkflowSpec` | — | The workflow spec to shrink to card size. |
| `orientation` | `'vertical' \| 'horizontal'` | `'horizontal'` | Layout direction of the mini-render. |

Both are theme-aware (uikit tone tokens) and load `@dreamlake/uikit/styles.css`
for their colours. `WorkflowSpec`, `WfOrientation`, `AgentInstance`, and
`WorkflowNodeRunStateValue` are exported from `@dreamlake/uikit`.

---

**Next:** [Node Types](reference/workflow-view-node-types.md) is the field-by-field
vocabulary — stage, compute, uda, sampler, control, the artifact type lattice,
and the run states · [Pipeline Graph](reference/pipeline-view-pipeline-graph.md) is the
sibling component this canvas shares its visual language with.
