# Toolbar

A horizontal bar for grouped actions. Wrap related buttons in `ToolbarGroup` and
divide groups with `ToolbarSeparator`. The `floating` variant adds a soft shadow
for overlay toolbars.

## Props

### `Toolbar`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'default' \| 'floating'` | `'default'` | `floating` adds a shadow. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Padding/radius scale. |
| `className` | `string` | — | Extra classes. |

`ToolbarGroup` and `ToolbarSeparator` accept `className` and native `<div>`
attributes.
