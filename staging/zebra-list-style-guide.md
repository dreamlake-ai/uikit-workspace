# Zebra list — style guide

Source of truth: `ml-dash.html` `.exp-row-compact` + `.exp-selection-run`, with `dreamlake-pipelines.html` `.pipe-jobrow` as the second reference (and `design.md` for context). This guide is what to copy into any other zebra list in dreamlake (`PipeJobRow`, `NoteRow`, `DLEntityRow`, future tables) so they all read as one component family.

A "zebra list" here means: a tight, mono-friendly, single-line list with no per-row borders, no per-row shadows, no per-row chrome — all visual state lives on the row's `background`. Rest rhythm is carried by alternating fills; interaction is carried by hue.

---

## 1. The four-band model

Every row is in exactly one of four bands at any moment. Precedence is strict — only one rule wins per render:

```
   selected   >   hover   >   zebra (odd)   >   base (even)
```

| Band | Job | Hue axis |
|---|---|---|
| **Base** (even row) | "this row is here." Panel bg shows through. | none — equals `--bg` |
| **Zebra** (odd row) | scan rhythm. Structural; tells the eye where row N+1 ends. | **cool blue-grey** — neutral but biased away from warm so it can't be confused with hover or selected |
| **Hover** | "your cursor is here." Transient; per-pointer. | **depends on whether the row is selectable** — see §3 |
| **Selected** | "this row is driving something downstream." Persistent. | depends on cardinality, see §5–6 |

Three different hues for three different jobs. Zebra is structural, hover is transient, selected is committed — each picks a different axis so they never collide, even when a hovered odd row has to swap from cool zebra → hover.

---

## 2. Row gap — 2px between lines

**Every zebra list uses `gap: 2px` on its row container.** Rows are not flush; there is a 2px breathing slot between every line. The panel `--bg` shows through the gap, which is what makes the alternating zebra fills visibly tile rather than smear together — and it is what lets a hovered or selected row read as a discrete tile lifting out of the list, without needing a border to define its edges.

```jsx
<div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
  {rows.map((r, i) => <Row key={r.id} index={i} {...r} />)}
</div>
```

The 2px figure is not arbitrary. Smaller (0–1px) and the list reads as a continuous painted column — hover smears into its neighbours and the eye loses row boundaries during scroll. Larger (4px+) and the list breaks into a card-grid, which kills the dense-ledger affordance the zebra pattern is built for. 2px is the inflection point.

`SelectionRunBox` (§6) **must** match this gap on its inner wrapper, so wrapping consecutive rows into a run doesn't shift the rhythm by a pixel.

---

## 3. Hover — pick by selectability

Hover hue is a function of **whether the row is selectable** and the theme.

A row is "selectable" if clicking/activating it commits some persistent state — opens a detail pane, becomes the comparison subject, drives a right column, joins a multi-select set. A row that just navigates away (a link to another page) or does nothing on click is **not** selectable in this sense.

| Selectable? | Light-mode hover | Dark-mode hover |
|---|---|---|
| **Yes** (clicking commits state) | `#d9e6f7` — soft tint of the active blue. **No border, no inset shadow.** | `#3d4856` — cool blue lift |
| **No** (decorative or pure-nav list) | `#d9e6f7` *or* `#f3e6cc` (warm amber, no border) — pick by surrounding tone. | `#3d4856` — cool blue lift |

**Why blue for selectable.** The row's eventual selected state is also blue (§6 F), so hover is the lighter "preview" of the same hue. Pointer hover and click-to-commit read as one continuous action, not two unrelated colour events. The lighter blue says "this is what selected would look like, but lighter, because you haven't clicked yet."

**Why amber stays an option for non-selectable lists.** Lists like `NoteRow` (where hover is just feedback that the cursor is over a thing, not a precommit) can use the warmer cream-paper hue without the selection implication. On a warm canvas (`--bg: #fffefa`) it reads as paper-warming-under-the-cursor. For lists where the surrounding panel is already cool/blue-tinted, prefer the blue tint even when non-selectable so hover doesn't introduce a foreign hue.

**Critical: no border on hover.** Earlier versions of this scheme added `box-shadow: inset 0 0 0 1px rgba(0,0,0,.08)` (light) and `inset 0 0 0 1px rgba(255,255,255,.14)` (dark) to give the hovered row a faint outline. **Drop it.** With the 2px gap (§2) the hovered row is already visually detached from its neighbours by clear panel bg above and below; the inset border just adds a hairline of visual noise that competes with the column structure inside the row. Hover is **bg-only**.

```css
/* Selectable list — light + dark */
.row:hover                          { background: #d9e6f7; }
html[data-theme="dark"] .row:hover  { background: #3d4856; }

/* Non-selectable list, warm option */
.row:hover                          { background: #f3e6cc; }
html[data-theme="dark"] .row:hover  { background: #3d4856; }
```

Transitions:

```css
transition: background 120ms ease, border-radius 120ms ease;
```

120ms is the floor — fast enough to feel pointer-locked, slow enough that hover-jitter doesn't strobe. Don't transition `box-shadow` unless you're using it for the focus-visible outline (§10).

---

## 4. Backgrounds — light & dark, premixed

Backgrounds are **solid hex values, premixed off the panel bg**. Don't use `rgba()` or `color-mix()` at runtime for these — the row sits over a sticky search bar and any transparency lets the bar bleed through. Mix the colour mentally against `--bg`, save the resulting hex, ship it.

| Band | Light (`--bg = #fffefa`) | Dark (`--bg = #2b2b31`) |
|---|---|---|
| Base (even) | `#fffefa` — equals `--bg` | `#2b2b31` — equals `--bg` |
| Zebra (odd) | `#f3f2ee` — `--ink` ≈ 4% premixed | `#36363c` — `--ink` ≈ 4% premixed |
| Hover, selectable | `#d9e6f7` — soft active-blue tint | `#3d4856` — cool blue lift |
| Hover, non-selectable (warm) | `#f3e6cc` — warm amber | `#3d4856` — cool blue lift |
| Selected (single, default) | `#2174d9` — system blue, white text | `#2f86e6` — slightly lighter blue |

**Border-radius on selected.** Selected rows step up from the resting row radius (typically 7px) to **10px**. The bigger radius makes the selected row read as a distinct rounded "tile" lifting out of the list's flow, rather than as just-a-row-but-tinted. Apply it to single-selected rows AND to the outer corners of a multi-row selection-run wrapper. Inner row corners inside a run stay at the resting radius — only the run's outer envelope rounds to 10px (handled by the wrapper's own `border-radius: 10px` + the rows clipping their corners against it).

```css
.row[data-selected="true"]            { border-radius: 10px; }
.selection-run                         { border-radius: 10px; }
.selection-run::after /* ring */       { border-radius: 10px; }
```

---

## 5. Zebra parity — data-driven, not `:nth-child`

**Use a `data-zebra="odd"` attribute set from the row's index in the source array, not `:nth-child(odd)`.**

```jsx
<Row data-zebra={i % 2 ? 'odd' : 'even'} />
```

```css
.row { background: #fffefa; }
.row[data-zebra="odd"] { background: #f3f2ee; }
```

Why: when consecutive selected rows get wrapped in a `SelectionRunBox` (§6), `:nth-child` parity shifts for every sibling outside the wrapper — rows would visibly re-stripe the moment selection happens. Indexing off the source array keeps parity stable through every wrap/unwrap, filter, or virtualise.

---

## 6. Single-row selection

Single selection has six explored variants (gated on `html[data-single-style="…"]`). They aren't equivalent — pick by what the selection *means* in this list:

| Variant | When to use | Light | Dark |
|---|---|---|---|
| **A — warm amber** | Lists where rows are *notes* / soft items; matches `NoteRow` for cross-list parity | `#ebe2cd` | `#4a4438` |
| **B — ink-step** | Default for cool-zebra lists. Stays in the zebra family, just steps deeper. No warm/cool clash. | `#e6e8ec` | `#45464d` |
| **C — neutral grey step** | The most boring, hardest-to-argue-with option. "Darker = selected, that's all." | `#ececec` | `#45454a` |
| **D — accent rail** | When selection means "this row drives the right pane." Subtle bg + `inset 2px 0 0 0 var(--accent)`. Reads as a verb, not a noun. | `#f5f5f5` + accent rail | `#34343a` + accent rail |
| **E — accent-soft fill** | When selection is the *answer* (e.g. "this is the comparison set"). Uses `--accent-soft`. | `var(--accent-soft)` | same |
| **F — bright blue** | When the list emulates Finder / native OS list selection. White text, full saturation. **Current default in ml-dash.** | `#2174d9` | `#2f86e6` |

Hover-while-selected: each variant defines its own deeper-on-hover step (see CSS in `ml-dash.html`). Don't fall back to the generic light-blue hover when selected — the saturated selected bg already swallows it, the result reads as "row briefly went grey for no reason."

For **F (bright blue)** specifically: text is forced to `#fff !important; opacity: 1 !important` on every span inside the row. Status colors (red error, green running) are swallowed by the blue — that's intentional; in a fully-saturated selection the row's identity is "selected", not its status.

**Hover→selected continuity (variant F).** Because variant F selected is `#2174d9` and the recommended selectable-row hover is `#d9e6f7` (a tint of the same blue), pointer hover smoothly previews the eventual selected state. This is the pairing this guide recommends as default for any new selectable zebra list.

---

## 7. Multi-row selection — the `SelectionRunBox` pattern

When two or more rows are selected, **consecutive selected rows merge into one visual block.** Non-consecutive selections each form their own block. A singleton selection renders as a bare row with `data-run-pos="single"` — no wrapper, no ring.

### Wrapping rules

- Build runs in your data layer, not in CSS. Walk the list, group adjacent selected indices, emit a `<div class="exp-selection-run">` only when run length ≥ 2.
- The wrapper **must** match the parent list's row gap (§2). Both the parent list and the wrapper use `gap: 2px` — without this match, rows inside a run visibly tighten the moment selection happens, which the user reads as a layout-shift bug.

```css
.exp-selection-run {
  display: flex;
  flex-direction: column;
  gap: 2px;                 /* must match parent list gap (§2) */
  border-radius: 10px;      /* matches selected outer radius (§4) */
  position: relative;
  z-index: 1;
  background: transparent;
  transition: box-shadow 120ms ease, background 120ms ease;
}
```

### Two highlight styles — pick by intent

| | **Ring (default)** | **Fill** |
|---|---|---|
| Mechanism | `::after` pseudo with `border: 2px solid var(--accent)` over the wrapper, `pointer-events: none`, `z-index: 2` so it sits above row backgrounds | wrapper gets `background: var(--accent-soft)` + `inset 2px 0 0 0 var(--accent)` left rail; rows inside become transparent |
| Reads as | "this list supports range selection — these specific rows are queued" | "this list has a working set — these are the working set" |
| Use when | multiselection is **transient** — bulk delete / tag / move | multiselection is **persistent** state driving downstream UI (compare panel, batch editor) |
| Hover within run | rows inside keep their normal hover; ring sits on top | row deepens to `color-mix(in srgb, var(--accent) 12%, transparent)` |

Critical implementation note for the ring: the ring **must** be a pseudo-element layered above the rows, not an `inset box-shadow` on the wrapper. Otherwise row backgrounds paint on top of the wrapper's shadow and the 2px stroke vanishes along the inside edges.

```css
html[data-selection-style="ring"] .exp-selection-run {
  isolation: isolate;        /* reserve a stacking context for ::after */
}
html[data-selection-style="ring"] .exp-selection-run::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid var(--accent);
  border-radius: 10px;
  pointer-events: none;
  z-index: 2;
}
```

---

## 8. Sticky-header occlusion

Zebra lists in dreamlake commonly sit under a sticky search bar. Every direct child of the list after the search bar must be opaque so it slides over the bar as the list scrolls:

```css
.pull-list > * + * {
  position: relative;
  z-index: 1;
}
/* Non-row children (separators, group headers) need an explicit bg.
   Rows already have their own. Selection-run wrappers stay transparent
   so the rows' zebra/hover reads through the ring. */
.pull-list > *:not(.row):not(.selection-run) + *:not(.row):not(.selection-run) {
  background: var(--bg);
}
```

This is why row backgrounds are premixed solid hex (§4) — `rgba()` would let the search bar bleed through during scroll.

---

## 9. Text colors do not change between bands

Title and metadata colors are set once and held across rest, hover, and selected (single-blue is the only exception, §6 F). Tinting the title on selected over-signals and competes with status colors (red error, green running) on the right side of the row.

| Element | Light | Dark | Notes |
|---|---|---|---|
| Title | `--ink` @ 100% | `--ink` @ 100% | mono 12px / 450 weight |
| Timestamp / metadata, neutral | `--muted` @ .55 | `--muted` @ .55 | mono 9px / 500 / `.04em` tracking |
| Timestamp, `running` status | `#1f8f4a` @ .9 | `#1f8f4a` @ .9 | green |
| Timestamp, `error` status | `#c8513b` @ .9 | `#c8513b` @ .9 | red |
| Timestamp, other status | `--muted` @ .9 | `--muted` @ .9 | |

Status colors stay low-weight (small size + tight tracking + sub-1.0 opacity) so they read as glance-state, not as labels competing with the title.

---

## 10. Borders, rings, shadows — what NOT to do

- **No `border` on rest rows.** Borders compete with column dividers in the canvas behind. Zebra carries the rhythm.
- **No outset `box-shadow` on rows in a scroll list.** It bleeds onto the next row and feels grabby. If you need a ring, use `inset 0 0 0 1px` on a wrapper or a wrapper `::after`.
- **No inset border on hover.** Earlier `PipeJobRow` had `inset 0 0 0 1px var(--ink @ 8%)` on hover. Removed — with the 2px row gap (§2) the hovered tile is already detached from its neighbours; the inset border just added noise. Hover is bg-only.
- **No emoji, no gradient, no drop-shadow on rows.** This is a ledger, not a card grid.

### Focus-visible

Keyboard users navigating with `↑/↓` need a visible target. Add to every row:

```css
.row:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;        /* inset, doesn't expand the row's bounds */
  border-radius: var(--radius);
}
```

Inset offset matters: outset would push neighboring rows out of position and break the gap rhythm.

---

## 11. Tokens to lift before forking

If you build a new zebra list, the values in §4 should not be retyped — they should be tokenized in `tokens.css`:

```css
:root {
  --row-base-bg:           #fffefa;
  --row-zebra-bg:          #f3f2ee;
  --row-hover-bg:          #d9e6f7;   /* selectable default */
  --row-hover-bg-warm:     #f3e6cc;   /* non-selectable warm option */
  --row-selected-bg:       #2174d9;
  --row-selected-fg:       #ffffff;
  --row-gap:               2px;
}
html[data-theme="dark"] {
  --row-base-bg:           #2b2b31;
  --row-zebra-bg:          #36363c;
  --row-hover-bg:          #3d4856;
  --row-hover-bg-warm:     #3d4856;
  --row-selected-bg:       #2f86e6;
}
```

Today these live as literal hex in two component files (`.exp-row-compact` and `.pipe-jobrow`, plus `NoteRow`'s selected bg `#f5f3ee`). Promoting them prevents drift and makes the contract enforceable across `ml-dash`, `dreamlake`, `dreamlake-pipelines`, `dreamlake-profile`, and `notebook`.

---

## 12. Summary checklist

Before shipping a new zebra list:

- [ ] **Row container has `gap: 2px`** between rows
- [ ] Backgrounds are **solid hex**, premixed off `--bg` (no `rgba`, no runtime `color-mix` for state bgs)
- [ ] Zebra parity uses `data-zebra` from source index, not `:nth-child`
- [ ] **Hover hue chosen by selectability** — blue (`#d9e6f7`) if clicking commits state; blue or warm amber if not
- [ ] **No inset border on hover** — bg only
- [ ] Hover overrides zebra; selected overrides hover (precedence chain explicit)
- [ ] Text colors do not change between bands (except bright-blue selected)
- [ ] Single-row selection variant chosen deliberately — `bright-blue` for OS-feel (pairs with the soft-blue hover for hover→selected continuity), `ink-step` for cool-zebra families, `rail` for "drives the right pane"
- [ ] Multi-row runs wrapped only when length ≥ 2; wrapper `gap: 2px` matches list gap
- [ ] Multi-row ring is a `::after` pseudo, not an inset box-shadow
- [ ] Sticky search bar occlusion handled (`z-index: 1` on row siblings, opaque bgs)
- [ ] `:focus-visible` added with inset outline
- [ ] Transitions are 120ms ease on bg + border-radius (not box-shadow unless used for focus)
