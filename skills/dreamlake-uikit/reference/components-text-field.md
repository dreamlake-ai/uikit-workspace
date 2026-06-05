# TextField

A controlled text input. `onChange` receives the raw string value (not the
event), so it drops straight into form libraries — e.g. a react-hook-form
`Controller`'s `field`. Use it inside [Field](reference/components-field.md) for a label,
hint and error.

## Basic

## Prefix, invalid & multiline

`prefix` renders a leading adornment (e.g. `/` for slugs); `mono` switches to
the monospace face; `invalid` paints a danger border; `multiline` renders a
`<textarea>` (`rows` controls its height).

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | Current value (controlled). |
| `onChange` | `(value: string) => void` | — | Called with the new string value. |
| `prefix` | `ReactNode` | — | Leading adornment inside the field. |
| `multiline` | `boolean` | `false` | Render a `<textarea>` instead of `<input>`. |
| `rows` | `number` | `4` | Textarea row count (when `multiline`). |
| `invalid` | `boolean` | `false` | Danger border + `aria-invalid`. |
| `mono` | `boolean` | `false` | Use the monospace face. |
| `disabled` | `boolean` | `false` | Disables input. |
| `className` | `string` | — | Extra classes on the field shell. |

Other native `<input>` attributes (`placeholder`, `type`, `onBlur`, `autoFocus`,
`maxLength`, …) are forwarded.
