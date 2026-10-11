# Popover

A floating panel opened by clicking its trigger — for quick settings, filters,
or detail cards. Compose `PopoverTrigger` + `PopoverContent`, with an optional
`PopoverClose`. The panel anchors to its trigger and flips or shifts to stay
within the viewport, moves focus into itself while open, and dismisses on
outside-click or Esc.

## Props

### `Popover`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'bottom'` | Preferred side. |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | Alignment along the side. |
| `showArrow` | `boolean` | `true` | Show the trigger wedge; set false when a wedge is inappropriate. |
| `sideOffset` | `number` | `6` | Gap from the trigger (px). |
| `open` / `defaultOpen` / `onOpenChange` | — | — | Controlled / uncontrolled open state. |

`PopoverTrigger` and `PopoverClose` accept `asChild`.

The wedge follows the actual Floating UI placement after viewport flipping and
shifting. It is decorative and does not receive pointer or keyboard focus. The
panel enters with a short, side-aware slide; reduced-motion preferences disable
entry. Motion uses CSS `translate` independently of positioning, so the surface
and wedge move together without replacing the anchor coordinates.
