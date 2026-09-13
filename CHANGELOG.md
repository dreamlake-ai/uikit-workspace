# Release notes

## Unreleased — Waterfall

- The initial viewport fits the full input event span with padding, respecting explicit zoom limits. Search, expansion, and data rerenders preserve navigation. Empty input retains a finite fallback.

- Hover highlights join squarely across the tree/timeline divider. Only the outside corners of a row or subtree are rounded; standalone TreeView styling is unchanged.
- Zoom-out is unlimited by default (`maxWindow={Infinity}`). Both wheel zoom and the duration drag control respect explicit minimum and maximum windows.
- Ruler tick spacing scales with the visible window, so zooming out to long traces does not generate unbounded tick elements.
- Updated the [Waterfall guide](packages/docs/pages/components/waterfall/+Page.mdx) with defaults and a one-hour maximum example.
