# Avatar

A square avatar. Pass `image` to show a photo; without it (or if the image fails
to load) the component shows initials taken from `name` (`"Ge Yang"` → `"GY"`,
`"MIT CSAIL"` → `"MC"`), so callers pass the display name rather than
precomputing initials. Color, font, and surface follow the design tokens and
flip with the theme.

## Sizes

Five sizes showing how the initials scale up and down with the avatar.

## Custom radius

Pass `radius` (px) to override the simple form's default `3` (rounded square).
Use `size / 2` for a perfect circle.

## Image

Pass `image` to render a photo, cropped to fill the avatar and clipped to its
radius. If the URL is missing or fails to load, the avatar falls back to
initials — so `name` is always required as the fallback.

## Composed form

You can also compose `` and `` as children. The
image is hidden until it loads; if it's missing or errors, the fallback
(usually initials) shows instead. This form defaults to a circle — pass
`radius` to change it.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | — | Display name (simple form). Initials are derived automatically; used as the fallback when `image` is absent or fails to load. Optional when using the composed form. |
| `image` | `string` | — | Avatar image URL. Cropped to fill the avatar; falls back to initials on missing/error. |
| `size` | `number` | `32` / `24` | Avatar size in px. Defaults to `32` for the simple form and `24` for the composed form. The initials scale with the size. |
| `radius` | `number` | `3` / circle | Border radius in px. The simple form defaults to `3` (rounded square); the composed form defaults to a circle. Use `size / 2` for a circle in the simple form. |
| `className` | `string` | — | Extra classes on the root `<span>`. |

### Composed sub-components

| Component | Props | Description |
| --- | --- | --- |
| `AvatarImage` | native `<img>` attributes (`src`, `alt`, …) | Image inside a composed ``. Hidden until it loads; on error the sibling `` takes over. |
| `AvatarFallback` | native `<span>` attributes | Fallback content (usually initials) shown until the image loads. |
