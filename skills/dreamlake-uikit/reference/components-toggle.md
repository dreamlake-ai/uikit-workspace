# Toggle

A button with a pressed / not-pressed state — for inline formatting and similar
on/off affordances. Controlled (`pressed` + `onPressedChange`) or uncontrolled
(`defaultPressed`).

## Shape

Every control on this page is **square by default**: `Toggle`, the
`ToggleButtons` segments and the `PillRadio` / `ChipMulti` pills use the 6px
badge radius (`--radius-uikit-badge`), the same corner as `Button`. The
`ToggleButtons` track nests that at 10px (8px with `padding={false}`).
Pass `shape="round"` to keep the stadium look. Each control also has a preset:
`ToggleRound`, `ToggleButtonsRound`, `PillRadioRound` and `ChipMultiRound`.
Every example on this page shows the two shapes side by side.

Every toggle in the kit takes the same `shape` prop. The `round` value also
has a `*Round` preset component and adds a `uikit-<control>-round` class and
`data-shape="round"` to the root element, for stylesheet hooks.

## Sizes

`size` scales the padding, text and icon together — `sm`, `base` (default), `lg`.

## ToggleButtons (segmented)

`ToggleButtons` is a single-select segmented control: a sliding highlight
animates to the active `ToggleButton`. Drive it with `value` + `onValueChange`.
The `primary` and `secondary` highlight shares Tabs' `segment` pill token,
`--uikit-segment-thumb` — the page colour in both themes — and the same track
recipe: the chip tint in light, `--uikit-segment-track` (a recess darker than the
page) in dark, so the selected segment reads raised the same way in both.

## PillRadio & ChipMulti (outlined pills)

A wrapping row of outlined pills for choosing from a short set: `PillRadio` for
one, `ChipMulti` for several. Both take `{ value, label }` options and sit under
a field label in a form — a role, a priority, the teams to add someone to.

Against `ToggleButtons` above: that control puts its options on a shared track
with a sliding thumb, which suits two or three fixed segments in a toolbar.
These wrap, carry longer labels, and live in forms — which is why they are on
this page rather than in one of their own. They are square by default (6px);
`shape="round"` makes stadium pills.

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

### `PillRadio` / `ChipMulti`

| Prop            | Type                  | Description                                                                                                                                                           |
| --------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`         | `string` / `string[]` | The selected value, or values for `ChipMulti`.                                                                                                                        |
| `onValueChange` | `(v) => void`         | Called with the next selection.                                                                                                                                       |
| `options`       | `PillOption[]`        | `{ value, label, disabled?, icon? }`. `icon` is a decorative glyph before the label (an 11px lucide icon), drawn at 50% — 75% when selected — so it trails the label. |
| `shape`         | `'square' \| 'round'` | Corner shape, default `'square'` (6px). `round` = stadium pills (`PillRadioRound` / `ChipMultiRound`).                                                                |

Native `<div>` attributes are forwarded to the wrapping row on both.

### Keyboard focus

`Toggle` and each `ToggleButton` segment show the kit's focus ring — a 2px
`--uikit-accent` outline, inset so it stays inside the segment track — on
**keyboard** focus only (`:focus-visible`). The pill rows' outline needs
`outline-solid` alongside `outline-2`: `outline-none` zeroes Tailwind v4's
outline-style variable, and without it the ring painted nothing.

## Props

### `Toggle`

| Prop              | Type                         | Default     | Description                                                                                                             |
| ----------------- | ---------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| `pressed`         | `boolean`                    | —           | Controlled state. Omit for uncontrolled.                                                                                |
| `defaultPressed`  | `boolean`                    | `false`     | Initial state when uncontrolled.                                                                                        |
| `onPressedChange` | `(pressed: boolean) => void` | —           | Fired on toggle.                                                                                                        |
| `variant`         | `'primary' \| 'secondary'`   | `'primary'` | Active fill style.                                                                                                      |
| `size`            | `'sm' \| 'base' \| 'lg'`     | `'base'`    | Padding/text scale.                                                                                                     |
| `shape`           | `'square' \| 'round'`        | `'square'`  | Corner shape. `square` = 6px badge radius; `round` = stadium (`ToggleRound`). `toggleVariants({ shape })` takes it too. |

### `ToggleButtons` / `ToggleButton`

| Prop             | Type                                             | Default     | Description                                                                                                               |
| ---------------- | ------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| `value`          | `string`                                         | —           | Selected value (`ToggleButtons`).                                                                                         |
| `onValueChange`  | `(value: string) => void`                        | —           | Fired on select.                                                                                                          |
| `variant`        | `'primary' \| 'secondary' \| 'ghost' \| 'panel'` | `'primary'` | Highlight style.                                                                                                          |
| `size`           | `'sm' \| 'md' \| 'lg'`                           | `'md'`      | Item size.                                                                                                                |
| `padding`        | `boolean`                                        | `true`      | Frame padding around the segments. Set `false` for a tighter, edge-to-edge group.                                         |
| `shape`          | `'square' \| 'round'`                            | `'square'`  | Corner shape. `square` = 6px segments in a 10px / 8px track; `round` = stadium track and segments (`ToggleButtonsRound`). |
| `value` (item)   | `string`                                         | —           | This button's value.                                                                                                      |
| `icon` (item)    | `boolean`                                        | `false`     | Square icon-only sizing.                                                                                                  |
| `asChild` (item) | `boolean`                                        | `false`     | Render the single child instead of a `<button>`, forwarding the ref, selected state, and click.                           |

## Compact panel groups

`variant="panel"` keeps selection neutral and puts each item's optional
`hoverColor` on the group background only while hovered or keyboard-focused.
Buttons stay transparent. The complete group height is 26px (`sm`), 30px (`md`),
or 34px (`lg`), including its fixed 2px inset; `padding` does not add another
frame in this variant. Use an unpadded action row and match neighboring controls
to that outer height. See the interactive [panel tab example](reference/components-panel-tabs.md#compact-view-controls).

Inside a TabRow, the panel variant inherits `--uikit-document-control-height` so the whole group matches the inactive tab fill. Outside a row its compact default is 26px.
