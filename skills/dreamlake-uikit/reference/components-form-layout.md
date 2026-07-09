# Form Layout

A small wrapper that pairs a label with a control. `orientation="label-top"
` (default) stacks them; `label-left` puts the label in a column beside the
control. Pass exactly two children — `[label, control]`.

## Alignment

With `label-left`, `align` controls how the label sits against a control that's
taller than one line.

## Any control, and `asChild`

The control can be anything — input, switch, number field. With `asChild` the
layout classes land on the single child element instead of a wrapper `<div>`.
Make that child a `<label>` if you want clicking it to focus the control.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `orientation` | `'label-top' \| 'label-left'` | `'label-top'` | Stacked vs side-by-side. |
| `align` | `'start' \| 'center' \| 'end' \| 'baseline'` | `'center'` | Cross-axis alignment. |
| `asChild` | `boolean` | `false` | Render the single child instead of a wrapper. |
| `className` | `string` | — | Extra classes. |
