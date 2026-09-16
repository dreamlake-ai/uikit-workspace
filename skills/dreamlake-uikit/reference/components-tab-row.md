# Tab Row

A row of closable document tabs with a raised active tab. Tabs start at their preferred width, compress as space runs out, then scroll horizontally once they reach the minimum. Leading and trailing controls stay fixed.

## Compression and overflow

Adjust the row width and tab limits below. Open more tabs with **+**, select a tab, or close one with **×**. Long labels truncate; their full text remains available on hover.

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
| `title` | `string` | Optional full tooltip, such as a path. |
| `panelId` | `string` | Optional ID of the corresponding content panel, used as `aria-controls`. |
| `closable` | `boolean` | Set to `false` to prevent closing this tab. |
| `entering` | `boolean` | Animate a newly opened tab; respects reduced motion. |

## Keyboard interaction

Tab focuses the selected tab. Left/Right arrows select adjacent tabs; Home/End select the first/last tab. Delete requests closing the focused tab. Close buttons are keyboard accessible and appear when their tab contains focus. Selection scrolls into view.

Use [Tabs](reference/components-tabs.md) for underline and segmented switches. Use Tab Row for open documents or pages that need close controls and width compression.
