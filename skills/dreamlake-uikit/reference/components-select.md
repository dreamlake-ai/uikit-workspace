# Select

A composable single-select with the kit's compact mono trigger. Compose
`SelectTrigger` (wrapping a `SelectValue`) with a `SelectContent` of
`SelectItem`s, optionally grouped via `SelectGroup` / `SelectLabel`. Positioning,
keyboard list navigation, and typeahead come from `@floating-ui/react`; the panel
matches the trigger width.

This is a drop-in for the legacy `@vuer-ai/vuer-uikit` Select.

## Props

### `Select`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | Controlled selected value. |
| `defaultValue` | `string` | — | Initial value when uncontrolled. |
| `onValueChange` | `(value: string) => void` | — | Fired when the selection changes. |
| `open` / `defaultOpen` / `onOpenChange` | — | — | Controlled / uncontrolled open state. |

`SelectValue` takes a `placeholder`. `SelectItem` takes `value` and `disabled`.
`SelectTrigger` accepts `asChild`.
