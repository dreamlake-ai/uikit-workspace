# VirtualListFlow

Same external API as [`VirtualList`](./virtual-list), but items render in
**CSS normal flow** instead of as absolutely-positioned children with
`transform: translateY`. Use this variant when virtualization needs to
coexist with `position: sticky` inside items, CSS `gap`, or any other
layout rule that depends on items participating in the document's flow.

## Why a second variant

The original `VirtualList` positions every visible item with
`position: absolute` + `transform: translateY(...)`. Two consequences fall
out of that:

1. **Each item becomes a containing block.** A `position: sticky`
   descendant sticks within its parent item's bounds — not against the
   outer scroll container. In a tall virtualized list this looks wrong:
   you see one sticky header per item, each stuck inside its own slot,
   rather than the conventional "current section's header pinned to
   viewport top" behavior.
2. **Items are out-of-flow.** CSS `gap`, `margin-collapsing`, browser
   scroll anchoring, and other normal-layout rules don't apply between
   items. Spacing has to be baked into each item's own padding, and the
   scroll position can drift when off-screen items measure new heights
   asynchronously.

`VirtualListFlow` rebuilds the same windowing primitive on a different
internal layout:

```
<div overflow-auto height>                 ← scroll container
  [stickyHeader]                            ← optional, position: sticky
  <div padding-top padding-bottom>          ← flow shell
      …                     ← visible items, in normal flow
  </div>
</div>
```

`paddingTop` and `paddingBottom` represent the height of the items that
aren't rendered (above and below the visible window respectively). Since
the items themselves sit in normal flow, the document's height is just
`paddingTop + sum(visible item heights) + paddingBottom`, and the
container scrolls naturally.

The trade-off: changing the padding values on scroll triggers a layout
reflow on the shell div, where the absolute+transform variant only
incurred compositor work. In practice the layout cost is a single short
paint and modern browsers handle it well; the win from `gap`, `sticky`,
and `overflow-anchor` "just working" is usually worth it.

## When to pick which

| | `VirtualList` (absolute) | `VirtualListFlow` (flow) |
| --- | --- | --- |
| Sticky inside an item | Pinned to item, not scroll container | Pinned to scroll container ✓ |
| CSS `gap` / `margin` between items | Bake into item padding | Works natively ✓ |
| Compositing layers | One per visible item | None per item ✓ |
| Repositioning cost on scroll | Compositor only (cheap) | Layout (cheap, but heavier than compositor) |
| Async height-change scroll drift | Possible | Browser scroll anchoring keeps stable ✓ |

If a list doesn't need any of the flow-side wins, `VirtualList` is
fine and slightly cheaper. For any list of cards, sections, or items
with sticky/layered structure inside them, prefer `VirtualListFlow`.

## Fixed height

Pass `itemHeight` as a number (px). The visible window is calculated in O(1).

## Dynamic height

Pass `itemHeight="dynamic"` for content-driven heights. Each item is
wrapped in a `ResizeObserver`-measured div. Use `estimatedItemHeight` to
set the initial layout estimate; the browser's native scroll-anchoring
prevents visible scroll jumps when measured heights replace estimates.

## Infinite scroll

Pass `hasMore`, `loadingMore`, and `onLoadMore`. The callback fires when
the scroll position is within `loadMoreThreshold` px (default `80`) of
the bottom.

## Props

`VirtualListFlow` re-exports the same `VirtualListProps` type as
`VirtualList`, so callers can swap one for the other without rewriting
JSX. The `style` argument passed to the `children` render fn is just
`{ width: '100%' }` (plus `height` in fixed mode) — no positioning
information, because items are in normal flow and don't need any.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `T[]` | — | Array of items to render. |
| `itemHeight` | `number \| "dynamic"` | — | Fixed height in px, or `"dynamic"` for content-driven heights. |
| `estimatedItemHeight` | `number` | `40` | Initial height estimate used in dynamic mode. |
| `height` | `number \| string` | `"100%"` | Container height. |
| `overscan` | `number` | `3` | Extra items rendered outside the visible area. |
| `getItemKey` | `(item, index) => string \| number` | `index` | Returns a stable key for each item. |
| `children` | `(item, index, style) => ReactNode` | — | Render function. Applying `style` is optional in flow mode — only `width` (and `height` in fixed mode) are set. |
| `hasMore` | `boolean` | `false` | Whether more items can be loaded. |
| `loadingMore` | `boolean` | `false` | Shows a loading indicator at the bottom while true. |
| `onLoadMore` | `() => void` | — | Called when scroll reaches the load-more threshold. |
| `loadMoreThreshold` | `number` | `80` | Px from bottom that triggers `onLoadMore`. |
| `renderLoadingMore` | `ReactNode` | `"Loading more…"` | Custom content shown while `loadingMore` is true. |
| `onScroll` | `(scrollTop: number) => void` | — | Fires on scroll with the current `scrollTop` value. |
| `onRangeChange` | `(start, end) => void` | — | Fires when the visible index range changes. |
| `stickyHeader` | `ReactNode` | — | Header rendered inside the scroll container with `position: sticky`. |
| `stickyHeaderHeight` | `number` | `0` | Height of `stickyHeader`. Subtracted from visible-area calculations so items don't render under it. |
| `className` | `string` | — | Extra classes on the container. |
