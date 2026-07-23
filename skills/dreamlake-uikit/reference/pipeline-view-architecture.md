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
| `PipelineGraph.tsx` | The canvas — pan/zoom, node drag, selection, the SVG edge + card render, and the auto-placed per-pair param tags. |
| `PipelineSource.tsx` | The paired read-only inspector — pipeline status + `.py`, or a selected node's status/i-o/schema/config/output, plus the run/review/continue/done button lifecycle. |

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
   dashed in the settled states so a gate always reads as a gate; the edges
   touching the selected node highlight in that **node's status colour** (not a
   fixed accent), while the rest fade back.
4. **Place param tags.** One tag per node-pair lists the params it transfers,
   anchored at its edge's midpoint. On the first render for a `graph.id` an
   adaptive pass drops each into open canvas (clear of nodes and other tags) and
   **freezes** the offset; later renders only re-measure the anchor, so node
   drags slide tags without re-running the search. A drag pins a tag manually.
5. **Draw nodes.** Absolutely-positioned cards, tinted by `status`, with a kind
   dot, the `inputs→outputs` meta, a status footer (pulsing when `running`), and
   a single input dot (left-centre) / output dot (right-centre) — every parameter
   shares the one input dot; its names live in the param tag.
6. **Overlay chrome** (`showControls`, default on). The edge-flow legend
   (top-right) and the keyboard-hint strip (bottom) — the legend rendered from
   the same `FLOW`. Pass `showControls={false}` to drop both for tiny embeds.

**Interaction:** background drag pans; ⌘/ctrl-wheel or pinch zooms about the
cursor; plain wheel / two-finger drag pans; a node drag writes to `posOverride`
(cleared when `graph.id` changes); a click without a drag toggles selection; a
tag drag pins that tag.

## What it deliberately leaves out

Faithful to the design prototype's *look*, but intentionally simpler than its
full canvas — these are conscious omissions, not bugs:

- **Param tags, not per-edge flow-label chips.** The prototype floats a draggable
  flow-state chip at each edge's midpoint; here a tag instead names the *params* a
  node-pair transfers (auto-placed, draggable to pin), and the flow vocabulary
  lives in the legend.
- **No draggable edge bends, no auto-fit, no vertical layout mode.** Positions
  come from the tracer's layout; the user pans/zooms/drags nodes.
- **No vim marks** (the `a`–`z` jump labels). Arrow/`hjkl` selection navigation
  *is* supported — see Current stage.
- **No edge inspector.** Clicking selects nodes, not edges — that's still a
  roadmap item below.

## Current stage

Shipping today:

- ✅ Pure, theme-aware renderer — dotted canvas, status-tinted cards, obstacle-
  routed edges, pan/zoom/drag, controlled or uncontrolled selection.
- ✅ **Keyboard navigation** (focus-scoped) — ↑/↓ (or k/j) step the selection in
  topological order, ←/→ (or h/l) hop to the upstream/downstream neighbour, Esc
  clears; the selected node pans into view.
- ✅ **Connector tags** (`data` / `mask`) and **connector states** (the six
  derived flows), catalogued in [Anatomy](reference/pipeline-view-anatomy.md).
- ✅ **Per-pair param tags** — one draggable, auto-placed tag per node-pair
  naming the params it transfers, tinted to its edge's flow.
- ✅ **Status-driven highlights** — selecting a node tints its card and touching
  edges in the node's own status colour, not a fixed accent.
- ✅ Live animation from a `statusById` overlay — structure stays static, status
  streams in, edges re-derive their flow.
- ✅ **`PipelineSource` inspector** — contextual `PIPELINE` / `NODE` / `CODE`
  tabs: pipeline status + `.py`, or a selected node's status pill, resolved i/o,
  schema, `config`, and a sampled **output** preview table.
- ✅ **Run lifecycle** — `onRun` / `running` / `reviewNodeId` / `done` and
  `onContinue` drive the rail's `▶ RUN` → `running…` → `⏸ REVIEW` / `✓ DONE`
  (and `▶ CONTINUE` on a waiting review node) buttons; execution stays the host's.

## Roadmap

### Richer output previews (next)

The node inspector's **output** panel renders a tabular
[`NodePreview`](reference/pipeline-view-pipeline-graph-json.md#the-output-artifact) (schema +
sampled rows) today. The design prototype's `PipeOutputTab` also previews other
modalities — an `image-grid` of frame thumbnails, a `text-grid` of label
previews — keyed off a per-modality `output` artifact; wiring those up is the
next step, so a running vision or labeling node shows its real samples inline.

### Further out

- **Edge inspector** — click an edge for its flow, throughput (`rows` /
  `duration`), and, on `error`, the failing stage's traceback.
- **Draggable edge bends** and label collision avoidance (fuller parity with the
  prototype canvas — param-tag placement already avoids nodes and other tags).
- **Auto-fit** on mount/resize and a **vertical** layout direction.
- **Job / fleet views** — the running-jobs and compute-fleet panels that pair
  with the graph in Studio.

---

**Back to:** [Pipeline Graph](reference/pipeline-view-pipeline-graph.md) ·
[Anatomy](reference/pipeline-view-anatomy.md) ·
[Pipeline Graph JSON](reference/pipeline-view-pipeline-graph-json.md).
