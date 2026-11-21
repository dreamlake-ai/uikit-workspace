# Tab Row

A row of closable document tabs with a raised active tab. Tabs start at their preferred width, compress as space runs out, then scroll horizontally once they reach the minimum. Leading and trailing controls stay fixed. On the default desktop row they share the tabs' bottom edge, with a 4px space above them, so a 28px icon button centers on the 26px tabs and the row height does not change.

The strip supplies the left gutter once: at rest, adjacent tabs keep their normal gap. Overflowing document tabs have no visible scrollbar. Use a mouse wheel, horizontal trackpad gesture, or touch swipe to scroll. Inactive tabs on the right slide over earlier tabs as rounded rectangles; the selected tab stays above them so its right edge and controls remain visible. Labels stay vertically centered in the gutter. Rounded opaque faces prevent covered labels from bleeding through. Keyboard selection reveals the selected tab; reduced motion disables the automatic slide animation.

## Workspace context

**1.A — S-curved tabs beside the left panel, editor, and chat.** The
chosen design has no gaps between panels or below them. Right-gutter controls
follow the active tab: chat shows + and ↙ even in an editor panel; editor tabs
retain editor controls. Floating affects only the active chat in that panel.
These are docs simulations; product routing is separate work. The editor text
stays in a narrower column. Its tabs start at the text edge while
there is room; adding drafts expands the strip before scrolling. This is a docs
layout proposal, not an application screenshot or a completed editor adapter.

## Panel tab edge study

**1. Tab edge: 1.A — S-curved (chosen). 1.B — straight left edge (earlier comparison).**
Both choices appear in roomy and crowded states; those are viewport states,
not additional choices. Future questions use 2.A, 2.B, and so on. The selected tab matches the body and its
curved feet extend into it. Inactive tabs are flat labels with faint vertical
separators; hovering gives them a rounded rectangle. Separators beside the
active or hovered tab disappear.

Only the foreground tab shows its canonical hash badge. It stays immediately
before its close button, together at the right
scroll edge of the owning tab. A selected chat shows **+** and **↙** together
in the far-right gutter, aligned with the tab top. Editor tabs hide these chat controls.
Wheel vertically or swipe to scroll. The below-strip popover has a pointing wedge
and updates in place; on touch it dismisses about one second after scrolling
stops. Hold for 500ms on touch to enter the same-row reorder demonstration.
The shared visual and wheel behavior is implemented in UIKit. The reorder and
popover gestures in this study remain docs-only; they do not establish cross-panel
docking or physical-device acceptance.

## Compression and overflow

Adjust the row width and tab limits below. Open more tabs with **+**, select a tab, or close one with **×**. Long labels truncate; their full text remains available on hover.
Selection and row resizing scroll only the tab strip, leaving enclosing panels and the page in place. They reveal the whole active tab, including its trailing
action and close button inside the strip's scroll gutters, so sticky controls do not cover the label.
The flush edge preserves its zero left gutter while retaining the right gutter. Reduce the example width and select the last tab to check that the close
button remains inside the scrolling area, beside the truncated title.

## Icon tabs and leading controls

Use the existing `leading` slot for a subdued navigation control beside the
scrolling tabs. Compact layouts use `minTabHeight={30}` and the
`uikit-tab-row-compact` class to center 32px controls against the 30px labels
plus their tab borders; the compact class also removes the desktop space above
the controls. An item with `icon` and `iconOnly` occupies 32px; its `label`
remains the accessible name and tooltip. A closable icon tab reserves another
22px for its close control. Other tabs retain their normal width and appearance.

## Tab groups

Set `groupStart` on the first tab of a group to draw a thin vertical divider
before it, for example between fixed views and closable sessions. The divider
is decorative: it is not a tab, takes no focus, and arrow keys move straight
across it. It is never drawn before the first tab, so a group that empties
leaves no stray divider.

## Usage

`TabRow` and `PanelLayout` share the shipped document-tab treatment: wheel/touch
scrolling, hidden scrollbars, rounded inactive faces, and a protected active tab.
Underline and segmented [Tabs](reference/components-tabs.md) remain separate styles for
switching sections; they do not acquire document stacking or close buttons.

Fixed action slots hug their controls, separated from the tab viewport by 4px.
Keep the actions in the row's `trailing` slot instead of positioning a wide
opaque container over the scrolling tabs.

Use `startEdge="flush"` when a crowded strip reaches a background-colored
neighbor; the first tab loses its left foot and gutter. Keep the default
`"curved"` beside a white panel. This is a host choice, not automatic color
sampling. The example above lets you compare both with the same tabs.

For editor alignment, place the first tab's **text** at the title column, allowing
for its border, label padding and any leading icon. When the tabs no longer fit,
move the strip to the panel edge without moving the editor content.

```tsx
import { TabRow } from "@dreamlake/uikit";

<TabRow
  tabs={[{ value: "plan", label: "Implementation plan" }]}
  value={activeId}
  onValueChange={setActiveId}
  onClose={closeTab}
  minTabWidth={80}
  preferredTabWidth={170}
  startEdge="curved"
  aria-label="Open notes"
/>;
```

The caller owns the tab list, selection, and content. When closing the active tab, choose its replacement in `onClose`. Omit `onClose` for a row without close controls.

## Surface configuration

Tabs sit on the workspace background. Borders follow the tab shapes only;
there is no full-width rule above the body or border around the panel. The
selected tab uses the body's surface. The first tab reserves only the 8px
needed for its S-shaped foot; editor alignment can position it at the text column.
The + control uses a subtle tint without a shadow.

Background tabs use rounded rectangles inset equally above and below the fill.
Their outer boxes stay the same height as the selected tab, keeping the label
baseline and close targets steady when selection changes. Labels leave a compact
gap before the close, while badges and close controls remain vertically centered.

Set these CSS variables on the containing layout (or the `TabRow` style):

| Variable                           | Default                   | Purpose                                                               |
| ---------------------------------- | ------------------------- | --------------------------------------------------------------------- |
| `--uikit-document-strip-surface`   | `--uikit-workspace-bg`    | Background around tabs; app layouts map this to `var(--dl-shell-bg)`. |
| `--uikit-document-surface`         | `--bg`                    | Selected tab; set this to the host body color.                        |
| `--uikit-document-inactive-bg`     | Strip surface             | Background tabs blend into the workspace.                             |
| `--uikit-document-hover-bg`        | 4% ink over strip surface | Hovered background tab.                                               |
| `--uikit-document-inactive-inset`  | `2px`                     | Equal vertical space around the background tab fill.                  |
| `--uikit-document-action-bg`       | 3% ink over strip surface | Subtle action tint in the specimens.                                  |
| `--uikit-document-action-hover-bg` | 8% ink over strip surface | Hover shade for + and ↙.                                              |

`--uikit-workspace-bg` defaults to `#f1eee7` in light mode and `#222226` in
dark mode, matching the app's workspace shell. Explicit light/dark selection
and system dark mode use the same defaults. Body defaults remain `#fffefa`
(light) and `#2e2e35` (dark). Override the variables on the containing layout
so tabs and controls inherit the same choices. The host owns its panel body
fill: keep `--uikit-document-surface` equal to that fill (normally `--bg`). The
workspace specimen applies it to both; `PanelLayout` does not recolor arbitrary
caller content.

Canonical references belong in the trailing slot only when the owning tab is
selected. Preserve unrelated trailing actions on background tabs. The docs
examples demonstrate this caller-owned distinction without fabricating IDs.

## Props

| Prop                  | Type                      | Default          | Description                                                                        |
| --------------------- | ------------------------- | ---------------- | ---------------------------------------------------------------------------------- |
| `tabs`                | `TabRowItem[]`            | required         | Ordered tabs with unique values and text labels.                                   |
| `value`               | `string`                  | required         | Selected tab value.                                                                |
| `onValueChange`       | `(value: string) => void` | required         | Selection callback.                                                                |
| `onClose`             | `(value: string) => void` | —                | Close callback; enables close controls and middle-click closing.                   |
| `startEdge`           | `"curved" \| "flush"`     | `"curved"`       | First-edge treatment beside white or background-colored panels.                    |
| `minTabWidth`         | `number`                  | `80`             | Minimum CSS pixel width before overflow; clamped to at least 48px to fit controls. |
| `preferredTabWidth`   | `number`                  | `170`            | Preferred CSS pixel width, clamped to the minimum.                                 |
| `leading`, `trailing` | `ReactNode`               | —                | Fixed controls outside the scrolling area.                                         |
| `aria-label`          | `string`                  | `Open documents` | Accessible name for the tab list.                                                  |
| `className`, `style`  | standard React props      | —                | Customize the outer row.                                                           |

The row carries `data-tab-count` with the number of tabs, so a host can style a lone tab differently from a strip (for example, as a full-width head) without counting the DOM: `.uikit-tab-row[data-tab-count='1']`.

### TabRowItem

| Field        | Type        | Description                                                                                                                                                                                                                                                                                                   |
| ------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`      | `string`    | Unique tab identifier.                                                                                                                                                                                                                                                                                        |
| `label`      | `string`    | Visible title and accessible name.                                                                                                                                                                                                                                                                            |
| `labelContent` | `ReactNode` | Optional noninteractive title rendering; `label` stays the accessible name. Suppresses the automatic native title tooltip. |
| `icon`       | `ReactNode` | Optional visual beside the label.                                                                                                                                                                                                                                                                             |
| `iconOnly`   | `boolean`   | Display only the icon at compact width; preserve the text label for accessibility.                                                                                                                                                                                                                            |
| `fitContent` | `boolean`   | Size a text tab to its label and controls, preserving padding and capping width at `preferredTabWidth`; longer labels use the existing ellipsis. A fitted tab without a close control keeps the same width when selected or hovered, so tabs after it do not move. Icon-only tabs retain their compact width. |
| `title`      | `string`    | Optional full tooltip, such as a path.                                                                                                                                                                                                                                                                        |
| `trailing`   | `ReactNode` | A fixed control after the title, outside the tab button; selection reveals it together with the close control.                                                                                                                                                                                                |
| `leading`    | `ReactNode` | A fixed control before the title, outside the tab button and sticky end. Interactive controls remain independently focusable and do not select or close the tab.                                                                                                                                              |
| `panelId`    | `string`    | Optional ID of the corresponding content panel, used as `aria-controls`.                                                                                                                                                                                                                                      |
| `closable`   | `boolean`   | Set to `false` to prevent closing this tab.                                                                                                                                                                                                                                                                   |
| `entering`   | `boolean`   | Animate a newly opened tab; respects reduced motion.                                                                                                                                                                                                                                                          |
| `groupStart` | `boolean`   | Draw a thin divider before this tab to start a new group; ignored on the first tab.                                                                                                                                                                                                                           |

## Keyboard interaction

Tab focuses the selected tab. Left/Right arrows select adjacent tabs; Home/End select the first/last tab. Delete requests closing the focused tab. Close buttons remain visible inside their owning tabs and are keyboard accessible. Selection scrolls into view.

Use [Tabs](reference/components-tabs.md) for underline and segmented switches. Use Tab Row for open documents or pages that need close controls and width compression.

Tab labels and controls do not select text during pointer drags or repeated taps. Text inside the associated content panels remains selectable.

When the scrolling viewport is narrower than two minimum tab widths plus the 16px gutter, tabs scroll without sticky stacking. This keeps later labels reachable beside fixed controls; wider rows retain their usual stacking. The Row width example can be narrowed to 120px to exercise this behavior.
