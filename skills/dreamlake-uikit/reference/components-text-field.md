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

## The underline

The rule carries **one** thing: whether what is typed has been judged. Faint at
rest, red when validation failed, green when it passed — and it does **not**
react to focus.

An accent underline on focus spends that channel on "the caret is here", which
the caret already says, and then a field that is merely focused looks exactly
like a field that has been approved. `valid` is for a field that was *checked*
and passed — a slug the server confirmed is free — not one that merely has
something in it.

`note` renders under the field in the state's colour, with a `×` or `✓`; without
a state it reads as neutral helper text.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | Current value (controlled). |
| `onChange` | `(value: string) => void` | — | Called with the new string value. |
| `prefix` | `ReactNode` | — | Leading adornment inside the field. |
| `multiline` | `boolean` | `false` | Render a `<textarea>` instead of `<input>`. |
| `rows` | `number` | `4` | Textarea row count (when `multiline`). |
| `valid` | `boolean` | `false` | Green underline — a field that was checked and passed. Ignored while `invalid`. |
| `note` | `ReactNode` | — | Message under the field: the state's colour plus a `×` / `✓`, or neutral helper text. |
| `invalid` | `boolean` | `false` | Danger border + `aria-invalid`. |
| `mono` | `boolean` | `false` | Use the monospace face. |
| `disabled` | `boolean` | `false` | Disables input. |
| `className` | `string` | — | Extra classes on the field shell. |

Other native `<input>` attributes (`placeholder`, `type`, `onBlur`, `autoFocus`,
`maxLength`, …) are forwarded.
