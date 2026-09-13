# Release notes

## 0.1.15 — 2026-09-13

- Waterfall entry panes resize through the shared drag divider or keyboard arrows/Home/End. Public width bounds, resize callback, and a disable toggle support embedded views.
- Responsive limits retain timeline space on narrow containers, with requested widths restored when space returns.

## 0.1.14 — 2026-09-13

- The initial viewport fits the full input event span with padding, respecting explicit zoom limits. Search, expansion, and data rerenders preserve navigation. Empty input retains a finite fallback.

- Hover highlights join squarely across the tree/timeline divider. Only the outside corners of a row or subtree are rounded; standalone TreeView styling is unchanged.
- Zoom-out is unlimited by default (`maxWindow={Infinity}`). Both wheel zoom and the duration drag control respect explicit minimum and maximum windows.
- Ruler tick spacing scales with the visible window, so zooming out to long traces does not generate unbounded tick elements.
- Updated the [Waterfall guide](packages/docs/pages/components/waterfall/+Page.mdx) with defaults and a one-hour maximum example.
