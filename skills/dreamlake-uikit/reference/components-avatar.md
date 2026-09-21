# Avatar

A square avatar. Pass `image` to show a photo; without it (or if the image fails
to load) the component shows initials taken from `name`, so callers pass the
display name rather than precomputing initials. Color, font, and surface follow
the design tokens and flip with the theme.

Initials are two words' first letters (`"Ge Yang"` → `"GY"`, `"MIT CSAIL"` →
`"MC"`) — or, for a **single-word** name, its first two letters
(`"dreamlake"` → `"DR"`). A lone letter in a 32px square reads as a placeholder
rather than as a person, and single-word names are the common case here: a
handle, an org, a team. The rule is exported as `getInitials` if you need it
outside an avatar.

The initials are set in the mono face. At this size they are a label, not
display type — the same choice every other small monogram in the app makes.
`AvatarHero` below is the exception, and stays on UI type where it genuinely is
display type.

## Sizes

Five sizes showing how the initials scale up and down with the avatar.

## Custom radius

Pass `radius` (px) to override the default `4`. The three below are the ones the
app draws: `4` for a row, `6` for the presence stack, `12` for the profile hero.

It never draws a circle — `size / 2` gets you one if you need it, but nothing in
the product does.

## Image

Pass `image` to render a photo, cropped to fill the avatar and clipped to its
radius. If the URL is missing or fails to load, the avatar falls back to
initials — so `name` is always required as the fallback.

## Composed form

You can also compose `<AvatarImage>` and `<AvatarFallback>` as children. The
image is hidden until it loads; if it's missing or errors, the fallback
(usually initials) shows instead. It takes the same rounded square as the simple
form — pass `radius` (or `size / 2` for a circle) to change it.

## Hero

`AvatarHero` is the full-width 1:1 square a profile rail puts at its top. It
fills its container, so the container caps it — the app's rail passes
`className="max-w-[248px]"` so the square doesn't blow up to the full column
width below the `lg` breakpoint.

The initials size off the box, not off a literal: 35.5% of the width, which is
the app's 88px in its 248px rail — the ratio the design was drawn at — and holds
at any width. Drop it in a 64px slot and it still reads as an avatar.

`editable` adds the hover scrim, the pencil and the click target — hover any of
the three below. It is off by default, so someone viewing another person's
profile isn't offered an edit they have no permission for. Under a 160px
container the overlay drops its "change avatar" label and the pencil carries the
affordance alone; the label is a fixed 12px and wrapped out of the square before
that. (`ProfileLayout` builds its own rail on this component
and wires `onEdit` to its avatar-picker dialog.)

### `AvatarHero`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | — | Display name. Initials stand in when there is no image. |
| `image` | `string \| null` | — | Image URL or data URL, cropped to fill. |
| `editable` | `boolean` | `false` | Show the hover scrim + pencil and make the square clickable. |
| `onEdit` | `() => void` | — | Called on click when `editable`. |
| `className` | `string` | — | Extra classes on the root — this is where the width cap goes. |

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | — | Display name (simple form). Initials are derived automatically; used as the fallback when `image` is absent or fails to load. Optional when using the composed form. |
| `image` | `string` | — | Avatar image URL. Cropped to fill the avatar; falls back to initials on missing/error. |
| `size` | `number` | `32` / `24` | Avatar size in px. Defaults to `32` for the simple form and `24` for the composed form. The initials scale with the size. |
| `radius` | `number` | `4` | Border radius in px — the same rounded square in both forms. Use `size / 2` for a circle. |
| `className` | `string` | — | Extra classes on the root `<span>`. |

### Composed sub-components

| Component | Props | Description |
| --- | --- | --- |
| `AvatarImage` | native `<img>` attributes (`src`, `alt`, …) | Image inside a composed `<Avatar>`. Hidden until it loads; on error the sibling `<AvatarFallback>` takes over. |
| `AvatarFallback` | native `<span>` attributes | Fallback content (usually initials) shown until the image loads. |
