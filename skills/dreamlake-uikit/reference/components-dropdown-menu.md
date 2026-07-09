# Dropdown Menu

A menu of actions opened from a trigger. Compose `DropdownMenuTrigger` +
`DropdownMenuContent` with `DropdownMenuItem`, `DropdownMenuLabel`,
`DropdownMenuSeparator`, radio items (`DropdownMenuRadioGroup` /
`DropdownMenuRadioItem`), and nested submenus (`DropdownMenuSub` /
`DropdownMenuSubTrigger` / `DropdownMenuSubContent`). The menu anchors to its
trigger and flips or shifts to stay within the viewport, supports keyboard list
navigation, and dismisses on outside-click or Esc; submenus open on hover.

## Props

### `DropdownMenu`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'bottom'` | Preferred side. |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | Alignment along the side. |
| `open` / `defaultOpen` / `onOpenChange` | — | — | Controlled / uncontrolled open state. |

### Items

`DropdownMenuItem` takes `onSelect` (fired on activation; the menu then closes),
`disabled`, and `asChild` (render through to a single child element instead of a
`<div>`). `DropdownMenuRadioGroup` takes `value` + `onValueChange`;
`DropdownMenuRadioItem` takes `value`. `DropdownMenuTrigger` accepts `asChild`.
`DropdownMenuShortcut` renders a right-aligned keyboard hint (e.g. ⌘C) inside an
item.
