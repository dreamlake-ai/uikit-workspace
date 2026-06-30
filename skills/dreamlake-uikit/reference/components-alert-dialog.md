# Alert Dialog

A modal dialog that interrupts the user to confirm a consequential action.
Unlike a plain [Dialog](reference/components-dialog.md), it **does not** dismiss on backdrop
click — the user must choose `AlertDialogAction` or `AlertDialogCancel` (Esc also
cancels).

Compose `AlertDialogTrigger` + `AlertDialogContent` (with `AlertDialogHeader`,
`AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, and the
`AlertDialogAction` / `AlertDialogCancel` buttons). Open state can be controlled
(`open` + `onOpenChange`) or uncontrolled.

## Props

### `AlertDialog`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Controlled open state. Omit for uncontrolled. |
| `defaultOpen` | `boolean` | `false` | Initial state when uncontrolled. |
| `onOpenChange` | `(open: boolean) => void` | — | Fired when open state changes. |

`AlertDialogTrigger`, `AlertDialogAction`, and `AlertDialogCancel` each accept
`asChild` to render your own button. `Action`/`Cancel` close the dialog after
their `onClick` runs (call `preventDefault()` to keep it open).
