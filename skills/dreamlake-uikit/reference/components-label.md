# Label

A text label for form controls. Render a native `<label htmlFor="…">` (or wrap
the control) so clicks focus the input. `size` picks the type scale; `hint` also
mutes the color for helper text.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `'xs' \| 'sm' \| 'lg' \| 'hint'` | `'sm'` | Type scale (`hint` is muted). |
| `className` | `string` | — | Extra classes. |

All native `<label>` attributes (`htmlFor`, …) are forwarded.
