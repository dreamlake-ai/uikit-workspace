# Toggle

A button with a pressed / not-pressed state — for inline formatting and similar
on/off affordances. Controlled (`pressed` + `onPressedChange`) or uncontrolled
(`defaultPressed`).

## ToggleButtons (segmented)

`ToggleButtons` is a single-select segmented control: a sliding highlight
animates to the active `ToggleButton`. Drive it with `value` + `onValueChange`.

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
| `value` (item) | `string` | — | This button's value. |
| `icon` (item) | `boolean` | `false` | Square icon-only sizing. |
