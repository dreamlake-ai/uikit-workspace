# Collapsible

A region that expands and collapses. Compose three parts: `Collapsible` (state
owner), `CollapsibleTrigger` (toggles it), and `CollapsibleContent` (the
animated-height body).

Open state can be controlled (`open` + `onOpenChange`) or uncontrolled
(`defaultOpen`). The trigger accepts `asChild` to reuse your own button/element.

## Motion

The height moves between `0` and the measured content height in 220ms on
`cubic-bezier(0.2, 0.8, 0.2, 1)` — quick, then slow. The content fades in and
settles 4px down as it opens, and leaves faster than it arrives. While the
height is moving the content carries `data-animating`, so a surrounding
`Dialog` follows it rather than animating its own height on top. Closed content
is `inert`, so focus can't land in a hidden section. With reduced motion there
is no movement.

## Disclosure

For an "options" or "advanced" section, put `CollapsibleChevron` in the
trigger: it points right while closed and turns down on the same curve. Use it
instead of a native `<details>` triangle.

## Props

### `Collapsible`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Controlled open state. Omit for uncontrolled. |
| `defaultOpen` | `boolean` | `false` | Initial state when uncontrolled. |
| `onOpenChange` | `(open: boolean) => void` | — | Fired with the next state on toggle. |
| `disabled` | `boolean` | `false` | Blocks toggling. |

### `CollapsibleTrigger`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | Render the single child as the trigger, merging handlers/classes. |

The trigger sets `aria-expanded` and `aria-controls` (pointing at the content).

### `CollapsibleChevron`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `number` | `14` | Icon size in px (lucide `ChevronRight`, stroke 2). Decorative. |

### `CollapsibleContent`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `className` | `string` | — | Classes on the inner content element. |
