# VirtualList

Renders only the visible slice of a large list. Supports fixed item heights,
dynamic (content-driven) heights, and infinite scroll.

## Fixed height

Pass `itemHeight` as a number (px).

## Dynamic height

Pass `itemHeight="dynamic"` for content-driven heights. Each item is measured
after it renders. Use `estimatedItemHeight` to set the initial layout estimate.

## Infinite scroll

Pass `hasMore`, `loadingMore`, and `onLoadMore`. The callback fires when the
scroll position is within `loadMoreThreshold` px (default `80`) of the bottom.

## Experiment selection

`useListSelection` is the selection controller extracted from DreamLake's
experiment list. Combine it with `VirtualList` or `useVirtualList`; it does not
render rows or replace your focus/navigation behavior.

| Gesture                | Selection behavior                                                      |
| ---------------------- | ----------------------------------------------------------------------- |
| Plain click            | Replace with that row and move the range anchor.                        |
| Cmd/Ctrl click         | Toggle that row and move the anchor.                                    |
| Shift click            | Replace with the inclusive anchor-to-row range, in list order.          |
| Plain drag across rows | Replace with the crossed range. A press alone does nothing until click. |
| Cmd/Ctrl drag          | Add the crossed range to the selection captured at the press.           |
| Escape                 | Clear selection; dialog-owned or prevented Escape is left alone.        |

The hook keeps selected **record snapshots** supplied by the caller. Additive
selection retains existing objects, including off-list records; replacing the
selection discards them. Reversing a drag recomputes from its press-time baseline,
so its range can shrink. Use stable `id` strings and pass rows in displayed order.
The range anchor is an index, matching the experiment list. If the displayed row
order changes during a gesture, call `cancelDrag()` and set a new anchor if needed.

```tsx
import { useListSelection, useVirtualList } from "@dreamlake/uikit/list";

const selection = useListSelection({
  selected, // controlled records with string ids
  onSelectionChange: setSelected, // omit for read-only
  resetKey: projectAndFolder, // changing context clears the selection
  listenForEscape: false, // handle Escape in the focused list instead
});
```

The focused `/list` entrypoint exports these two hooks and their types without
loading component, editor, or icon modules. `useListSelection` is also exported
from the package root.

Bind `handleRowClick(index, rows, event)` and either the mouse handlers
`handleRowMouseDown`/`handleRowMouseEnter` or their pointer equivalents.
Pointer adapters ignore touch drags so native touch scrolling can continue;
the resulting tap is handled by click. Window release ends a gesture; blur,
pointer cancellation, unmount and `resetKey` changes discard stale gesture state.
Neither row handlers nor global listeners prevent default scrolling or capture
the pointer for you.

For a virtualized list with pointer capture or autoscroll, extend a drag through
`handleRowMouseEnter(index, rows, { buttons: 1 })` using its current row index.
Call `endDrag()` on normal release before forwarding the gesture's click; it
preserves suppression of a completed drag's click. Use `cancelDrag()` only for
cancellation. Do not also forward the retargeted native click after manually
forwarding one. `clear()` and `selectAll(rows)` serve toolbar actions;
`toggle(index, rows)` supports keyboard toggling, and `setAnchor(index, rows)`
moves a keyboard range anchor without selecting. Shift keyboard ranges use the
same `handleRowClick` method with `shiftKey: true`.

`selected` and `onSelectionChange` form the controlled contract: render from
the selected records and update them in the callback. `resetKey` defaults to
`undefined`; `listenForEscape` defaults to `true` for the existing application
behavior. Multiple same-turn calls read the preceding proposed selection, so
batched toggles retain all changes. Omitting the callback makes every mutation
read-only while preserving `isSelected(id)`.

## Props

| Prop                  | Type                                | Default           | Description                                                                                                                    |
| --------------------- | ----------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `items`               | `T[]`                               | —                 | Array of items to render.                                                                                                      |
| `itemHeight`          | `number \| "dynamic"`               | —                 | Fixed height in px, or `"dynamic"` for content-driven heights.                                                                 |
| `estimatedItemHeight` | `number`                            | `40`              | Initial height estimate used in dynamic mode.                                                                                  |
| `height`              | `number \| string`                  | `"100%"`          | Container height.                                                                                                              |
| `overscan`            | `number`                            | `3`               | Extra items rendered outside the visible area.                                                                                 |
| `getItemKey`          | `(item, index) => string \| number` | `index`           | Returns a stable key for each item.                                                                                            |
| `children`            | `(item, index, style) => ReactNode` | —                 | Render function. Must apply `style` to the item root element.                                                                  |
| `hasMore`             | `boolean`                           | `false`           | Whether more items can be loaded.                                                                                              |
| `loadingMore`         | `boolean`                           | `false`           | Shows a loading indicator at the bottom while true.                                                                            |
| `onLoadMore`          | `() => void`                        | —                 | Called when scroll reaches the load-more threshold.                                                                            |
| `loadMoreThreshold`   | `number`                            | `80`              | Px from bottom that triggers `onLoadMore`.                                                                                     |
| `renderLoadingMore`   | `ReactNode`                         | `"Loading more…"` | Custom content shown while `loadingMore` is true.                                                                              |
| `onScroll`            | `(scrollTop: number) => void`       | —                 | Fires on scroll with the current `scrollTop` value.                                                                            |
| `onRangeChange`       | `(start, end) => void`              | —                 | Fires when the visible index range changes.                                                                                    |
| `stickyHeader`        | `ReactNode`                         | —                 | Header rendered inside the scroll container with `position: sticky`. Only shown when `stickyHeaderHeight` is greater than `0`. |
| `stickyHeaderHeight`  | `number`                            | `0`               | Height of `stickyHeader`. Subtracted from visible-area calculations so items don't render under it.                            |
| `className`           | `string`                            | —                 | Extra classes on the container.                                                                                                |
