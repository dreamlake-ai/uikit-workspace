# Avatar

A square avatar. Pass `image` to show a photo; without it (or if the image fails
to load) the component derives initials from `name` (first letter of the first
two whitespace-separated words, uppercased — `"Ge Yang"` → `"GY"`,
`"MIT CSAIL"` → `"MC"`) so callers pass the display name rather than precomputing.
Color, font, and surface follow the design tokens and flip with the theme.

## Sizes

Five sizes showing how the font scales with the avatar (`fontSize = round(size × 0.36)`).

## Custom radius

Pass `radius` (px) to override the default `3` (square). Use `size / 2` for a
perfect circle.

## Image

Pass `image` to render a photo (cropped to fill via `object-cover`, clipped to
the avatar's radius). If the URL is missing or fails to load, the avatar falls
back to initials — so `name` is always required as the fallback.

## Composed form

For drop-in parity with the legacy Radix-based avatar, you can also compose
`` and `` as children. The image is hidden until it
loads; if it's missing or errors, the fallback (usually initials) shows instead.
This form defaults to a circle — pass `radius` to change it.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | — | Display name (simple form). Initials are derived automatically; used as the fallback when `image` is absent or fails to load. Optional when using the composed form. |
| `image` | `string` | — | Avatar image URL. Rendered with `object-cover`; falls back to initials on missing/error. |
| `size` | `number` | `32` | Avatar size in px. Font size scales as `round(size × 0.36)`. |
| `radius` | `number` | `3` | Border radius in px. Use a larger value (or `size / 2`) for a circle. |
| `className` | `string` | — | Extra classes on the root `<span>`. |
