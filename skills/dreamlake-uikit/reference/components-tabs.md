# Tabs

An animated tab switcher with two visual variants. Both share the same
controlled / uncontrolled API — only the appearance changes. Content rendering
is left to the caller.

## Underline (default)

The default `underline` variant: a sliding bottom indicator under the active
tab.

## Controlled

## Count badges

Add `count` to any tab to show a pill badge. Badge opacity and background
respond to active and hover state.

## Small size

Use `size="sm"` for a compact 12px tab bar.

## Segment variant

A classic segmented control: tinted container background, active tab gets a
raised pill matching the page background. `label` accepts any `ReactNode` —
pass icons or text.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `tabs` | `Tab[]` | — | Array of tab descriptors. |
| `variant` | `'underline' \| 'segment'` | `'underline'` | Visual style. |
| `value` | `string` | — | Controlled active tab value. |
| `defaultValue` | `string` | `tabs[0]` | Initial tab in uncontrolled mode. |
| `onChange` | `(value: string) => void` | — | Called when the user clicks a tab. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Controls text size and button dimensions across all variants. |
| `indicatorHeight` | `number` | `2` | Indicator thickness in px. `underline` variant only. |
| `className` | `string` | — | Extra classes on the container. |

### Tab

| Field | Type | Description |
| --- | --- | --- |
| `value` | `string` | Unique identifier for the tab. |
| `label` | `ReactNode` | Content rendered inside the tab — string, icon, or any element. |
| `count` | `number` | Count badge shown next to the label. `underline` variant only. |
| `title` | `string` | Tooltip text. Useful for icon-only segment tabs. |
