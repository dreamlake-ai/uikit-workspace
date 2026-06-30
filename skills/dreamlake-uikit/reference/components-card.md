# Card

A content container on a panel surface with a hairline border and token-scaled
padding. Compose it from `CardHeader`, `CardTitle`, `CardDescription`,
`CardAction`, `CardContent`, and `CardFooter`.

## Basic

`size` (`sm` / `md` / `lg` / `xl`, default `lg`) sets the padding scale.

## Collapsible

Set `collapsible` and provide `collapsedContent` (shown in place of the body
when collapsed). `defaultCollapsed` controls the initial state.

## Props

### `Card`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'lg'` | Padding scale. |
| `collapsible` | `boolean` | `false` | Enable the collapse toggle. |
| `collapsedContent` | `ReactNode` | — | Shown in place of the body while collapsed. |
| `defaultCollapsed` | `boolean` | `false` | Initial collapsed state. |
| `className` | `string` | — | Extra classes. |

Subcomponents (`CardHeader`, `CardTitle`, `CardDescription`, `CardAction`,
`CardContent`, `CardFooter`) accept `className` and native `<div>` attributes.
`CardHeader` also takes a `size` matching the card.
