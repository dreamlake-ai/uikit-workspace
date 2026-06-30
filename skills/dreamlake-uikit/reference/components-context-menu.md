# Context Menu

A right-click menu built by composition. Wrap a `ContextMenuTrigger` area and a
`ContextMenuContent` list inside `ContextMenu`. The menu anchors to the cursor
position, closes on dismiss, and supports full keyboard navigation. Item
selection is handled per-item via `onSelect`.

## Basic

Right-click the area below to open the menu. Items run their `onSelect`
callback and close the menu; a `ContextMenuSeparator` divides routine actions
from the destructive `danger` item, and `disabled` items are skipped by
keyboard navigation.

## Labels, groups & shortcuts

Use `ContextMenuLabel` for section captions, `ContextMenuGroup` to cluster
related items, and `ContextMenuShortcut` to right-align a keyboard hint inside
an item.

## Props

### ContextMenuItem

| Prop       | Type                         | Default     | Description                                                           |
| ---------- | ---------------------------- | ----------- | --------------------------------------------------------------------- |
| `onSelect` | `() => void`                 | —           | Called when the item is chosen; the menu closes afterward.            |
| `danger`   | `boolean`                    | `false`     | Renders the item in the danger (destructive) tone.                    |
| `variant`  | `'default' \| 'destructive'` | `'default'` | Drop-in alias for `danger`; `'destructive'` matches `danger`.         |
| `disabled` | `boolean`                    | `false`     | Dims the item and removes it from pointer and keyboard interaction.   |
| `asChild`  | `boolean`                    | `false`     | Render through to a single child element instead of a wrapping `div`. |

### Sub-components

| Component              | Description                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `ContextMenu`          | Root provider. Accepts `onOpenChange` and composes the trigger + content.            |
| `ContextMenuTrigger`   | The area whose right-click opens the menu. Pass `asChild` to use your own element.   |
| `ContextMenuContent`   | The floating menu panel that holds the items.                                        |
| `ContextMenuItem`      | An actionable row. See the props table above.                                        |
| `ContextMenuLabel`     | Uppercase section caption; non-interactive.                                          |
| `ContextMenuGroup`     | Wraps related items for spacing and `role="group"` semantics.                        |
| `ContextMenuSeparator` | A horizontal divider between sections.                                               |
| `ContextMenuShortcut`  | Right-aligned keyboard-hint text rendered inside an item.                            |
| `ContextMenuPortal`    | Passthrough kept for drop-in parity; portalling is folded into `ContextMenuContent`. |
