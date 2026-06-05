# FilterBar

A compact toolbar that combines filter chips, a search input, and an optional
sort dropdown. When the user starts typing with a non-`"all"` filter active,
the chip row collapses and the active filter appears as a dismissible token
inside the search field.

## Demo

Filter chips on the left slide an animated underline to the active chip. When
`query` is non-empty and a non-`"all"` filter is selected, the chips are
replaced by a token pill inside the search field. Pressing Backspace on an
empty input removes the token. State colors (`accent`) on filter chips pull
from the Style Guide palette — `var(--tone-green)` (`#1f8f4a`, running/ok) and
`var(--tone-red)` (`#c8513b`, failed/error).

## Search only

Omit `filters` and `sortOptions` to render just the search input.

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
| `searchRef` | `RefObject` | — | Forward ref to the underlying input element. |
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
| `accent` | `string` | Tint color applied when `count > 0`. Prefer palette tones — `var(--tone-green)` (running), `var(--tone-red)` (failed). |
