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
| `onValueChange` | `(value: string) => void` | — | Alias for `onChange`. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Controls text size and button dimensions across all variants. |
| `indicatorHeight` | `number` | `4` | Indicator thickness in px. `underline` variant only. |
| `className` | `string` | — | Extra classes on the container. |

### Tab

| Field | Type | Description |
| --- | --- | --- |
| `value` | `string` | Unique identifier for the tab. |
| `label` | `ReactNode` | Content rendered inside the tab — string, icon, or any element. |
| `count` | `number` | Count badge shown next to the label. `underline` variant only. |
| `title` | `string` | Tooltip text. Useful for icon-only segment tabs. |

## Compound API

Instead of the data-driven `tabs` prop, you can compose the tab bar and its
panels from sub-components. Pass `value` / `defaultValue` and
`onValueChange` (or `onChange`) to `Tabs`, then place `TabsList` /
`TabsTrigger` / `TabsContent` as children. Each `TabsContent` renders only
when its `value` matches the active tab.

```tsx

  
    Overview
    Activity
  
  …
  …

```

### `TabsList`

Row container for the triggers. Accepts any `<div>` props plus `className`.

### `TabsTrigger`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | Identifier this trigger activates. Required. |
| `className` | `string` | — | Extra classes on the button. |

Also forwards native `<button>` attributes (`onClick`, `disabled`, …).

### `TabsContent`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | Panel is shown only when this matches the active tab. Required. |
| `className` | `string` | — | Extra classes on the panel. |
