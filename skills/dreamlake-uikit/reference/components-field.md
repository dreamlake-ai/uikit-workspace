# Field

A labelled wrapper for a single form control. Renders the label (with an
optional required marker), the control (its `children` — usually a
[TextField](reference/components-text-field.md) or [Select](reference/components-select.md)), and a
hint or error line below.

## Label & hint

## Error

When `error` is set it replaces the hint and renders in the danger tone. Pair it
with the control's own `invalid` flag for the red border.

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `label` | `ReactNode` | Field label (rendered above the control). |
| `hint` | `ReactNode` | Helper text shown below when there is no error. |
| `error` | `ReactNode` | Error message; replaces the hint, shown in danger tone. |
| `required` | `boolean` | Appends a danger `*` to the label. |
| `htmlFor` | `string` | Associates the label with a control `id`. |
| `className` | `string` | Extra classes on the wrapper. |
| `children` | `ReactNode` | The control to wrap. |
