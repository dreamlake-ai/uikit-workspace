# Toggle

A button with a pressed / not-pressed state — for inline formatting and similar
on/off affordances. Controlled (`pressed` + `onPressedChange`) or uncontrolled
(`defaultPressed`).

## Sizes

`size` scales the padding, text and icon together — `sm`, `base` (default), `lg`.

## ToggleButtons (segmented)

`ToggleButtons` is a single-select segmented control: a sliding highlight
animates to the active `ToggleButton`. Drive it with `value` + `onValueChange`.

## PillRadio & ChipMulti (outlined pills)

A wrapping row of outlined pills for choosing from a short set: `PillRadio` for
one, `ChipMulti` for several. Both take `{ value, label }` options and sit under
a field label in a form — a role, a priority, the teams to add someone to.

Against `ToggleButtons` above: that control puts its options on a shared track
with a sliding thumb, which suits two or three fixed segments in a toolbar.
These wrap, carry longer labels, and live in forms — which is why they are on
this page rather than in one of their own.

Against `Tag variant="pill"`: a Tag is a **label on an object** — a bindr, a
status. These are a **control for choosing**, so they carry the app's mono
form-field type at the 6px badge radius rather than the Tag's UI type at 12px.
They look adjacent on purpose and are not interchangeable.

A selected pill takes **ink text on a `--chip-bg` fill, and drops its
hairline**. The line marks where the targets are; the fill says which one is
taken, and a line around that fill would only thicken its edge. Rest is muted
text, hover an ink-5% wash.

Single- and multi-select share that treatment. What differs between them is how
many are on at once, which the control already shows — it does not need a second
colour to say it.

Three louder options were tried in the app and rejected, and the reasons are
worth keeping. A **1.5px ink ring** made the selected option the heaviest ink in
a form whose other fields are bare text, so it read as flagged rather than
chosen and outshouted the submit button. An **accent tint** put a second blue in
a form that already has one — on the button that submits it. A **solid accent
fill** with the label knocked out in `--bg` is the ink ring's problem in another
colour, and 2.5:1 against white besides.

`PillRadio` is a `radiogroup` of real `role="radio"` buttons: one tab stop for
the group, arrow keys to move within it, and selection follows focus.
`ChipMulti` is a row of independent toggles carrying `aria-pressed`, so each is
its own tab stop. Focus draws an inset accent outline, matching `TabRow` — an
offset ring around a 24px pill collides with its neighbours in a wrapping row.

### `PillRadio` / `ChipMulti` props

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `string` / `string[]` | The selected value, or values for `ChipMulti`. |
| `onValueChange` | `(v) => void` | Called with the next selection. |
| `options` | `PillOption[]` | `{ value, label, disabled? }`. |

Native `<div>` attributes are forwarded to the wrapping row on both.

## Props

### `Toggle`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `pressed` | `boolean` | — | Controlled state. Omit for uncontrolled. |
| `defaultPressed` | `boolean` | `false` | Initial state when uncontrolled. |
| `onPressedChange` | `(pressed: boolean) => void` | — | Fired on toggle. |
| `variant` | `'primary' \| 'secondary'` | `'primary'` | Active fill style. |
| `size` | `'sm' \| 'base' \| 'lg'` | `'base'` | Padding/text scale. |

### `ToggleButtons` / `ToggleButton`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | Selected value (`ToggleButtons`). |
| `onValueChange` | `(value: string) => void` | — | Fired on select. |
| `variant` | `'primary' \| 'secondary' \| 'ghost'` | `'primary'` | Highlight style. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Item size. |
| `padding` | `boolean` | `true` | Frame padding around the segments. Set `false` for a tighter, edge-to-edge group. |
| `value` (item) | `string` | — | This button's value. |
| `icon` (item) | `boolean` | `false` | Square icon-only sizing. |
| `asChild` (item) | `boolean` | `false` | Render the single child instead of a `<button>`, forwarding the ref, selected state, and click. |
