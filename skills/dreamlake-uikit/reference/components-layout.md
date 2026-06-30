# Layout

Two studio layout shells, each a single `*View` component that arranges center
content with optional `left` / `right` / `top` / `bottom` slots. Every slot
accepts any `ReactNode` — pass your own panels, toolbars, or controls. Both
fill their parent (`height: 100%`), so constrain the height of the wrapping
element.

## Switching layouts

Both shells share the same slot API, so swapping between them is a one-line
change (`const View = liquid ? LiquidLayoutView : DockLayoutView`). Click the
button to switch the live example: the **dock** layout docks the same cards onto
solid full-height rails — cards go flat (no border or shadow) since they share
the rail's surface — while the **liquid** layout floats them over the
pointer-transparent center content.

## Dock layout

`DockLayoutView` docks panels to the edges: left and right panels are full-height
columns, the top slot floats centered near the top, and the bottom slot spans the
full width. Panel surfaces use the DreamLake panel token. The center content sits
behind the docked panels and scrolls independently.

## Liquid layout

`LiquidLayoutView` is a 3-column grid whose gutters are pointer-transparent, so a
3D canvas rendered as the content stays interactive behind the floating panels.
Each slot wrapper re-enables pointer events only on its own children. Left and
right panels are capped to a readable max width and scroll vertically.

## DockLayoutView props

| Prop               | Type        | Default | Description                                                                      |
| ------------------ | ----------- | ------- | -------------------------------------------------------------------------------- |
| `children`         | `ReactNode` | —       | Center content. Rendered behind the docked panels and scrolls independently.     |
| `left`             | `ReactNode` | —       | Full-height panel docked to the left edge. Omitted if unset.                     |
| `right`            | `ReactNode` | —       | Full-height panel docked to the right edge. Omitted if unset.                    |
| `top`              | `ReactNode` | —       | Slot floated centered near the top edge. Omitted if unset.                       |
| `bottom`           | `ReactNode` | —       | Full-width slot docked to the bottom edge. Omitted if unset.                     |
| `hideUI`           | `boolean`   | `false` | Hides all panels (keeps content) by making the UI invisible and non-interactive. |
| `className`        | `string`    | —       | Extra classes on the root container.                                             |
| `leftClassName`    | `string`    | —       | Extra classes on the left panel wrapper.                                         |
| `rightClassName`   | `string`    | —       | Extra classes on the right panel wrapper.                                        |
| `topClassName`     | `string`    | —       | Extra classes on the top slot wrapper.                                           |
| `bottomClassName`  | `string`    | —       | Extra classes on the bottom slot wrapper.                                        |
| `contentClassName` | `string`    | —       | Extra classes on the center content wrapper.                                     |

## LiquidLayoutView props

| Prop               | Type        | Default | Description                                                                                              |
| ------------------ | ----------- | ------- | -------------------------------------------------------------------------------------------------------- |
| `children`         | `ReactNode` | —       | Center content (e.g. a 3D canvas). Stays interactive behind the floating panels.                         |
| `left`             | `ReactNode` | —       | Floating panel in the left grid column. Capped to a max width and scrolls vertically. Omitted if unset.  |
| `right`            | `ReactNode` | —       | Floating panel in the right grid column. Capped to a max width and scrolls vertically. Omitted if unset. |
| `top`              | `ReactNode` | —       | Floating slot centered in the top grid row. Omitted if unset.                                            |
| `bottom`           | `ReactNode` | —       | Floating slot spanning the bottom grid row. Omitted if unset.                                            |
| `hideUI`           | `boolean`   | `false` | Hides all floating panels (keeps content) by making the UI invisible and non-interactive.                |
| `className`        | `string`    | —       | Extra classes on the root grid container.                                                                |
| `leftClassName`    | `string`    | —       | Extra classes on the left panel wrapper.                                                                 |
| `rightClassName`   | `string`    | —       | Extra classes on the right panel wrapper.                                                                |
| `topClassName`     | `string`    | —       | Extra classes on the top slot wrapper.                                                                   |
| `bottomClassName`  | `string`    | —       | Extra classes on the bottom slot wrapper.                                                                |
| `contentClassName` | `string`    | —       | Extra classes on the center content wrapper.                                                             |
