# Switch

A binary on/off toggle for settings. It's a `role="switch"` button (keyboard
and screen-reader friendly) that fills with the accent token when on. Use it for
instant-apply preferences; for form submits prefer a checkbox.

## States

Off, on, and disabled in both positions.

## Controlled

Drive it from state with `checked` + `onCheckedChange`. Omit `checked` and pass
`defaultChecked` to let the switch manage its own state.

## Naming the two states — `SlideToggle`

`Switch` answers *"is this on"*, and its two positions are the same shape. When
the two states have **names** — `o` / `vim`, source / preview — reach for
`SlideToggle` instead: a pill whose knob slides between a left and a right face,
each face carrying its own width.

That is why the knob **expands** as it travels. The control is as wide as the
two words it chooses between, and the knob is exactly as wide as the word it is
sitting on.

State reads through colour, not position alone: the face under the knob is
inked, the other muted. Hovering tints the whole pill — accent while on, orange
while off — and knocks the exposed face to white, so the control says what it
will become before it is clicked. Pass `onColor` / `offColor` to change those
tints.

`VimToggle` is the `o` / `vim` preset from the app's editor toolbar.

### `SlideToggle`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `on` | `boolean` | — | Which face is chosen: `false` = left, `true` = right. |
| `onToggle` | `() => void` | — | Called on click. |
| `left` / `right` | `ToggleFace` | — | `{ node, w, fontSize? }`. `w` sizes the face **and** the knob when it lands there. |
| `label` | `string` | — | Accessible name — the faces are usually too terse to serve as one. |
| `onColor` / `offColor` | `string` | accent / `#f97316` | Hover tint per state. |
| `slideMs` / `bgMs` | `number` | `240` | Knob travel and background fade. |

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `checked` | `boolean` | — | Controlled state. Omit for uncontrolled. |
| `defaultChecked` | `boolean` | `false` | Initial state when uncontrolled. |
| `onCheckedChange` | `(checked: boolean) => void` | — | Fired with the next state on toggle. |
| `disabled` | `boolean` | `false` | Disables interaction. |
| `className` | `string` | — | Extra classes on the track. |
| `thumbClassName` | `string` | — | Extra classes on the moving thumb. |

Any other native `<button>` attributes (`aria-*`, `id`, …) are forwarded.
