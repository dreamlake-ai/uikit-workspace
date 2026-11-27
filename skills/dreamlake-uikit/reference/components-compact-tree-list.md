# Compact tree list

Compose `CollectionRow compact`, `TreeBranchGuides` and `VirtualList` for a dense
hierarchy. Each row is 32px high when `detail` is omitted. A truncated title,
status icon and separate source action share one line; rounded L-shaped guides
show only relationships supplied by the caller.

## Selection, disclosure and navigation are separate

`CollectionRow` renders a `div`. Put a native primary button in `name`, an
independent disclosure button in `icon` with `iconInteractive`, and a native
source anchor in `actions`. The example stretches the primary button's hit area
across the row; the interactive icon and actions stay above it. These controls
are siblings, so there is no button inside a link or link inside a button.
`aria-pressed` announces the selected primary entry and `aria-expanded` announces
disclosure. Use actual recorded destinations for source links; a node ID alone
does not establish a Source path or Dash run.

Compact rows retain icons and action controls when the panel narrows. Optional
metadata may hide to leave room for the full primary target. The full title
remains the button's accessible name; `nameText` supplies the existing truncation
tooltip. Omit `detail` for a single row. If supplied, detail is retained below the
row rather than silently discarded.

The parent owns selection, expansion, routing and any adjacent details panel.
Opening a source link does not select or disclose its row. Modified clicks retain
the browser's native behavior. Add a product keyboard controller when needed;
this composition is a list with buttons, not an ARIA tree with an invented
keyboard model.

## Connections and virtualization

Flatten the complete visible hierarchy before windowing. Pass each row's
`ancestors`, `branch` and `isLast` to `TreeBranchGuides`, and use the same `step`
for indentation. The example uses 20px columns and a 16px midpoint for its 32px
rows. The guides are decorative and add no focus target. Rows whose parents are
unknown must not receive invented branches.

Use stable IDs and keep selection/expansion in the parent. The example retains
selection when a group is collapsed, and computes continuation flags from all
visible rows so virtualized offscreen siblings do not terminate the connectors.
There are no special test, session, or workflow data types in UIKit.

## How Sessions and Threads use the same pieces

DreamLake's Sessions view combines its product-owned `UnifiedSessionList` rows
with UIKit `VirtualListFlow`, `TreeBranchGuides` and `useHoverSlider`. Threads
uses `CollectionRow` with a product keyboard controller. Native session lineage
already combines `CollectionEntry size="sm"` with `TreeBranchGuides`.

The compact collection-row presentation and this documented composition provide
shared geometry and interaction slots without moving session identity, access,
selection policy or application inspectors into UIKit. Existing Sessions and
Threads pages are not automatically migrated by this component release.
