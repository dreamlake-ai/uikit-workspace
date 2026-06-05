# Button

A button for primary actions and form submits. Wraps a native `<button>` (so it
accepts `type`, `onClick`, and the rest of the button attributes) and adds
variants, sizes and a loading state.

## Variants

`primary` is an inverted (ink-on-background) fill for the main action;
`secondary` is a bordered neutral button; `ghost` is transparent with a hover
tint (for low-emphasis / list actions); `danger` is for destructive actions.

## Sizes & states

Two sizes (`sm`, `md`). `loading` shows a spinner and disables the button;
`disabled` greys it out and blocks clicks.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | Visual style. |
| `size` | `'sm' \| 'md'` | `'md'` | Padding/text scale. |
| `loading` | `boolean` | `false` | Shows a spinner and disables the button. |
| `leftIcon` | `ReactNode` | — | Icon rendered before the label. |
| `disabled` | `boolean` | `false` | Disables interaction. |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Native button type. |
| `className` | `string` | — | Extra classes on the button. |

Any other native `<button>` attributes (`onClick`, `aria-*`, …) are forwarded.
