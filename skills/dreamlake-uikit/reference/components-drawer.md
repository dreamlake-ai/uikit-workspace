# Drawer

A panel anchored to a screen edge — for filters, details, or mobile menus.
Compose `DrawerTrigger` + `DrawerContent` (with `DrawerHeader`, `DrawerTitle`,
`DrawerDescription`, `DrawerFooter`) and an optional `DrawerClose`. Closes on Esc
and backdrop click. Set `managedFocus` on `DrawerContent` to keep keyboard focus
inside the drawer and return it to the opener when closed. The example enables
this behavior; `initialFocus` and `returnFocus` accept element refs when the
default first control and opener are not the desired targets. Entry motion
follows the drawer edge and respects reduced-motion preferences.

`direction` (`top` / `bottom` / `left` / `right`, default `bottom`) sets the
edge. Open state can be controlled (`open` + `onOpenChange`) or uncontrolled.

## Props

### `Drawer`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `direction` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Edge to anchor to. |
| `open` | `boolean` | — | Controlled open state. Omit for uncontrolled. |
| `defaultOpen` | `boolean` | `false` | Initial state when uncontrolled. |
| `onOpenChange` | `(open: boolean) => void` | — | Fired when open state changes. |

`DrawerTrigger` and `DrawerClose` accept `asChild` to render your own element.
