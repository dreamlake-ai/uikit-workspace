# Spinner

The shared Braille loading indicator: ten frames (`⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏`) at 80ms per
frame. It appears after 250ms and remains still under reduced motion. Use it for
all waits, including internal component loaders. See [Loading & progress](reference/style-guide-loading.md).

## Sizes

`size` sets the glyph font size (default `12`). A CSS font-size string is also accepted.

## Color

The glyph defaults to the accent token. Use a `text-*` class or `style.color` to inherit a control's color.

## Props

| Prop        | Type               | Default | Description                            |
| ----------- | ------------------ | ------- | -------------------------------------- |
| `size`      | `number \| string` | `12`    | Glyph font size.                        |
| `className` | `string`           | —       | Extra classes (e.g. a `text-*` color). |

Any other native `<span>` attributes (`style`, `aria-*`, …) are forwarded.
