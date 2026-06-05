# Select

A compact inline dropdown for selection. Opens below the trigger, closes on
outside click. Commonly used for sort/filter controls in toolbars.

The trigger is `w-fit` — it hugs its content even inside a flex container (like a
[Field](reference/components-field.md)), so the dropdown stays anchored to the trigger
rather than a stretched parent.

## With icon

Pass any glyph or node as `icon` — it renders before the label at 65% opacity.

## Without icon

Without an icon, only the current label and the caret are shown.

## Alignment & forms

`align` controls which edge of the **trigger** the dropdown opens from — `'right'`
(default) suits a right-aligned toolbar control; `'left'` suits a left-aligned
control such as one inside a form Field. The label/trigger style is unchanged;
only the panel's anchor moves.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | Currently selected option value. |
| `onChange` | `(value: string) => void` | — | Called when the user picks an option. |
| `options` | `SelectOption[]` | — | List of options to display. |
| `icon` | `ReactNode` | — | Optional prefix glyph rendered before the label at 65% opacity. |
| `align` | `'left' \| 'right'` | `'right'` | Edge of the trigger the dropdown panel opens from. |
| `className` | `string` | — | Extra classes on the root wrapper. |

### SelectOption

| Field | Type | Description |
| --- | --- | --- |
| `value` | `string` | Unique identifier for the option. |
| `label` | `ReactNode` | Content rendered in the trigger and dropdown list. |
