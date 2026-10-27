# Select

A single-select with the kit's compact mono trigger. The panel flips and shifts
to stay within the viewport, supports keyboard list navigation and typeahead,
and is at least as wide as the trigger.

The options' text lines up under the trigger's text: the panel sits 14px left of
the trigger (the list's 4px inset plus a row's 10px), less any left padding an
`asChild` trigger has of its own, so the eye goes straight down from the value
to the list rather than stepping sideways.

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

Like `Menu`, the panel shows a wedge by default (`arrow={false}` turns it off):
it points at the trigger's chevron and follows the panel when it flips. The
panel is widened by the same pull so the wedge still reaches the chevron.
Options scroll inside the panel so the wedge remains visible.

## Reading the panel

The options are the content of the panel, so they render in ink; `SelectLabel`
stays muted, because a group heading is a label. The trigger reads in ink too
once it holds a value — the *placeholder* is what should look unfilled, and
`SelectValue` dims itself for that.

Both used to render muted at 85% opacity, which measured 3.3:1 against the panel
in dark mode — under WCAG AA — and made an open dropdown read as a list of
disabled rows.

### Opening and closing

The list unfolds from the trigger's corner when it opens and **folds back into
it** when it closes — the unfold played backwards, 220ms on an accelerating
curve with the opacity held for the first third. A pick applies the moment it is
clicked; the fold is only what the list looks like on its way out. While it
folds it is already gone for everything else: focus is back on the trigger,
the list is `inert` and `aria-hidden`, and it never takes the pointer, so the
next click lands on what is underneath. Reopening mid-fold animates the same
list back open from where it had got to. Under `prefers-reduced-motion` the
fold is a 100ms fade.

### Keyboard focus

The trigger shows the kit's focus ring — a 2px `--uikit-accent` outline, 2px
outside the label — on **keyboard** focus only (`:focus-visible`); a click
never paints it. Outside, like Button's padless `link`: the trigger has no
padding, so an inset ring would cut the glyphs.

## Props

### `Select`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `arrow` | `boolean` | `true` | Show a trigger-pointing wedge. |
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
