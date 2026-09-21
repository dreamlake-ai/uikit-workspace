# Input

A styled text field. `InputRoot` (also exported as `Input`) is the container +
input; drop `InputSlot`s inside for icons, prefixes, or suffixes. Clicking a slot
focuses the input and places the caret at the matching end.

## Focus

Click into a field above. Focus does two things, and both are load-bearing:

- **A 1px accent line on the field's own edge, inset.** An outset ring around a
  filled pill reads as a browser default dropped onto the page, and it has to be
  budgeted for by whatever clips the field — a rail, a toolbar, a row. Inset, it
  lands on the edge the field already has.
- **The fill drops to the page ground** rather than deepening. That carries the
  same message without colour, for a reader who cannot separate a blue hairline
  from a grey one.

An `error` field keeps its danger tint and takes the line in `--tone-red`
instead.

At rest the field sits on the translucent `--chip-bg`, not the opaque
`--search-bg`. Over `--bg` the two are the same colour by construction — 4% ink
on `#fffefa` *is* `#f5f4f0` — but only the translucent one stays right when the
field sits on a panel or a rail.

## Marking the match — `HighlightedText`

A field produces a query; the rows under it have to show why they matched.
`HighlightedText` wraps every occurrence of the query in a soft accent-tinted
mark — documented here because a search field with no marked results is half a
search.

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

### `HighlightedText`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | — | The full string to render. |
| `query` | `string` | — | The substring to mark. Empty or absent leaves `text` untouched. |
| `caseSensitive` | `boolean` | `false` | Match case. |
| `markClassName` | `string` | — | Classes on each `<mark>`, for a different wash in a dense list. |

Native `<span>` attributes are forwarded to the wrapper.

## A search field, and `Kbd`

The app's ⌘K field is this component plus two slots — a glyph on the left, a
`Kbd` hint on the right.

The field itself stays on the kit's UI face — a search box is still a text
input, and a page that renders the same component in two typefaces is a page
with no rule. Only the `Kbd` chip is mono, because a key legend is a key legend.

`Kbd` is the shortcut chip itself, exported from the kit and documented here
because the search field is what it exists for. It renders a real `<kbd>`, so
the markup says what it is, and it is deliberately quiet: mono at 9.5px on the
faintest ink wash, muted text, no border. It advertises a shortcut that already
works and is never a control — if you want one that looks clickable, that is a
[Button](reference/components-button.md). It also reads well on its own, e.g. `esc` in a
dialog footer. The hint carries `hideOnFocus`, so it steps out of the
way the moment the reader starts typing: it is advertising a shortcut for
reaching this field, and they are already here.

`hideOnFocus` is pure CSS. Slots render after the input in the DOM, so a sibling
selector reaches them — no focus state in React, and nothing to keep in sync.

## Props

### `InputRoot`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Height/text scale. |
| `state` | `'default' \| 'error'` | `'default'` | Error tints the surface. |
| `side` | `'left' \| 'right' \| 'center'` | — | Text alignment of the input. |
| `inputClassName` | `string` | — | Classes on the inner `<input>`. |

All native `<input>` attributes (`placeholder`, `value`, `onChange`, `disabled`,
…) are forwarded.

### `InputSlot`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `side` | `'left' \| 'right'` | `'left'` | Which end of the input the slot sits at. |
| `hideOnFocus` | `boolean` | `false` | Hide the slot while the input has focus — for a hint that has served its purpose once the reader is typing. |

### `Kbd`

Native `<kbd>` attributes, plus `className`.

Native `<div>` attributes are forwarded.
