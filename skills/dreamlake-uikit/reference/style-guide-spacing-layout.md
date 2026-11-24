# Spacing & layout

Eleven spacing steps from 2 to 40px. There's no token — values are used inline. Most
padding lives between 6–18px; the 2px row gap is sacred. The big jumps at the top
(20 → 28 → 40) are for section breathing room, not row rhythm.

## Spacing scale

## Page grid

The docs site itself is the canonical example: a 3-column grid at `1320px` max width —
**240px** left rail, **1fr** content, **240px** right rail — with `0` gaps between
columns. Everything inside lays out against this frame.

```css
.page {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr) 240px;
  max-width: 1320px;
  margin-inline: auto;
}
```

## Breakpoints

Two breakpoints in current use, both for the docs shell:

- **`max-[1100px]`** — drop the right rail (TOC). Content widens to fill the remaining
  space; the left nav stays at 240px.
- **`max-[880px]`** — drop the left nav too. Single-column layout; chrome collapses.

No "mobile-first" set of named breakpoints. Everything is desktop-first; the two
overrides are the only places the layout changes.

## Tab row: contextual actions on the right

A tabbed panel's few actions for the visible view sit at the right end of its tab
row, never in an extra header, toolbar or footer. The tab strip keeps the
remaining width and scrolls, so the actions never widen the panel. See
[TabbedContainer → Contextual actions](reference/components-tabbed-container.md#contextual-actions).

Document and framed content tabs keep their label boxes steady across selection.
Inactive rounded fills sit 2px inside the top and bottom of the tab box; hover
changes the fill rather than the box size. Labels and trailing badges stay
vertically centered, with compact space before the close control.

## Touch: card meta goes to the bottom-right corner

A card header with always-visible actions on a touch device (`hover: none`) is
one line: title, then the buttons, centred on the title; the title truncates
against them. The meta (timestamp) is not squeezed in beside the buttons — it
sits in the card's bottom-right corner, right-aligned on the footer row. This
overrides the narrow-card rule (meta on its own line below `20rem`) for touch
cards with top-right actions only — pointer cards keep it.
See [ProfileCard](reference/components-profile-card.md).

## Media viewers and compact panel actions

The shared [MediaViewerDialog](reference/components-media-viewer.md) uses 40px of desktop
media padding. Below 640px it places the gallery rail below the media, with
56px above and 16px beside the content to keep the close control clear.
Compact panel action groups stay beside the tab row and reserve their measured
width so tabs can scroll without overlapping the controls.

## Panel control height

Measure the outside of a button group, including its track padding. A compact
panel selector and its neighboring icon buttons share the inactive tab fill height
(26px in the 30px-row example).
Do not stack wrapper padding or a descendant minimum height onto the control.
Use an unpadded flex row with centered items; the shared panel toggle already
includes its 2px track inset.

Tab gutter actions match the inactive tab fill, not the outer strip. Use `uikit-document-tab-action` and the row’s `--uikit-document-control-height` for this size. A 30px tab with a 2px fill inset gives a 26px control. Keep the close button’s top and right gaps equal, including in taller host rows. Tab shoulders and feet are 8px; panel card corners may remain 12px.

## File-drop surfaces

Use [FileDropOverlay](reference/components-file-drop-overlay.md) inside the exact positioned
panel or destination row. Its dashed boundary follows that surface, with neutral
diagonal hatching and a clear central prompt. Keep the content mounted and leave
pointer events on the owning surface. Use the compact variant for folder and Bindr
rows; place upload progress in the existing attachments panel. Provide a visible
file-picker action for keyboard and touch users.

Document tabs share one inactive treatment across TabRow and PanelLayout: hide the close control on inactive tabs, including on hover, without reserving its width. Keep short, vertically centered separators between adjacent inactive tabs. The active tab retains its close control; Delete and middle-click continue to close closable tabs.

Background panels (Terminal, Sessions and Chat) need a visible active tab. On those `.uikit-document-tab` faces, set `--uikit-document-active-gradient: var(--uikit-document-subtle-gradient)`. The shared gradient uses an 8% ink tint at the top and fades into the panel surface, including the close-control area, in light and dark themes. Keep a lone list heading flat; use the gradient on list panels only when they share a row with other tabs. Inactive tabs remain flat, without a close control, and retain short separators.
