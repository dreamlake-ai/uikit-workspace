# Tooltip

A small label shown on hover or keyboard focus. Compose `TooltipTrigger`
(use `asChild` to wrap your own control) + `TooltipContent`. Positioning is
anchored to the trigger and flips or shifts to stay within the viewport. Wrap a
subtree in `TooltipProvider` to share an open delay.

## Props

### `Tooltip`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` | Preferred side. |
| `sideOffset` | `number` | `6` | Gap from the trigger (px). |
| `delayDuration` | `number` | `200` | Hover open delay (ms). |
| `open` / `defaultOpen` / `onOpenChange` | — | — | Controlled / uncontrolled open state. |

`TooltipTrigger` accepts `asChild`. `TooltipContent` accepts a `side` that
overrides the `Tooltip`'s placement. `TooltipProvider` takes `delayDuration`.
