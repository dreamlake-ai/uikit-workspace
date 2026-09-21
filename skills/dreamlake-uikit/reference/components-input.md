# Input

A styled text field. `InputRoot` (also exported as `Input`) is the container +
input; drop `InputSlot`s inside for icons, prefixes, or suffixes. Clicking a slot
focuses the input and places the caret at the matching end.

## A search field, and `Kbd`

The app's ⌘K field is this component plus two slots — a glyph on the left, a
`Kbd` hint on the right.

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
