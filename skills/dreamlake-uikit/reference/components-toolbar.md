# Toolbar

A horizontal bar for grouped actions. Wrap related buttons in `ToolbarGroup` and
divide groups with `ToolbarSeparator`. The `floating` variant adds a soft shadow
for overlay toolbars.

## Floating studio toolbar

A faithful rebuild of the Vuer studio's floating top toolbar: a segmented
`ToggleButtons` for the select modes, a standalone `Toggle` for the
world/local coordinate mode, a ghost button for the scene editor, a separator,
then the Add action. `variant="floating"` adds the overlay shadow for a bar
that floats over the 3D canvas.

## Props

### `Toolbar`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'default' \| 'floating'` | `'default'` | `floating` adds a shadow. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Only `lg` enlarges the padding and corner radius; `sm` and `md` are identical. |
| `className` | `string` | — | Extra classes. |

`ToolbarGroup` and `ToolbarSeparator` accept `className` and native `<div>`
attributes.
