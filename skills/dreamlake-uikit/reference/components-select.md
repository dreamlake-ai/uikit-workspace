# Select

A single-select with the kit's compact mono trigger. The panel flips and shifts
to stay within the viewport, supports keyboard list navigation and typeahead,
and matches the trigger width.

It comes in two forms.

## From a list

When the picker is just a list and a setter — which is most of them — pass
`options` and let the component compose the trigger, the panel and the items.

## Composed

When items need custom rendering, icons or groups, compose `SelectTrigger`
(wrapping a `SelectValue`) with a `SelectContent` of `SelectItem`s, optionally
grouped via `SelectGroup` / `SelectLabel`. Children win when both are given.

The shorthand is expanded once, inside `Select`, into exactly the tree you would
have written — so the label map, the floating list and the typeahead all behave
identically either way, and nothing downstream knows which form you used.

## Reading the panel

The options are the content of the panel, so they render in ink; `SelectLabel`
stays muted, because a group heading is a label. The trigger reads in ink too
once it holds a value — the *placeholder* is what should look unfilled, and
`SelectValue` dims itself for that.

Both used to render muted at 85% opacity, which measured 3.3:1 against the panel
in dark mode — under WCAG AA — and made an open dropdown read as a list of
disabled rows.

## Props

### `Select`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `options` | `SelectOption[]` | — | `{ value, label, disabled? }`. Composes the whole picker. Ignored when `children` are given. |
| `placeholder` | `string` | — | Trigger placeholder, for the `options` form. |
| `value` | `string` | — | Controlled selected value. |
| `defaultValue` | `string` | — | Initial value when uncontrolled. |
| `onValueChange` | `(value: string) => void` | — | Fired when the selection changes. |
| `open` / `onOpenChange` | — | — | Controlled open state. |
| `defaultOpen` | `boolean` | `false` | Initial open state when uncontrolled. |

`SelectValue` takes a `placeholder`. `SelectItem` takes `value` and `disabled`.
`SelectTrigger` accepts `asChild` and an `icon` (a leading `ReactNode` rendered
before the value).
