# FilterBar

A compact toolbar that combines filter chips, a search input, and an optional
sort dropdown. When the user starts typing with a non-`"all"` filter active,
the chip row collapses and the active filter appears as a dismissible token
inside the search field.

## Demo

Filter chips on the left slide an animated underline to the active chip. When
`query` is non-empty and a non-`"all"` filter is selected, the chips are
replaced by a token pill inside the search field. Pressing Backspace on an
empty input removes the token. Filter chips can carry a state color via
`accent` — see the `FilterOption.accent` prop below.

## Search only

Omit `filters` and `sortOptions` to render just the search input.

## Marking the match — `HighlightedText`

The bar produces a query; the rows underneath have to show why they matched.
`HighlightedText` wraps every occurrence of the query in a soft accent-tinted
mark — documented here because a query with no marked results is half a search.

It renders a real `<mark>`, not a tinted `<span>`: the element exists for
exactly this, and assistive tech can announce it. The browser's default yellow
is overridden by the kit's wash, `--color-uikit-accent-22` — mixed in oklab
rather than sRGB because it sits *under* text that has to stay readable in both
themes.

Matching is case-insensitive by default; a reader typing `lake` expects to see
`Lakeshore` marked. Pass `caseSensitive` for a literal match. Every occurrence
is marked, not just the first; overlapping matches are not, since `"aa"` inside
`"aaa"` is one highlight to a reader. A query that doesn't appear — or an empty
one — renders the text untouched, so it is safe to wrap around a label
unconditionally.

### `HighlightedText` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | — | The full string to render. |
| `query` | `string` | — | The substring to mark. Empty or absent leaves `text` untouched. |
| `caseSensitive` | `boolean` | `false` | Match case. |
| `markClassName` | `string` | — | Classes on each `<mark>`, for a different wash in a dense list. |

Native `<span>` attributes are forwarded to the wrapper.

## Props

### FilterBarProps

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `query` | `string` | — | Current search query (controlled). |
| `onQueryChange` | `(q: string) => void` | — | Called when the user types or clears the input. |
| `filters` | `FilterOption[]` | — | Filter chips rendered on the left. First option is treated as "all". Omit to hide chips. |
| `filterValue` | `string` | — | Active filter value (controlled). |
| `onFilterChange` | `(value: string) => void` | — | Called when a chip is clicked or the token is dismissed. |
| `placeholder` | `string` | `'search'` | Placeholder text for the search input. |
| `searchRef` | `RefObject<HTMLInputElement>` | — | Forward ref to the underlying input element. |
| `sortOptions` | `{ value: string; label: string }[]` | — | Options for the sort dropdown. Omit to hide the dropdown. |
| `sortValue` | `string` | — | Active sort value (controlled). |
| `onSortChange` | `(value: string) => void` | — | Called when the sort selection changes. |
| `className` | `string` | — | Extra classes on the root wrapper. |

### FilterOption

| Field | Type | Description |
| --- | --- | --- |
| `value` | `string` | Unique identifier for this filter. |
| `label` | `string` | Display text shown in the chip and as the token label. |
| `count` | `number` | Item count shown as a superscript next to the label. |
| `accent` | `string` | Tint color applied when `count > 0`. Prefer palette tones — `var(--tone-green)` (running/ok), `var(--tone-red)` (failed/error). |
