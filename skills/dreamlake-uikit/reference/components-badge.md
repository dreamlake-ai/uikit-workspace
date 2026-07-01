# Badge

A compact inline badge for counts and statuses. Filled variants map onto the
6-color semantic palette; `secondary`/`outline` stay neutral.

> Related: [Tag](reference/components-tag.md) is the hashtag/pill primitive for filter chips
> and categorical labels. Reach for **Badge** for counts and short status
> markers, **Tag** for selectable/removable category pills.

## Variants

## Shapes

`type` switches the shape: `default` (label pill), `circle` (square-ish single
glyph / count), and `dot` (a bare colored indicator with no label).

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'default' \| 'secondary' \| 'outline' \| 'success' \| 'warning' \| 'destructive' \| 'purple' \| 'neutral'` | `'default'` | Color/fill (covers the full 6-tone palette). |
| `type` | `'default' \| 'circle' \| 'dot'` | `'default'` | Shape. |
| `asChild` | `boolean` | `false` | Render the single child element instead of a `<span>`, merging classes. |
| `className` | `string` | — | Extra classes. |

`badgeVariants({ variant, type, className })` is also exported — it returns the
composed class string for hand-built badge-styled elements.
