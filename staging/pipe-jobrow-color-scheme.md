# `PipeJobRow` — color scheme

A row is a 4-column grid (`id · label/host/shard · duration · status`) drawn entirely in `var(--ink)` / `var(--muted)`, with no border or fill at rest. Visual structure comes from a zebra-striped background (`.pipe-jobrow:nth-child(odd)` mixes `--ink` 4% into the panel) plus an inline-handler hover that swaps in a theme-tinted background and 1px inset ring. There is **no selected/active state in the source today** — the row is a pure list item; clicking it would open the job, not toggle a persistent selection. The "active/selected" column below documents what *should* exist and is not yet wired.

## Tokens the row reads

| Token | Light | Dark |
|---|---|---|
| `--bg` (panel bg behind row) | `#fffefa` warm off-white | `#2e2e35` near-black body plane, slight cool cast (the rail / left navbar sits deeper at `#2b2b31`) |
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

## Gaps worth flagging

1. **No selected state.** If the rail is meant to drive a detail panel, the row needs a persistent selected style distinct from hover (proposal above).
2. **No focus ring.** Keyboard nav lands on the row but has no visible target — the inset ring is hover-only and pointer-driven.
3. **Hover ring contrast in dark mode.** `--ink @ 14%` over a blue-tinted near-black is right at the visibility threshold; bumping to 18% would help without making it feel boxy.
