# Iconography

Standard icons across `dreamlake`, `pipelines`, `timetravel`, `profile`, and `notebook` are
sourced from [lucide.dev](https://lucide.dev). Render via `lucide-react` so the path
data matches upstream byte-for-byte — no hand-copied SVG. Stroke 1.4–1.6 at small
sizes (12–16px); 1.1–1.25 at large (24–28px).

## Collection states

Use the shared [collection icons](/components/collection-list/#collection-icons-and-motion)
for folders, Bindrs and pinned drawers. Folder and Bindr marks keep their Lucide silhouettes and translucent
current-color fills, so the selected row or dark surface still shows through. Folder and Bindr motion takes 180ms and respects reduced motion.
The intentional custom exception is the pinned drawer icon: a neutral Lucide-derived
pin over three softly rounded perspective papers in a fixed 28px canvas.
The stack separates and rotates on hover, compresses on press, and fans wider
when expanded. The stack uses opaque tonal fills so rear edges do not bleed through. The pin flies toward the top left and fades out so the open papers
have room to breathe; closing brings it back. Paper motion takes 240ms and the
fade takes 180ms, with immediate state changes for reduced motion. Row pin status remains
amber, slanted over the upper-left corner of the original type glyph on the left. The type glyph shrinks and tilts in perspective with a subtle solid shadow under the badge; its slot stays fixed, the pin stays accessible, and no background patch is added. Apply the same badge to any pinned node or resource type.

## Categories

A representative cut across the six domain categories the design-guide lists:
navigation, files & data, actions, layout & views, status, and DreamLake-specific
domain glyphs.

## Migration backlog

A handful of legacy custom SVGs still ship inline in source apps (`wireframe-shared.jsx`,
`timetravel-view.jsx`). They _read_ like Lucide but aren't — replace with the canonical
name on next touch.
