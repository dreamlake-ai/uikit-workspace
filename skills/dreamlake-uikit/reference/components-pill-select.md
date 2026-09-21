# PillSelect

A wrapping row of outlined pills for choosing from a short set: `PillRadio` for
one, `ChipMulti` for several. Both take `{ value, label }` options and sit under
a field label in a form — a role, a priority, the teams to add someone to.

## Which control

Against `ToggleButtons`: that one puts its options on a shared track with a
sliding thumb, which suits two or three fixed segments in a toolbar. These wrap,
carry longer labels, and live in forms.

Against `Tag variant="pill"`: a Tag is a **label on an object** — a bindr, a
status. These are a **control for choosing**, so they carry the app's mono
form-field type at the 6px badge radius rather than the Tag's UI type at 12px.
They look adjacent on purpose and are not interchangeable.

## Ink or accent

`PillRadio` fills the selected pill with **ink**: picking one role out of four
is a choice among peers, so it should read as "this one", not as a highlight.
`ChipMulti` fills with the **accent**, which is what the rest of the kit uses
for "on" — picking several things out of a set is additive, and several accent
chips in a row read as a set where several ink ones read as a paragraph.

## Keyboard

`PillRadio` is a `radiogroup` of real `role="radio"` buttons: one tab stop for
the group, arrow keys to move within it, and selection follows focus. `ChipMulti`
is a row of independent toggles carrying `aria-pressed`, so each is its own tab
stop. Focus draws an inset accent outline, matching `TabRow` — an offset ring
around a 24px pill collides with its neighbours in a wrapping row.

## Props

### `PillRadio`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | The selected option's value. |
| `onValueChange` | `(value: string) => void` | — | Called with the picked value. |
| `options` | `PillOption[]` | — | `{ value, label, disabled? }`. |

### `ChipMulti`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string[]` | — | The selected values. |
| `onValueChange` | `(value: string[]) => void` | — | Called with the next selection. |
| `options` | `PillOption[]` | — | `{ value, label, disabled? }`. |

Native `<div>` attributes are forwarded to the wrapping row on both.
