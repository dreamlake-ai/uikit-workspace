# Tab Row

A row of closable document tabs with a raised active tab. Tabs start at their preferred width, compress as space runs out, then scroll horizontally once they reach the minimum. Leading and trailing controls stay fixed.

## Compression and overflow

Adjust the row width and tab limits below. Open more tabs with **+**, select a tab, or close one with **×**. Long labels truncate; their full text remains available on hover.
Selection and row resizing reveal the whole active tab, including its trailing
action and close button. Reduce the example width and select the last tab to check that the close
button remains inside the scrolling area, beside the truncated title.

## Icon tabs and leading controls

Use the existing `leading` slot for a subdued navigation control beside the
scrolling tabs. Compact layouts use `minTabHeight={30}` and the
`uikit-tab-row-compact` class to center 32px controls against the 30px labels
plus their tab borders. The default desktop row spacing is unchanged. An item with `icon` and `iconOnly` occupies 32px; its `label`
remains the accessible name and tooltip. A closable icon tab reserves another
22px for its close control. Other tabs retain their normal width and appearance.

## Usage

```tsx
import { TabRow } from '@dreamlake/uikit'

<TabRow
  tabs={[{ value: 'plan', label: 'Implementation plan' }]}
  value={activeId}
  onValueChange={setActiveId}
  onClose={closeTab}
  minTabWidth={80}
  preferredTabWidth={170}
  aria-label="Open notes"
/>
```

The caller owns the tab list, selection, and content. When closing the active tab, choose its replacement in `onClose`. Omit `onClose` for a row without close controls.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `tabs` | `TabRowItem[]` | required | Ordered tabs with unique values and text labels. |
| `value` | `string` | required | Selected tab value. |
| `onValueChange` | `(value: string) => void` | required | Selection callback. |
| `onClose` | `(value: string) => void` | — | Close callback; enables close controls and middle-click closing. |
| `minTabWidth` | `number` | `80` | Minimum CSS pixel width before overflow; clamped to at least 48px to fit controls. |
| `preferredTabWidth` | `number` | `170` | Preferred CSS pixel width, clamped to the minimum. |
| `leading`, `trailing` | `ReactNode` | — | Fixed controls outside the scrolling area. |
| `aria-label` | `string` | `Open documents` | Accessible name for the tab list. |
| `className`, `style` | standard React props | — | Customize the outer row. |

### TabRowItem

| Field | Type | Description |
| --- | --- | --- |
| `value` | `string` | Unique tab identifier. |
| `label` | `string` | Visible title and accessible name. |
| `icon` | `ReactNode` | Optional visual beside the label. |
| `iconOnly` | `boolean` | Display only the icon at compact width; preserve the text label for accessibility. |
| `fitContent` | `boolean` | Size a text tab to its label and controls, preserving padding and capping width at `preferredTabWidth`; longer labels use the existing ellipsis. Icon-only tabs retain their compact width. |
| `title` | `string` | Optional full tooltip, such as a path. |
| `trailing` | `ReactNode` | A fixed control after the title, outside the tab button; selection reveals it together with the close control. |
| `panelId` | `string` | Optional ID of the corresponding content panel, used as `aria-controls`. |
| `closable` | `boolean` | Set to `false` to prevent closing this tab. |
| `entering` | `boolean` | Animate a newly opened tab; respects reduced motion. |

## Keyboard interaction

Tab focuses the selected tab. Left/Right arrows select adjacent tabs; Home/End select the first/last tab. Delete requests closing the focused tab. Close buttons are keyboard accessible and appear when their tab contains focus. Selection scrolls into view.

Use [Tabs](reference/components-tabs.md) for underline and segmented switches. Use Tab Row for open documents or pages that need close controls and width compression.

Tab labels and controls do not select text during pointer drags or repeated taps. Text inside the associated content panels remains selectable.
