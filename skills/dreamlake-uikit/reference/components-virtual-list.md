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

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `T[]` | — | Array of items to render. |
| `itemHeight` | `number \| "dynamic"` | — | Fixed height in px, or `"dynamic"` for content-driven heights. |
| `estimatedItemHeight` | `number` | `40` | Initial height estimate used in dynamic mode. |
| `height` | `number \| string` | `"100%"` | Container height. |
| `overscan` | `number` | `3` | Extra items rendered outside the visible area. |
| `getItemKey` | `(item, index) => string \| number` | `index` | Returns a stable key for each item. |
| `children` | `(item, index, style) => ReactNode` | — | Render function. Must apply `style` to the item root element. |
| `hasMore` | `boolean` | `false` | Whether more items can be loaded. |
| `loadingMore` | `boolean` | `false` | Shows a loading indicator at the bottom while true. |
| `onLoadMore` | `() => void` | — | Called when scroll reaches the load-more threshold. |
| `loadMoreThreshold` | `number` | `80` | Px from bottom that triggers `onLoadMore`. |
| `renderLoadingMore` | `ReactNode` | `"Loading more…"` | Custom content shown while `loadingMore` is true. |
| `onScroll` | `(scrollTop: number) => void` | — | Fires on scroll with the current `scrollTop` value. |
| `onRangeChange` | `(start, end) => void` | — | Fires when the visible index range changes. |
| `stickyHeader` | `ReactNode` | — | Header rendered inside the scroll container with `position: sticky`. Only shown when `stickyHeaderHeight` is greater than `0`. |
| `stickyHeaderHeight` | `number` | `0` | Height of `stickyHeader`. Subtracted from visible-area calculations so items don't render under it. |
| `className` | `string` | — | Extra classes on the container. |
