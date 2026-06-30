# Form Layout

A small wrapper that pairs a label with a control. `orientation="label-top"
` (default) stacks them; `label-left` puts the label in a column beside the
control. Pass exactly two children — `[label, control]`.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `orientation` | `'label-top' \| 'label-left'` | `'label-top'` | Stacked vs side-by-side. |
| `align` | `'start' \| 'center' \| 'end' \| 'baseline'` | `'center'` | Cross-axis alignment. |
| `asChild` | `boolean` | `false` | Render the single child instead of a wrapper. |
| `className` | `string` | — | Extra classes. |
