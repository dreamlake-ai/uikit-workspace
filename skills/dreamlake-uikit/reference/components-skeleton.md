# Skeleton

A low-emphasis placeholder shown while content is loading. It's just a tinted,
pulsing `<div>` — you size and shape it with width/height and border-radius to
mirror the real content's layout.

## Text lines

Stack a few with varied widths to stand in for a paragraph or list row.

## Composed placeholder

Combine differently sized skeletons to mirror a card (avatar + two text lines).

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `className` | `string` | — | Sizing/shape utilities (width, height, rounding). |

Any other native `<div>` attributes (`style`, `aria-*`, …) are forwarded. The
block is a subtle pulsing placeholder; override the background via `className`
if you need a different surface.
