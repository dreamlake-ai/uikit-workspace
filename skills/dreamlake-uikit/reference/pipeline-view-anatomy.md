# Anatomy

The data model, shown **next to what it draws** — never in isolation. Each block
below is one thing (a node, a connector tag, a connector state) rendered live,
with its **TypeScript** (the render call) and its **JSON** (the tracer's output)
one tab away. Flip the `Preview` / `Source` / `Data` tabs to line the three up.

For the prose reference of the same shapes, see
[Pipeline Graph JSON](reference/pipeline-view-pipeline-graph-json.md).

## The node card

A node is one stage — a `@ls.udf` — as a `156 × 72` card. Everything on it comes
straight from the node JSON; nothing is styled by hand.

| On the card | JSON field | Notes |
| --- | --- | --- |
| Kind dot (top-left square) | `kind` | Tints by category — `source` green, `transform` blue, `model`/`review` purple, `filter` amber, `merge` grey, `sink` red. |
| Title | `title` | The UDF name. `id` is the stable key (may differ on fan-out: `semantic_match_2`). |
| Meta line `transform · 1→1` | `kind` · `inputs.length`→`outputs.length` | The `→` is port **counts**, not columns. |
| Left dot | `inputs` | A **single** input dot at the left-centre — every parameter shares it. The per-parameter names surface in the floating [param tag](reference/pipeline-view-pipeline-graph.md#ports--param-tags), not beside the dot. Absent when `inputs` is empty (a `source`). |
| Right dot | `outputs` | A UDF returns **one** table → a single output dot at the right-centre. A sink has none (`[]`). |
| Status dot + label (footer) | `status` | `idle` here; drives tint + the pulse when `running`. |
| _(not drawn on the card)_ | `columns` | The result **schema** — `boxes`, `classes`, `confidence`. Surfaced in the source inspector, not as ports. |

**Ports vs columns** is the one thing to internalise: `inputs` is the parameter
list (all sharing one input dot), `outputs` is a single port (the whole result
table), and the return column names live in `columns` — a schema, not more ports.
The card's `N→1` meta still counts the parameters even though they converge on
one dot.

## Connector tags

An edge carries exactly one structural tag, `kind`, decided by the tracer. It's
the only style an edge stores; everything else about an edge is
[derived from status](#connector-states).

### `data` — the value flows through (solid)

The default. The source's result table is consumed by the target.

### `mask` — the source gates the target (dashed)

A gate, not data flow. The source (a review veto or a confidence/consensus mask)
only decides **which rows** of the target survive. In Python this is
`labels[consensus]` — a boolean selector — so it reads as a gate without adding a
filter node. Rendered dashed and slightly fainter in the settled states.

| Tag | Meaning | Look | Produced by |
| --- | --- | --- | --- |
| `data` | source result flows into target | solid | passing a UDF result as an argument |
| `mask` | source only filters/gates target | dashed, fainter | a boolean mask used as a selector (`labels[mask]`) |

## Connector states

An edge stores **no** colour, width, or animation. Its *flow* — how it looks
right now — is **derived** at render time from the `status` of its two endpoint
nodes, via one shared function:

```ts
edgeFlow(src: NodeStatus, dst: NodeStatus):
  'running' | 'queued' | 'stalled' | 'error' | 'ok' | 'idle'
```

Six states, one derived value. Below, each swatch is the real
`FLOW[state]` styling, next to the status pair that produces it (this board is
built straight from the exported `edgeFlow` + `FLOW`, so it can't drift from the
component):

| Flow | Derived when | Look |
| --- | --- | --- |
| `running` | src running, or (src ok & dst running) | blue, marching dashes |
| `queued` | src ok, dst still idle | grey, slow drift |
| `stalled` | src `stale` | amber, gentle breath |
| `error` | either endpoint errored | red, tight dashes |
| `ok` | src ok & dst ok | green, solid |
| `idle` | anything else | faint, solid |

Note the spelling: a node's status is **`stale`**, but the edge flow it derives
is **`stalled`**. Because flow is derived, you never store or diff it — keep node
`status` live (via `statusById`) and every edge restyles itself. That single
source of truth is what makes the [live runner](reference/pipeline-view-pipeline-graph.md#live-status--a-runnable-pipeline)
cheap.

---

**Next:** [Pipeline Graph JSON](reference/pipeline-view-pipeline-graph-json.md) is the full
data-model reference · [Architecture & Roadmap](reference/pipeline-view-architecture.md)
covers the internals and what's planned.
