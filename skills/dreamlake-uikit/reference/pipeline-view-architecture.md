# Architecture & Roadmap

How the component is put together, why it's shaped that way, and where it's
going. If you only render graphs you don't need this — start at
[Pipeline Graph](reference/pipeline-view-pipeline-graph.md).

## Design principles

Four rules the whole component follows:

1. **Purely presentational.** `PipelineGraph` fetches nothing and traces
   nothing. Input is JSON (from the `dl_trace` service) plus an optional live
   status overlay; output is pixels. This keeps it trivially embeddable and
   testable.
2. **The graph is a derived view of code.** Structure comes from the tracer, not
   from the UI. The component never mutates the graph — node drags are a local
   position overlay, not edits to the data.
3. **Runtime look is derived from one source of truth.** An edge stores no
   colour/width/animation; its *flow* is a pure function of its endpoints'
   `status`. Push new statuses and every edge restyles itself — no edge diffing.
4. **Selection is controlled or uncontrolled.** Pass `selectedNodeId` +
   `onSelectNode` to own it (and sync the graph with `PipelineSource`), or omit
   both and the component tracks selection internally.

## The file split

The component is five small modules, each with one job:

| Module | Responsibility |
| --- | --- |
| `types.ts` | The data model — `PipelineGraphData`, `GraphNode`, `GraphEdge`, `NodeStatus`, `StatusOverlay`. Mirrors the tracer's JSON 1:1. |
| `flow.ts` | The **visual language** — `kindColor`, `STATUS`, `FLOW`, and the derivations `edgeFlow(src, dst)` + `portPos` / `portAlong`. Colours are uikit tone tokens, so light/dark is automatic. |
| `edge-path.ts` | Pure geometry — `buildEdgePath` routes a rounded orthogonal (Manhattan) edge that **detours around** intervening node boxes, falling back to a curve when endpoints are near-colinear. |
| `PipelineGraph.tsx` | The canvas — pan/zoom, node drag, selection, and the SVG edge + card render. |
| `PipelineSource.tsx` | The paired read-only source inspector (pipeline `.py` ↔ selected node source). |

`flow.ts` is the shared vocabulary: `edgeFlow` and `FLOW` are **exported** from
`@dreamlake/uikit`, so a legend, a docs board, or a custom overlay can reuse the
exact same rules the canvas does — no reimplementation, no drift.

## The render pipeline

One render of `PipelineGraph`, end to end:

1. **Merge overlays.** Each node is combined with its `statusById` entry (live
   `status` / `progress` / `duration`) and any local drag `posOverride`. The
   static graph is never mutated.
2. **Size the world.** Node positions set the scroll bounds; one
   `translate()+scale()` transform on the content layer drives the nodes and the
   SVG edge layer together (so they never drift apart under pan/zoom).
3. **Draw edges.** For each edge: `portPos` resolves the `out` and `in` port
   coordinates → `buildEdgePath` routes around obstacles → `edgeFlow(src, dst)`
   picks a flow → `FLOW[flow]` gives colour/width/dash/anim. A `mask` edge stays
   dashed in the settled states so a gate always reads as a gate; a selected
   edge switches to the single accent colour.
4. **Draw nodes.** Absolutely-positioned cards, tinted by `status`, with a kind
   dot, the `inputs→outputs` meta, a status footer (pulsing when `running`), and
   port dots on the edges.
5. **Legend.** Bottom-right, the flow states — rendered from the same `FLOW`.

**Interaction:** background drag pans; ⌘/ctrl-wheel or pinch zooms about the
cursor; plain wheel / two-finger drag pans; a node drag writes to `posOverride`
(cleared when `graph.id` changes); a click without a drag toggles selection.

## What it deliberately leaves out

Faithful to the design prototype's *look*, but intentionally simpler than its
full canvas — these are conscious omissions, not bugs:

- **No per-edge label chips.** The prototype floats a draggable flow-label chip
  at each edge's midpoint; here the legend carries that vocabulary instead.
- **No draggable edge bends, no auto-fit, no vertical layout mode.** Positions
  come from the tracer's layout; the user pans/zooms/drags nodes.
- **No vim marks / keyboard-heavy navigation.**
- **No node inspector yet** — `PipelineSource` shows source only. That's the
  headline roadmap item below.

## Current stage

Shipping today:

- ✅ Pure, theme-aware renderer — dotted canvas, status-tinted cards, obstacle-
  routed edges, pan/zoom/drag, controlled or uncontrolled selection.
- ✅ **Connector tags** (`data` / `mask`) and **connector states** (the six
  derived flows), catalogued in [Anatomy](reference/pipeline-view-anatomy.md).
- ✅ Live animation from a `statusById` overlay — structure stays static, status
  streams in, edges re-derive their flow.
- ✅ `PipelineSource` — the pipeline `.py` ↔ selected-node source inspector.

## Roadmap

### Selected-node inspector — status + output (next)

Today `PipelineSource` shows **source** only. The next step is to grow it (or a
sibling panel) into the design prototype's three-tab inspector for the selected
node:

- **Details** — a status row (status label + colour, live `progress`,
  `duration`, `rows`, and a **Run** action), plus the node's resolved
  inputs/outputs and its `config`.
- **Code** — what `PipelineSource` shows now.
- **Output** — render the node's [`output` artifact](reference/pipeline-view-pipeline-graph-json.md#the-output-artifact):
  a `table` preview (schema + rows), an `image-grid` of frame thumbnails, a
  `text-grid` of label previews, or an empty/stale/pending placeholder.

This makes the graph a live console: click a running node and watch its rows and
preview fill in. The `output` union is already specified in the
[JSON reference](reference/pipeline-view-pipeline-graph-json.md#the-output-artifact) so the
data contract is settled ahead of the UI.

### Further out

- **Edge inspector** — click an edge for its flow, throughput (`rows` /
  `duration`), and, on `error`, the failing stage's traceback.
- **Edge midpoint labels**, draggable bends, and label collision avoidance
  (parity with the prototype canvas).
- **Auto-fit** on mount/resize and a **vertical** layout direction.
- **Job / fleet views** — the running-jobs and compute-fleet panels that pair
  with the graph in Studio.

---

**Back to:** [Pipeline Graph](reference/pipeline-view-pipeline-graph.md) ·
[Anatomy](reference/pipeline-view-anatomy.md) ·
[Pipeline Graph JSON](reference/pipeline-view-pipeline-graph-json.md).
