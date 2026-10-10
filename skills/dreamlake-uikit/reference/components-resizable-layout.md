# ResizableLayout

A three-column drag-to-resize layout. Column widths are proportional
(flex-based) by default so the layout responds to any container size, but the
left and middle columns can each opt into a fixed pixel mode via `leftFixedPx`
and `middleFixedPx`. Widths are persisted to `localStorage` via `storageKey`.
Each divider reveals a cursor-following frosted pill on hover/drag.

## Demo

Drag the dividers to resize. All three columns are resizable by default. Hover
a divider to see the pill track the cursor.

## Without divider indicator

`showDivider={false}` hides the pill entirely. The drag area remains active —
hover and drag work as before.

## Custom gap

`gap` controls the visual space between columns in pixels (default `24`).
With `gap={0}` columns sit flush; the divider's hit area stays at least
`20px` wide so the resize handle is always grabbable.

## Hidden columns + fullscreen

`leftHidden`, `middleHidden`, and `rightHidden` each collapse a column to
zero width with an opacity fade. To make one column take the full viewport
("fullscreen"), hide the other two together — there's no dedicated
fullscreen prop because two hidden columns already express the intent.

## Compact panels

Use `compact` at the application's narrow-screen breakpoint to present one panel
at full width. The shared `TabRow` lets users reach every non-hidden panel with
pointer or keyboard navigation. `compactLabels` supplies product-specific names.
Inactive panels remain mounted, so drafts and editor state survive panel switches
and returning to the desktop layout. Desktop widths and persisted sizes are retained.

The initial panel is `middle`, or the first available panel when it is hidden.
Use `defaultCompactPanel="right"` for an initially detail-focused view, or control
selection with `compactPanel` and `onCompactPanelChange` when opening a resource
should show its details. Hidden panels do not appear in the selector. A single visible panel fills the layout
without a selector. Inactive compact panels are inert, and focus moves into the
visible panel if a breakpoint change would hide the focused editor.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `compact` | `boolean` | `false` | Show one full-width panel with a shared tab selector. The caller owns the breakpoint. |
| `compactLabels` | `{ left?: string; middle?: string; right?: string }` | Navigation / Content / Details | Accessible panel names. |
| `compactPanel` | `'left' / 'middle' / 'right'` | — | Controlled compact panel selection; unavailable panels fall back to a visible panel. |
| `defaultCompactPanel` | `'left' / 'middle' / 'right'` | `'middle'` | Initial uncontrolled compact selection. |
| `onCompactPanelChange` | `(panel) => void` | — | Called when users select a compact panel. |
| `left` | `ReactNode` | — | Content for the left column. |
| `middle` | `ReactNode` | — | Content for the middle column. |
| `right` | `ReactNode` | — | Content for the right column. |
| `top` | `ReactNode` | — | Optional content rendered above all columns (e.g. a toolbar). |
| `showDivider` | `boolean` | `true` | Show the cursor-following pill on dividers. The drag area is always active. |
| `gap` | `number` | `24` | Visual width of the space between columns in px. The divider's interactive hit area stays at least 20px wide even when `gap` is smaller, so the resize handle is always grabbable. |
| `padding` | `number` | `12` | Outer padding from the layout's container edges in px. Set to `0` for designs where the layout sits flush with the viewport. |
| `defaultWidths` | `{ left?: number; middle?: number; right?: number }` | `2/3/5` | Initial flex weights for each column. Ignored for any column that opts into a fixed-px mode (`leftFixedPx`, `middleFixedPx`). |
| `minWidths` | `{ left?: number; middle?: number; right?: number }` | `80px` | Minimum pixel width per column, enforced during drag-resize. |
| `leftFixedPx` | `number` | — | Pin the left column to a fixed pixel width. The column ignores its flex ratio and never grows with the viewport. |
| `middleFixedPx` | `number` | — | Pin the middle column to a fixed-but-resize-adjustable pixel width. The middle-right drag mutates the value 1:1 (clamped by `minWidths.middle`); the right column takes the remaining width. Pair with `storageKey` to persist the px value. |
| `storageKey` | `string` | — | `localStorage` key to persist column widths across sessions. |
| `leftHidden` | `boolean` | `false` | Collapse the left column. |
| `middleHidden` | `boolean` | `false` | Collapse the middle column. |
| `rightHidden` | `boolean` | `false` | Collapse the right column. |
| `leftResizable` | `boolean` | `true` | Enable drag-to-resize on the left divider. |
| `rightResizable` | `boolean` | `true` | Enable drag-to-resize on the right divider. |
| `className` | `string` | — | Extra classes on the root element. |
