# Panel tabs

Use the same tab face across every page: a solid selected surface, 8px rounded
shoulders, curved feet into the content, and no top outline or bottom stroke.
The first tab aligns with the panel's left edge, with the shell's small inset.
Contextual actions sit at the right of the row.

## List headings and selectable tabs

Use `DocumentTabHeading` for a single list's breadcrumb. It retains native link
semantics without pretending a heading is a selectable tab. Use `TabRow` for
controlled views, or `PanelLayout` for dockable groups. All three consume the
same document-tab styles; pages do not need to copy their border or curve CSS.

The strip uses `--uikit-workspace-bg`. Set `--uikit-document-surface` to the
content's fill: `--bg` for a document or list, and the workspace background for
a terminal or chat. The active tab and its body then meet without a color step.

## Exposed corners

A content-width breadcrumb leaves the card's upper-right corner exposed. Keep
that corner rounded (12px in the example), including beside Terminal, Sessions,
and Chat. A shared edge between joined document cards can be square; do not
carry that exception over to a neighbor on the workspace background.

The host owns card placement and fill. The tab primitives own their shoulders,
close controls, focus rings, and horizontal scrolling.

## Retain ongoing work

Switch the example's document tabs after editing a draft: each panel remains
mounted and the container keeps its width. Add enough drafts to try overflow,
use arrow keys to select tabs, and close a draft with its close button. Keep
inactive work mounted in the product too; the tab row only controls selection.

See [Tab Row](reference/components-tab-row.md) for props and overflow behavior and
[Panel Layout](reference/components-panel-layout.md) for docking and split panels.
