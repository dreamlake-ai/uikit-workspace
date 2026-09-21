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

Native `<div>` attributes are forwarded.
