# Semantic palette (cross-page)

All dreamlake pages that color-code domain concepts — pipeline kinds, run statuses, transform types, event types, branch identities, release kinds, diff ops — pull from one shared 6-color set. **`dreamlake-pipelines`** is the canonical source: every other page's domain coloring (`dreamlake-timetravel`, `ml-dash`, `notebook`, etc.) maps its concepts onto these six. New pages MUST NOT introduce a 7th hue; new domain concepts MUST be slotted into an existing semantic bucket.

| Hex | Semantic bucket | Examples (pipelines) | Examples (timetravel) | Examples (other) |
|---|---|---|---|---|
| `#23aaff` | **active / running / accent** — also `--accent` in tokens.css | `running` status · `transform` kind · `running` edge flow | `running` status · `classify` transform · `upload` event · `main` branch · `rc` release · column header for "versions" | `--accent` everywhere; selection rails; primary CTAs |
| `#1f8f4a` | **ok / source / success** | `ok` status · `source` kind · `ok` edge | `ok` status · `normalize` transform · `webhook` event · `ingest` event · `q2-curated` branch · `draft` release · `add` diff op · column header for "events" | "passed" / "complete" labels |
| `#7c5bd9` | **model / merge / human-authored** | `model` kind | `merge` transform · `pr` event · `coffee-task` branch · `public` release · `tag` diff op | code/notebook authorship signals |
| `#c0922e` | **stale / filter / scheduled** | `filter` kind · `stale` status · `stalled` edge | `filter` transform · `schedule` (cron) event · `failures-set` branch · "modify" diff op | "warning" / "needs review" |
| `#c8513b` | **error / sink / quarantine** | `sink` kind · `error` status · `error` edge | `error` status · `patch` transform · `apr-incident` branch · `remove` diff op | destructive actions, failed states |
| `#9c907a` | **idle / queued / muted** | `idle` edge | `manual` event · `tag-only` / `fork` / `noop` transforms · `queued` status | placeholder rows, neutral chips |

## The rule

When you add semantic coloring to any page:

1. **Open `pipelines-canvas.jsx`** — `PIPE_KIND_COLOR`, `PIPE_STATUS`, and `PIPE_FLOW_LABEL` are the canonical mappings. The legend (`PipeLegend`) is what users learn the palette from.
2. **Map your concept onto an existing bucket by *function*, not vibe.** "Ingest" is a *successful inflow* → green (`#1f8f4a`), not blue. "RC release" is *active candidate* → blue (`#23aaff`), not amber. "Draft release" is *pre-success* → green. The semantic bucket trumps any aesthetic preference.
3. **Never invent a near-miss hex.** `#3a7bd5`, `#c08a2a`, `#5a8fbf` were all bugs in earlier timetravel work — they tried to be "a slightly different blue/amber" and just looked broken next to pipelines. If two concepts on the same page need to be distinguishable but both belong in the same bucket, distinguish them with **glyph + label**, not a third color.
4. **Tokens.css is for surface chrome, not domain coloring.** `--accent` happens to equal `#23aaff` because the active/running color is also the UI accent — but that's the only token that overlaps with the semantic palette. Don't add `--ok`, `--error`, etc. to tokens.css; keep the six hex values inline at their use sites so it's obvious from `grep` exactly which buckets a page touches.

## Why these six and not more

- **Six is the ceiling for a legend.** The pipelines flow legend is already 5 rows tall (`running / queued / stalled / error / ok`); adding a 7th hue would push it past the threshold where users can hold the mapping in working memory.
- **Each hue does double duty.** Every color in the table above carries a status meaning *and* a kind meaning *and* a domain-concept meaning. That collision is the point — if "ingest" and "ok" both mean "data flowed in successfully", they should look the same. Splitting them into two greens just makes the user learn two greens.
- **Outliers get caught at review.** A `grep '#[0-9a-f]\{6\}'` across `*.jsx` should return only these six values plus surface tokens. Anything else is either a typo, a leftover from prototyping, or a missed alignment.

---

# Row color schemes

Two row components, one document. Both are tight mono-text list rows in the dreamlake UI; they share most of their reasoning (zebra over borders, theme-tinted hover, ink/muted/bg tokens), but they differ on what state they need to express. `ExperimentRowCompact` carries a real selected/active state because it drives the right pane; `PipeJobRow` is a pure list item with no persistent selection (yet). Each section below documents one component.

---

# Surface tokens (cross-page)

All five dreamlake pages (`ml-dash`, `dreamlake`, `dreamlake-pipelines`, `dreamlake-profile`, `notebook`) load a single shared stylesheet — **`tokens.css`** — as their sole source of truth for surface, ink, accent, and shadow values. Each page's `<head>` does:

```html
<link rel="stylesheet" href="tokens.css" />
```

…and nothing else color-related at the document level. The Tweaks panels still set `--bg-light` / `--bg-dark` etc. on `:root` at runtime; those inline styles win over the stylesheet, so per-page overrides keep working.

The pages share a 3-surface vertical stack: page bg → panel bg → left navbar. In light mode each surface steps half a tone darker than the one below; in dark mode `--bg` and `--panel-bg` collapse to the same near-black, and only the left navbar lifts.

| Token | Light | Dark | Used on |
|---|---|---|---|
| `--bg` (page / canvas behind everything) | `#fffefa` warm off-white | `#2e2e35` near-black, slight cool cast | `<body>`, canvas planes (the pipelines dot grid paints on this). |
| `--panel-bg` (floating panels, inspector cards, popovers, mid-column list bg, dropdowns) | `#fcfbf7` warm off-white, half a step darker than `--bg` | `#2e2e35` — same as `--bg` | `.pipelines-rail`, `.pipelines-side-rail`, all popover and dropdown surfaces. In dark mode it intentionally flattens to `--bg` so panels lift via the 1px `--faint` border + shadow, not a brighter fill. |
| `--rail-bg` (left navbar / workspace rail) | `#fcfbf7` — equal to `--panel-bg-light` | `#2b2b31` — one step **deeper** than `--bg`/`--panel-bg` | `.col-left`, `.pipelines-nav`, the left aside in `DLLeftPanel` / `ExpLeftPanel` / `PipeNavRail`, sticky section labels inside those rails. |

## Reasoning

- **Two-tier in light, two-tier in dark, but the tiers invert.** Light mode separates `--bg` from `--panel-bg` (subtle cream-on-cream) and lets the left navbar share the panel tier via `--rail-bg-light = --panel-bg-light` — the cream gradient already gives the rail enough visual identity. Dark mode keeps `--bg` and `--panel-bg` collapsed onto one near-black plane (so panels rely on borders, not fills) and **drops** `--rail-bg` to `#2b2b31` so the navbar reads as a deeper recess behind the body, not a lifted slab on top of it. Either way you get exactly two surface levels — the rail just sits below the body in dark instead of beside it.
- **Why not lift the panel in dark mode?** Tested: lifting `--panel-bg` above `--bg` made the inspector rail and mid-column list look like pale-grey rectangles floating on near-black — the lightness step at that scale reads as "this surface is dirty" rather than "this surface is elevated". Keeping the panel at `--bg` and elevating with a hairline border + shadow looks crisper.
- **Why drop the navbar instead of lifting it?** Lifting the rail (an earlier iteration used `#2e2e35` for `--rail-bg-dark` and `#2b2b31` for `--bg-dark`) made the navbar read as a slightly-paler slab perched on the body — same washed-out problem as a lifted panel. Dropping the rail to `#2b2b31` while the body sits at `#2e2e35` reverses the figure/ground: the rail recedes, the working surface advances. At navbar scale (full height, narrow, abutting the canvas) the eye still sees a clean vertical edge between two solid tones, but now the deeper tone clearly belongs to the chrome and the lifted tone belongs to the content.
- **Why a dedicated `--rail-bg` token instead of inline overrides?** Earlier versions used `var(--panel-bg)` everywhere and patched `html[data-theme="dark"] .col-left { background: #2b2b31; }` per page. That left five copies of the same magic hex, drifted out of sync (one page had `#2f2f35`), and made it impossible to tell from a glance whether a given surface was "panel" or "rail" semantics. Promoting it to a token names the intent and makes the cross-page contract enforceable.

---

# `ExperimentRowCompact` — color scheme

Single-line ledger row in the middle column of `ExperimentView`. Three children: experiment title (mono, 12px, `--ink`), a flex spacer, and a status-tinted timestamp tag (mono, 9px). All visual state lives on the row's `background`; text colors don't change between rest, hover, and selected. Background is computed inline as a precedence chain — `active > hover > zebra > base` — so only one rule wins per render.

## Tokens the row reads

| Token | Light | Dark |
|---|---|---|
| `--bg` (panel bg behind row) | theme cream/off-white | theme near-black (`#2e2e35`) |
| `--ink` (title text) | dark ink | light ink |
| `--muted` (timestamp when status is neutral / done) | mid-grey | mid-grey |
| `--radius` (corner radius) | shared rounding token | same |
| `selectedBg` (warm-cream / lifted) | `#f5f3ee` literal — borrowed from `NoteRow` for cross-list visual parity | `rgba(255,255,255,.06)` |
| Zebra tint (odd rows) | `color-mix(in srgb, oklch(55% .05 250) 4%, var(--bg))` — cool blue-grey wash | `color-mix(in srgb, oklch(70% .04 250) 6%, var(--bg))` — same hue, lighter & a touch stronger so it reads on near-black |
| Status colors (timestamp) | `error` `#c8513b` · `running` `#1f8f4a` · `done`/none `--muted` | same hex; the muted variant tracks theme |

## Per-state styling

| State | Background | Title (mono 12 / 450) | Timestamp tag (mono 9 / 500, `.04em` tracking) |
|---|---|---|---|
| **Rest, even row** (`index % 2 === 0`) | `var(--bg)` — panel shows through | `--ink` @ 100% | by status: `error` `#c8513b` @ .9 · `running` `#1f8f4a` @ .9 · `done`/null `--muted` @ .55 · other `--muted` @ .9 |
| **Rest, odd row** (`index % 2 === 1`) | cool blue-grey zebra: light `oklch(55% .05 250) 4%`, dark `oklch(70% .04 250) 6%` | unchanged | unchanged |
| **Hover** | neutral ink wash: `color-mix(in srgb, var(--ink) 5%, var(--bg))` — overrides zebra; reads as a generic "you're pointed at this" lift, hue-free so it can't be confused with selected | unchanged | unchanged |
| **Active / selected** (`active` prop) | warm-cream highlight: light `#f5f3ee`, dark `rgba(255,255,255,.06)` — borrowed from the notebook's `NoteRow` so the experiment list and notes list feel like one component family | unchanged | unchanged |
| **Focus-visible** *(not implemented)* | inherits underlying state | inherits | inherits |

## Reasoning behind the choices

- **Three layered backgrounds, one text color.** The row uses background alone to carry rest/hover/selected because the title and timestamp already have their own jobs (identity + status). Tinting the title on selected would over-signal and fight the status color on the right.
- **Three different hues for three different jobs.** Zebra is *cool blue-grey* (structural — "this is row 2, 4, 6"). Hover is *neutral ink-mix* (transient — "your cursor is here"). Selected is *warm cream* (committed — "this is the row driving the right pane"). Each picks a different axis (hue / neutrality / warmth) so they never get confused, even when a hovered odd row swaps from cool zebra → neutral hover.
- **`color-mix` for zebra, literal hex for selected.** Zebra has to track `--bg` across themes, so it's a mix; selected is a fixed cross-list token (matches `NoteRow`) and is intentionally hard-coded so both lists drift together if either ever changes.
- **Status colors read at low weight.** 9px / 500 / `.04em` tracked + `.55–.9` opacity keeps `running` green and `error` red from competing with the title — they're a glance-state, not a label.
- **Inline JS chain over CSS classes.** Lets `active`, `hov`, and `index` parity all participate in one expression with explicit precedence; CSS `:hover` + `:nth-child` would need `!important` gymnastics to keep `active` on top.

## Gaps worth flagging

1. ~~**`isDark` is read once at render.**~~ *Resolved — coloring moved to pure CSS (`html[data-theme="dark"] .exp-row-compact …`), so theme toggles repaint instantly with no re-render needed.*
2. **No focus ring.** Keyboard users navigating the list have no visible target — only pointer hover and the persistent `active` flag are styled.
3. **Selected hex is duplicated, not tokenized.** Selected backgrounds live as literal hex values in two components (`ExperimentRowCompact` and `NoteRow`). A `--row-selected-bg` variable would prevent drift.
4. **Hover doesn't compose with selected.** When `active`, hover is a no-op — fine for most lists, but if rows become reorderable or multi-selectable the row needs a "selected + hovered" visual.

## Multiselection

When more than one row is selected, **consecutive selected rows merge into a single visual block** — no per-row gap, no per-row inner ring; the run reads as one continuous selection. Non-consecutive runs each form their own block. Implementation hooks: an `aria-selected="true"` (or `data-selected`) attribute on each selected row, plus a `:has()` / sibling-combinator rule that suppresses the top rounding/border of a row whose previous sibling is also selected, and the bottom rounding/border of a row whose next sibling is also selected. Border-radius collapses to 0 on the joined edges; the outer `--radius` is preserved on the run's first and last rows.

Two options for the highlight itself:

| | **Option A — Blue ring, 2px inset** | **Option B — Accent fill** |
|---|---|---|
| Mechanism | `box-shadow: inset 0 0 0 2px var(--accent)` on each row in the run, with the inset edges of the joined sides cleared so the ring traces the *outside* of the merged block, not the seams between rows | `background: var(--accent-soft)` on each row in the run; row text stays `--ink` / `--muted`; first row gains a 2px left rail in `--accent` to anchor the block |
| Background at rest | unchanged — odd rows keep their zebra, even rows their base; the ring sits on top | replaced — `--accent-soft` (`rgba(35,170,255,.09)`) wins over zebra and over the warm-cream `active` state |
| Single-row selection | ring traces all four sides at full `--radius` | accent fill at full `--radius`, left rail full height |
| Run of 3 rows | top row: ring on top/left/right, no bottom ring, bottom corners squared · middle row: ring on left/right only · bottom row: ring on bottom/left/right, top corners squared | every row in the run gets `--accent-soft`; only the run's first row gets the left rail; vertical gaps between rows in the run collapse to 0 so the fill is continuous |
| Hover within a selected run | ring stays; row bg lifts to the normal hover value (warm amber / cool blue) *inside* the ring | bg deepens to `color-mix(in srgb, var(--accent) 18%, var(--bg))`; ring rail stays |
| Single `active` (the "driving" row, e.g. opens the right pane) | inside a multi-selection, the active row gets a 1px inner ring in `--ink @ 30%` *inside* the blue ring to distinguish "selected" from "active-and-selected" | active row's left rail thickens from 2px → 3px; everything else in the run holds |
| Reads as | "this list supports range selection — these specific rows are queued" | "this list has a working set — these rows are the working set" |
| When to pick it | Lists where multiselection is **transient** (about to bulk-delete, bulk-tag, bulk-move). The ring is loud and short-lived. | Lists where multiselection is **persistent** state that drives downstream UI (compare panel, side-by-side charts, batch editor). The fill commits visually. |
| Failure mode | Ring on a 1px-zebra row in light mode can look heavy at 2px — drop to 1.5px if it dominates the column | `--accent-soft` at 9% can disappear over the warm-cream `active` cream in light; bump to 12% specifically when a previously-active row joins a multi-selection |

**Recommendation:** use Option A (blue ring) when this list's multiselection is for one-shot bulk actions, Option B (accent fill) when the selection is itself the answer (e.g. "these are the experiments I'm comparing"). The two are not interchangeable — pick based on whether the selection is a verb or a noun.

---

# `PipeJobRow` — color scheme

A row is a 4-column grid (`id · label/host/shard · duration · status`) drawn entirely in `var(--ink)` / `var(--muted)`, with no border or fill at rest. Visual structure comes from a zebra-striped background (`.pipe-jobrow:nth-child(odd)` mixes `--ink` 4% into the panel) plus an inline-handler hover that swaps in a theme-tinted background and 1px inset ring. There is **no selected/active state in the source today** — the row is a pure list item; clicking it would open the job, not toggle a persistent selection. The "active/selected" column below documents what *should* exist and is not yet wired.

## Tokens the row reads

| Token | Light | Dark |
|---|---|---|
| `--bg` (page bg behind canvas) | `#fffefa` warm off-white | `#2e2e35` near-black body plane, slight cool cast |
| `--panel-bg` (rail / panel surface this row sits on) | `#fcfbf7` warm off-white, half a step darker than `--bg` so panels read as inset surfaces against the canvas | `#2e2e35` — same as `--bg`; in dark mode the panel flattens onto the body so the canvas, panel, and chrome share one near-black plane and the lift comes from the 1px `--faint` border + drop shadow alone. The left navbar (`--rail-bg`, `#2b2b31`) is the only surface deeper than this. |
| `--ink` (primary text) | `#1a1a1a` | `#ececec` |
| `--muted` (secondary text — id, host, duration) | `#6b6b6b` | `#8a8a8a` |
| `--jobrow-hover-bg` | `color-mix(--canvas-bg 78%, oklch(62% .11 60))` — warm amber lift off the cream canvas | `color-mix(--bg 72%, oklch(62% .07 230))` — cool blue lift off near-black |
| `--jobrow-hover-ring` | `--ink @ 10%` | `--ink @ 14%` |

## Per-state styling

| State | Background | Ring / border | Text — primary (label) | Text — secondary (id, host, shard, duration) | Status chip |
|---|---|---|---|---|---|
| **Rest, odd row** | `--ink @ 4%` over panel — barely-there zebra stripe | none | `--ink` @ 100% | `--muted` (id @ .7 op, separator dots @ .55 op, duration @ .8 op) | running `--ink` @ .9 + pulse · queued `--muted` @ .8 · done `--muted` @ .65 · failed `oklch(58% .14 27)` @ .95 · cancelled `--muted` @ .55 |
| **Rest, even row** | transparent (panel shows through) | none | same as odd | same as odd | same as odd |
| **Hover** (light) | warm amber tint — cream mixed 22% toward `oklch(62% .11 60)` | inset `0 0 0 1px` of `--ink @ 10%` | `--ink` (unchanged) | `--muted` (unchanged — opacity steps preserved) | unchanged |
| **Hover** (dark) | cool blue lift — `--bg` mixed 28% toward `oklch(62% .07 230)` | inset `0 0 0 1px` of `--ink @ 14%` | `--ink` (unchanged) | `--muted` (unchanged) | unchanged |
| **Active / selected** *(not implemented — proposal)* | light: `--ink @ 8%`, no warm tint (reads as "pinned, not pointed at") · dark: `--ink @ 12%` | inset `0 0 0 1px` of `--ink @ 18%` + 2px left rail in `--accent` | `--ink` @ 100%, weight bumped to 600 on the label span only | `--muted` lifted to `--ink @ 70%` so the row pops as a unit | running glyph swaps to `--accent`; everything else holds |
| **Focus-visible** *(not implemented — proposal)* | inherits underlying state | `0 0 0 2px` outer ring of `--accent @ 50%`, offset 1px | inherits | inherits | inherits |

## Reasoning behind the choices that **are** there

- **Zebra over borders.** In a tight mono-text list the eye scans by row, not by cell. A 4% ink wash on odd rows gives that scan-rhythm without any 1px border noise — borders would compete with the column dividers in the canvas behind.
- **Theme-specific hover hue.** Light mode lifts *warmer* (amber into cream) because the canvas is already warm — a neutral grey would read as "dirty paper". Dark mode lifts *cooler* (blue into near-black) because adding warmth on a near-black surface looks like a stain; cool reads as "elevated surface".
- **Inset ring instead of outset shadow.** Outset shadow on a row inside a scroll list bleeds onto the next row and feels grabby. A 1px inset ring stays inside the row's footprint and matches the zebra grid.
- **Inline handlers, not `:hover`.** Lets the row use CSS variables (`--jobrow-hover-bg`) that are themed at `:root` per `data-theme`, while still letting the zebra `:nth-child` rule reclaim the background on `mouseleave` (handler clears the inline style rather than overriding it).
- **Panel-bg flattens to bg in dark mode.** In light mode `--panel-bg` (`#fcfbf7`) sits half a step darker than `--bg` (`#fffefa`) so the rail visibly inset-shadows off the cream canvas. In dark mode both collapse to `#2b2b31` — adding a *lighter* panel on near-black reads as a pale grey rectangle (washed-out, dingy); keeping them equal lets the rail's 1px `--faint` border + drop shadow do all the elevation work, and the zebra's 4% ink wash still produces a visible odd-row stripe because it mixes against the same near-black, not a pre-lifted grey.

## Gaps worth flagging

1. **No selected state.** If the rail is meant to drive a detail panel, the row needs a persistent selected style distinct from hover (proposal above).
2. **No focus ring.** Keyboard nav lands on the row but has no visible target — the inset ring is hover-only and pointer-driven.
3. **Hover ring contrast in dark mode.** `--ink @ 14%` over a blue-tinted near-black is right at the visibility threshold; bumping to 18% would help without making it feel boxy.
