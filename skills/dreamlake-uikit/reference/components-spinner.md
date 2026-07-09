# Spinner

An indeterminate loading indicator: two out-of-phase expanding circles drawn as
an inline SVG. It renders inline (use it inside buttons, list rows, or empty
states) and defaults to the muted token so it sits quietly until content loads.

## Sizes

`size` sets the diameter in px (default `24`). The SVG scales crisply at any
size.

## Color

The stroke is `currentColor`. By default it tints to `--muted`; pass any
`text-*` utility (or set `color` on a parent) to recolor it — useful for tinting
a spinner to a tone while an action runs.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `number \| string` | `24` | Diameter in px. |
| `className` | `string` | — | Extra classes (e.g. a `text-*` color). |

Any other native `<svg>` attributes (`style`, `aria-*`, …) are forwarded.
