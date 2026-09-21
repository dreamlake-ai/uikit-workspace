# Button

A button for primary actions and form submits. Wraps a native `<button>` (so it
accepts `type`, `onClick`, and the rest of the button attributes) and adds
variants, sizes and a loading state.

## Variants

`primary` fills with the **accent**, in mono, on the badge radius — the app's
dialog footer, to the pixel. It replaces an inverted ink fill, which made the
submit button the heaviest ink on a form whose fields are bare text. Hover
darkens the accent rather than fading it; a primary action should not look like
it is switching off under the pointer.

`ghost` is the action you take by **not** acting — the cancel beside that
primary. A bare muted mono label: no fill, no border, no hover chrome, just
opacity. Two buttons in a footer make the reader compare two boxes; one button
and one label say which is the way forward.

`secondary` is a bordered neutral button; `action` is the mono chrome pill for
toolbars and detail headers; `danger` is `primary`'s shape in the palette red;
`link` renders as inline underlined text with no padding.

## Sizes & states

Three sizes (`sm`, `md`, `lg`). `loading` shows a spinner and disables the
button; `disabled` greys it out and blocks clicks.

## Chrome actions

`action` is the borderless mono pill the app wears in toolbars and detail
headers — `+ publish`, `+ import`, a back arrow. It differs from `ghost` in the
three ways that row asks for: **mono type**, because it sits in a line of
metadata rather than in a dialog footer; **tighter side padding**, because three
of them share a header with a title and a breadcrumb; and the **6px badge
radius** small chips keep, since it is a chip-shaped control rather than a
standalone form control on `var(--radius)`.

`tone` colors it without reaching for `style`: `muted` for secondary chrome (a
back arrow), `danger` for a destructive action — ink at rest, palette red under
the pointer, because a row of permanently-red labels reads as an error state
rather than an available action. `value` marks it active in the accent and
switches its hover wash to `--accent-soft` with it; `hoverBg` overrides that
wash for anything else. `href` makes it a real link, so cmd-click, middle-click
and the status-bar URL all still work.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'action' \| 'danger' \| 'link'` | `'primary'` | Visual style. `'destructive'` is also accepted as an alias for `'danger'`. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | Padding/text scale. `action` runs one step denser at every size. |
| `tone` | `'default' \| 'muted' \| 'danger'` | `'default'` | Text color for the transparent variants (`ghost`, `action`, `link`). `muted` starts at muted ink and raises to full ink on hover — for a button inside an already-muted strip. `danger` keeps its ink until the pointer arrives, then turns red. |
| `loading` | `boolean` | `false` | Shows a spinner and disables the button. |
| `leftIcon` | `ReactNode` | — | Icon rendered before the label. |
| `icon` | `boolean` | `false` | Square icon-button padding (for a button whose content is a single icon). |
| `value` | `boolean` | `false` | Active/selected state — renders the label and icon in the accent color, and takes `--accent-soft` as its hover wash. |
| `hoverBg` | `string` | `var(--ink)` at 5% | Hover surface for the transparent variants. Pass `var(--accent-soft)` under an accent-colored label. |
| `href` | `string` | — | Renders an `<a>` with identical styling. `target` and `rel` ride along; a disabled link drops its `href` and reports `aria-disabled`. |
| `asChild` | `boolean` | `false` | Render the single child element with the button styling instead of a `<button>` (merging classes and forwarding props). |
| `disabled` | `boolean` | `false` | Disables interaction. |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Native button type. |
| `className` | `string` | — | Extra classes on the button. |

Any other native `<button>` attributes (`onClick`, `aria-*`, …) are forwarded.

### `buttonVariants`

`buttonVariants(options)` returns the composed class string for a button
without rendering one. Accepts `variant`, `size`, `tone`, `icon`, `value`, and
`className`, and is useful for styling a non-button element (like a link) to
match the button set.
