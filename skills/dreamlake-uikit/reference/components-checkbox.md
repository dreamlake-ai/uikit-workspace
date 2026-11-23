# Checkbox

A native checkbox for independent choices. At rest, the checked state shows only
an accent-colored checkmark; the unchecked state reserves the same space without
a ballot-box outline. Hover reveals the box. Keyboard focus reveals the box and
an accent focus ring. There is no fill or fade animation.

## Labels and input behavior

Import `Checkbox` from `@dreamlake/uikit` and include UIKit's stylesheet. Wrap it
in a native `label` (as above), or associate a separate `Label` with `htmlFor` and
the input's `id`. Always supply a visible label or `aria-label`, especially since
the unchecked control has no resting outline. A padded label enlarges the touch
target without changing the 16px mark.

The native input handles Space, label clicks, touch activation, form submission,
required validation, and form reset. It does not capture pointer gestures.
`disabled` prevents activation and dims the control. In forced-colors mode, the
browser's native checkbox appearance provides the system's contrast treatment.

## Controlled and mixed state

Use `checked` with `onCheckedChange` for controlled state, or `defaultChecked`
for an uncontrolled input. A mixed checkbox takes `indeterminate`, exposes the
native mixed state, and displays an accent dash. On activation, accept the boolean
choice and clear `indeterminate`; leaving it true keeps the mixed state controlled.
Mixed state does not change which value a checked input submits with a form.

```tsx
import { Checkbox } from "@dreamlake/uikit";

<label>
  <Checkbox checked={selected} onCheckedChange={setSelected} />
  Include experiment
</label>;
```

## Props

| Prop              | Type                         | Default | Description                                                           |
| ----------------- | ---------------------------- | ------- | --------------------------------------------------------------------- |
| `checked`         | `boolean`                    | —       | Controlled checked state.                                             |
| `defaultChecked`  | `boolean`                    | `false` | Initial native uncontrolled state; restored on form reset.            |
| `onCheckedChange` | `(checked: boolean) => void` | —       | Receives the next native checked state.                               |
| `indeterminate`   | `boolean`                    | `false` | Controlled mixed state, shown as a dash.                              |
| `disabled`        | `boolean`                    | `false` | Disables the native input.                                            |
| `className`       | `string`                     | —       | Extra classes on the input, including its border and focus treatment. |

The forwarded ref is an `HTMLInputElement`. Other native input attributes and
events (`name`, `value`, `required`, `id`, `onChange`, `aria-*`, etc.) are forwarded;
`type` is always `checkbox`. `onChange` runs before `onCheckedChange`. Color uses
`--uikit-accent` directly, including nested custom themes. There is no hardcoded blue and no motion to disable under reduced motion.
