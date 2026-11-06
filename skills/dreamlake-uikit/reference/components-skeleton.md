# Skeleton

**Loading policy:** DreamLake uses one Braille dot spinner for all waits. The pulsing Skeleton shown below is legacy behavior awaiting migration; do not use it as the standard for new loading UI. Use the existing app Braille loader until the UIKit migration is complete. See the [style guide](style-guide.md) for labels, timing, accessibility, reduced motion, and prohibited alternatives.

A low-emphasis placeholder shown while content is loading. It's just a tinted,
pulsing `<div>` — you size and shape it with width/height and border-radius to
mirror the real content's layout.

## Text lines

Stack a few with varied widths to stand in for a paragraph or list row.

## Composed placeholder

Combine differently sized skeletons to mirror a card (avatar + two text lines).

## Props

| Prop        | Type     | Default | Description                                       |
| ----------- | -------- | ------- | ------------------------------------------------- |
| `className` | `string` | —       | Sizing/shape utilities (width, height, rounding). |

Any other native `<div>` attributes (`style`, `aria-*`, …) are forwarded. The
block is a subtle pulsing placeholder; override the background via `className`
if you need a different surface.
