# Popover

A floating panel opened by clicking its trigger — for quick settings, filters,
or detail cards. Compose `PopoverTrigger` + `PopoverContent`, with an optional
`PopoverClose`. Positioning, focus management and outside-click/Esc dismissal
come from `@floating-ui/react`.

## Props

### `Popover`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'bottom'` | Preferred side. |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | Alignment along the side. |
| `sideOffset` | `number` | `6` | Gap from the trigger (px). |
| `open` / `defaultOpen` / `onOpenChange` | — | — | Controlled / uncontrolled open state. |

`PopoverTrigger` and `PopoverClose` accept `asChild`.
