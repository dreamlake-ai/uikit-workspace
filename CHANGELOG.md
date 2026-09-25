# Release notes

## Unreleased

- `BreadcrumbTree` gains a second panel layout and a toggle between them. `columns` is the existing Miller browser; `tree` is the whole expanded tree in one flow that wraps into columns, so several branches stay on screen at once. `view` / `defaultView` / `onViewChange` / `hideViewToggle` control it.
- `BreadcrumbTree` applies a drag to its own cache and no longer refetches to confirm it, so a re-parent no longer collapses the rest of the panel. `onMove` reports failure by rejecting; hosts should stop bumping `refreshToken` on a successful move. `BreadcrumbMove` gains `fromPath`.
- The panel flips above its trigger when there is not enough room below, instead of hanging off the bottom of the window where a fixed element cannot be scrolled back into view.
- Add `ListSearchInput` with an optional removable filter badge. The × control and Backspace at a collapsed caret at the start remove the filter without changing the query.
- Reuse that control in `FilterBar`; collapse category choices on search focus and match the category tabs with a 2px ink underline.
- Show panel close controls on header hover or keyboard focus without moving header content.
- Document the shared search control and its keyboard behavior.

## 0.1.15 — 2026-09-13

- Waterfall entry panes resize through the shared drag divider or keyboard arrows/Home/End. Public width bounds, resize callback, and a disable toggle support embedded views.
- Responsive limits retain timeline space on narrow containers, with requested widths restored when space returns.

## 0.1.14 — 2026-09-13

- The initial viewport fits the full input event span with padding, respecting explicit zoom limits. Search, expansion, and data rerenders preserve navigation. Empty input retains a finite fallback.

- Hover highlights join squarely across the tree/timeline divider. Only the outside corners of a row or subtree are rounded; standalone TreeView styling is unchanged.
- Zoom-out is unlimited by default (`maxWindow={Infinity}`). Both wheel zoom and the duration drag control respect explicit minimum and maximum windows.
- Ruler tick spacing scales with the visible window, so zooming out to long traces does not generate unbounded tick elements.
- Updated the [Waterfall guide](packages/docs/pages/components/waterfall/+Page.mdx) with defaults and a one-hour maximum example.
