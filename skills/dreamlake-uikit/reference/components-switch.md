# Switch

A binary on/off toggle for settings. It's a `role="switch"` button (keyboard
and screen-reader friendly) that fills with the accent token when on. Use it for
instant-apply preferences; for form submits prefer a checkbox.

## Shape

The switch is **square by default**: the track uses `--radius-uikit-toggle`
(4px) and the thumb uses `--radius-uikit-toggle-thumb` (2px). The thumb sits
2px inside the track, so the two corners are concentric. Use `shape="round"`,
or the `SwitchRound` preset, to keep the stadium track and circular thumb.
Every example on this page shows the two shapes side by side.

Every toggle in the kit takes the same `shape` prop. The `round` value also
has a `*Round` preset component and adds a `uikit-<control>-round` class and
`data-shape="round"` to the root element, for stylesheet hooks.

```tsx
<Switch />                 {/* square (default) */}
<Switch shape="round" />   {/* round — same as <SwitchRound /> */}
```

## States

Off, on, and disabled in both positions.

## Controlled

Drive it from state with `checked` + `onCheckedChange`. Omit `checked` and pass
`defaultChecked` to let the switch manage its own state.

## Naming the two states — `SlideToggle`

`Switch` answers *"is this on"*, and its two positions are the same shape. When
the two states have **names** — `o` / `vim`, source / preview — reach for
`SlideToggle` instead: a track whose knob slides between a left and a right
face, each face carrying its own width. It is square by default (4px track, 2px
knob, the switch tokens); `shape="round"` or `SlideToggleRound` gives the
stadium track and pill knob. `VimToggle` and `PreviewToggle` accept `shape` too.

That is why the knob **expands** as it travels. The control is as wide as the
two words it chooses between, and the knob is exactly as wide as the word it is
sitting on.

State reads through colour, not position alone: the face under the knob is
inked, the other muted. Hovering tints the whole track — accent while on, orange
while off — and knocks the exposed face to white, so the control says what it
will become before it is clicked. Pass `onColor` / `offColor` to change those
tints.

`VimToggle` is the `o` / `vim` preset from the app's editor toolbar, with the
same blue hover in either state. `PreviewToggle` is its `</>` / eye companion.
Both presets accept `disabled` and the generic toggle's native button attributes.

The 20px control keeps its width while the knob moves, including unequal text
faces. Use an accessible `label` for icon-only choices such as Terminal / Chat.
The native toggle button exposes `aria-pressed`, activates with Space or Enter,
shows a keyboard focus ring, and never submits a containing form. Pointer-down
alone does not change state or capture dragging. Disabled controls neither
activate nor highlight; reduced motion removes the slide and fade transitions.

### `SlideToggle`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `on` | `boolean` | — | Which face is chosen: `false` = left, `true` = right. |
| `onToggle` | `() => void` | — | Called on click, including native keyboard activation. |
| `left` / `right` | `ToggleFace` | — | `{ node, w, fontSize? }`. `w` sizes the face **and** the knob when it lands there. |
| `label` | `string` | — | Accessible name — the faces are usually too terse to serve as one. |
| `onColor` / `offColor` | `string` | accent / `#f97316` | Hover tint per state. |
| `slideMs` / `bgMs` | `number` | `240` | Knob travel and background fade. |
| `shape` | `'square' \| 'round'` | `'square'` | Corner shape. `round` = stadium track and pill knob (`SlideToggleRound`). |
| `disabled` | `boolean` | `false` | Disables activation and hover tint. |
| `className` / `style` | `string` / `CSSProperties` | — | Additional button styling. |

`SlideToggle` forwards its button ref and native `aria-*`, `data-*`, focus,
keyboard and pointer attributes. A supplied `onClick` can prevent the toggle
with `event.preventDefault()`. `VimToggle` and `PreviewToggle` supply their faces,
labels and titles; all other toggle props remain available.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `checked` | `boolean` | — | Controlled state. Omit for uncontrolled. |
| `defaultChecked` | `boolean` | `false` | Initial state when uncontrolled. |
| `onCheckedChange` | `(checked: boolean) => void` | — | Fired with the next state on toggle. |
| `disabled` | `boolean` | `false` | Disables interaction. |
| `className` | `string` | — | Extra classes on the track. |
| `thumbClassName` | `string` | — | Extra classes on the moving thumb. |
| `shape` | `'square' \| 'round'` | `'square'` | Corner shape. `square` = 4px track, 2px thumb. `round` = stadium track, circular thumb (`SwitchRound`). |

Any other native `<button>` attributes (`aria-*`, `id`, …) are forwarded.
