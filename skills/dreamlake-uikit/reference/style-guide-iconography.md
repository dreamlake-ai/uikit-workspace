# Iconography

Standard icons across `dreamlake`, `pipelines`, `timetravel`, `profile`, and `notebook` are
sourced from [lucide.dev](https://lucide.dev). Render via `lucide-react` so the path
data matches upstream byte-for-byte — no hand-copied SVG. Stroke 1.4–1.6 at small
sizes (12–16px); 1.1–1.25 at large (24–28px).

## Collection states

Use the shared [collection icons](/components/collection-list/#collection-icons-and-motion)
for folders, Bindrs and pinned drawers. Keep the Lucide silhouettes and add depth
with translucent current-color fills, so the selected row or dark surface still
shows through. Their 180ms hover/open motion stays within a fixed icon slot and
respects reduced motion. The intentional custom exception is `PinnedPlaneIcon`:
a Lucide-derived amber pin over a shaded perspective plane. Row pin status uses
the same amber beside the title, preserving the original type glyph on the left.

## Categories

A representative cut across the six domain categories the design-guide lists:
navigation, files & data, actions, layout & views, status, and DreamLake-specific
domain glyphs.

## Migration backlog

A handful of legacy custom SVGs still ship inline in source apps (`wireframe-shared.jsx`,
`timetravel-view.jsx`). They _read_ like Lucide but aren't — replace with the canonical
name on next touch.
