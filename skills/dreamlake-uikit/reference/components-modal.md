# Modal

A general-purpose modal. Compose `ModalTrigger` + `ModalContent` (with
`ModalHeader`, `ModalTitle`, `ModalDescription`, `ModalFooter`). It closes on Esc
and backdrop click and shows a close button by default.

For a confirmation prompt that must **not** dismiss on outside click, use
[Alert Dialog](reference/components-alert-dialog.md) instead. For a fully controlled,
trigger-less panel see [Dialog](reference/components-dialog.md).

## Props

### `Modal`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Controlled open state. Omit for uncontrolled. |
| `defaultOpen` | `boolean` | `false` | Initial state when uncontrolled. |
| `onOpenChange` | `(open: boolean) => void` | — | Fired when open state changes. |

### `ModalContent`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `showCloseButton` | `boolean` | `true` | Show the corner close button. |

`ModalTrigger` and `ModalClose` accept `asChild` to render your own element.
