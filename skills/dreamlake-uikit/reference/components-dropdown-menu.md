# Dropdown Menu

A menu of actions opened from a trigger. Compose `DropdownMenuTrigger` +
`DropdownMenuContent` with `DropdownMenuItem`, `DropdownMenuLabel`,
`DropdownMenuSeparator`, radio items (`DropdownMenuRadioGroup` /
`DropdownMenuRadioItem`), and nested submenus (`DropdownMenuSub` /
`DropdownMenuSubTrigger` / `DropdownMenuSubContent`). Positioning, keyboard list
navigation, and dismissal use `@floating-ui/react`; submenus open on hover.

## Props

### `DropdownMenu`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'bottom'` | Preferred side. |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | Alignment along the side. |
| `open` / `defaultOpen` / `onOpenChange` | — | — | Controlled / uncontrolled open state. |

### Items

`DropdownMenuItem` takes `onSelect` (fired on activation; the menu then closes)
and `disabled`. `DropdownMenuRadioGroup` takes `value` + `onValueChange`;
`DropdownMenuRadioItem` takes `value`. `DropdownMenuTrigger` accepts `asChild`.
