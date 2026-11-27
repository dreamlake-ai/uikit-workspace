# Compact tree list

Compose `CollectionRow compact`, `TreeBranchGuides` and `VirtualList` for a dense
hierarchy. Each row is 32px high when `detail` is omitted. A truncated title,
status icon and separate source action share one line; rounded L-shaped guides
show only relationships supplied by the caller.

## Selection, disclosure and navigation are separate

`CollectionRow` renders a `div`. The first slot contains the entry icon: a group
icon for groups, a recorded status icon for leaves. A group's primary button
contains the truncated title followed immediately by a chevron and toggles
expansion. The exported `TruncatedText` helper keeps the full-title tooltip on the text
while the chevron stays visible beside it. Leaves have no chevron; their primary button selects the recorded entry
for caller-owned details. Only leaves receive `aria-pressed`; groups expose
`aria-expanded`. A separate native source anchor lives in `actions`.

The row's `onClick` handles the primary action, including clicks on metadata.
The primary button bubbles to that handler; do not attach the same toggle to both
or it will toggle twice. Its stretched hit area stops below the independent
source action. These controls are siblings, with no nested interactive elements.
Use actual recorded destinations for source links; a node ID alone does not
establish a Source path or Dash run.

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

## One moving hover highlight

Reuse `useHoverSlider`, the same UIKit hook used by Sessions and menu-like panels.
It paints one background that travels between rows, rather than flashing a
separate hover background on every entry. This pointer/focus highlight is distinct
from the persistent selected leaf; it is not a second selection model.

Create `const hover = useHoverSlider<HTMLDivElement>()`. Give the host `ref={hover.ref}`,
`className="relative isolate"` and `data-uikit-hover-host`, and render
`{hover.slider}` once inside it. Track the **whole CollectionRow** explicitly from
`onPointerMove` and `onFocusCapture`, using `hover.track(event.currentTarget)`.
Touch pointer movement calls `hover.track(null)` because it represents scrolling.
Do not use the generic `pointerHandlers` for this composition: their button/link
discovery would target the nested title or source control instead of the row.

Clear the highlight on pointer leave, scroll, blur outside the host and structural
changes such as expansion, filtering or resizing. The hook removes a tracked row
that unmounts. Keep `data-selected={true}` and the existing selection fill on the
selected leaf; the moving highlight steps aside on that row. The standard motion
and reduced-motion settings apply unchanged. Collection rows inside a hover host
suppress their individual hover fills, so the moving background is painted once.

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
