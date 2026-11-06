# Skeleton

A static tinted placeholder that reserves space while content is unavailable.
It never pulses or shimmers. Pair it with the shared [Spinner](reference/components-spinner.md)
and an accessible status label when indicating pending work. See [Loading & progress](reference/style-guide-loading.md).

## Text lines

Stack a few with varied widths to stand in for a paragraph or list row.

## Composed placeholder

Combine differently sized skeletons to mirror a card (avatar + two text lines).

## Props

| Prop        | Type     | Default | Description                                       |
| ----------- | -------- | ------- | ------------------------------------------------- |
| `className` | `string` | —       | Sizing/shape utilities (width, height, rounding). |

Any other native `<div>` attributes (`style`, `aria-*`, …) are forwarded. The
block is a static placeholder; override the background via `className`
if you need a different surface.
