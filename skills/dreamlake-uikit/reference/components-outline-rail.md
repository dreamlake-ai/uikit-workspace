# OutlineRail

A reusable version of the memo table-of-contents rail. The round dot marks the
viewport's top edge; the accent span extends to its bottom edge and fades at the
tail. The 7px terminal square lights as soon as the animated span reaches its top
edge, and dims again when the span retreats above it; it does not wait for the center.
Both edges ease from their painted positions in either scroll direction, settling
in 250ms. Reduced motion snaps immediately.

## Integration

Import `OutlineRail` and `outlinePosition` from `@dreamlake/uikit/outline` for a
small standalone entrypoint, or from the main package. Put the rail inside a
positioned container referenced by `containerRef`. Mark each row with its original
`data-outline-index` and numeric `data-depth` (12px per indent). Leave 22px before
the row text. The consumer owns links, active styles, folding and keyboard behavior.

Pass fractional heading indices in `viewport={{ start, end }}`; pass `null` when
the document is outside the viewport. Without `viewport`, the dot follows `active`.
`outlinePosition(boundaries, coordinate)` maps document coordinates to fractional
indices; include the document end after the last heading boundary.

Change `layoutKey` when visible rows, labels or indentation change. Original indices
remain stable when folding; the rail interpolates across hidden rows. Resize and
font loading rebuild geometry. SVG segments are measured once per layout, with no
React state updates during animation. Cache document heading coordinates outside
the rail and invalidate them on content/layout changes rather than every scroll.

## Props

| Prop           | Purpose                                                          |
| -------------- | ---------------------------------------------------------------- |
| `containerRef` | Ref to the positioned element containing the rows                |
| `layoutKey`    | String identifying visible row layout                            |
| `active`       | Original active heading index                                    |
| `viewport`     | Optional fractional `{ start, end }`, or `null` to hide progress |
| `accent`       | Accent color; defaults to `var(--color-accent, #d45b34)`         |
| `muted`        | Base rail color; defaults to `var(--color-border, #d5d3d0)`      |
