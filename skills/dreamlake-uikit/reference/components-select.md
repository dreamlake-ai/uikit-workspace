# Select

A composable single-select with the kit's compact mono trigger. Compose
`SelectTrigger` (wrapping a `SelectValue`) with a `SelectContent` of
`SelectItem`s, optionally grouped via `SelectGroup` / `SelectLabel`. The panel
flips and shifts to stay within the viewport, supports keyboard list navigation
and typeahead, and matches the trigger width.

## Props

### `Select`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | Controlled selected value. |
| `defaultValue` | `string` | — | Initial value when uncontrolled. |
| `onValueChange` | `(value: string) => void` | — | Fired when the selection changes. |
| `open` / `onOpenChange` | — | — | Controlled open state. |
| `defaultOpen` | `boolean` | `false` | Initial open state when uncontrolled. |

`SelectValue` takes a `placeholder`. `SelectItem` takes `value` and `disabled`.
`SelectTrigger` accepts `asChild` and an `icon` (a leading `ReactNode` rendered
before the value).
