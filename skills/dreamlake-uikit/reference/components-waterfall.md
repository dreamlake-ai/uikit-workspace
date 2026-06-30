# Waterfall

A timeline waterfall for run traces and profiling data. The component splits
into two synced panes: a searchable **tree** of events on the left, and a
zoomable **time axis** on the right. Each row is positioned against the same
clock, so parent/child timing and overlap read at a glance.

Rows come in two shapes, decided by their fields:

- **Duration bars** — rows with `startTime` + `duration` render as a bar
  spanning that interval.
- **Instant events** — rows with a bare `time` render as a single dot on the
  axis.

The hierarchy is built from `parentId` (a root row has `parentId: null`).
Collapsible parents can be expanded and collapsed in the tree; the search bar
at the top of the left pane filters rows by `label` (with case-sensitive and
regex toggles).

## Interaction

The time axis manages its own viewport, so the whole timeline is navigable
without any external state:

- **Zoom** — `Shift`/`Alt` + mouse wheel zooms the time axis in and out around
  the cursor. Tune the feel with `zoomFactor`, and clamp the range with
  `minWindow` / `maxWindow`.
- **Pan** — drag horizontally (or use the navigation controls at the bottom)
  to scroll through time while staying at the current zoom.
- **Mark** — click anywhere on a bar or the axis to drop a temporal marker
  (`T1`, `T2`, …) for measuring against. Click a marker again to remove it.
- **Hover** — hovering a row in either pane highlights its counterpart in the
  other.

## Example

A small agent run trace: a root task, two attempts, and the steps inside each.
Duration bars use varied `color` tones; the halt, checkpoint, and completion
rows are instant `time` events. `getIcon` returns a small
[lucide](https://lucide.dev) icon per row based on its `etype`.

The `` fills its container, so wrap it in a fixed-height element
(here `360px`).

## Props — `WaterfallProps`

| Prop                     | Type                               | Default         | Description                                                         |
| ------------------------ | ---------------------------------- | --------------- | ------------------------------------------------------------------- |
| `logData`                | `LogItemType[]`                    | —               | Rows to render. Hierarchy comes from each row's `parentId`.         |
| `getIcon`                | `(item: LogItemType) => ReactNode` | —               | Returns the icon shown for a row in the tree.                       |
| `panelWidth`             | `number`                           | `300`           | Width of the left list/tree pane, in px.                            |
| `temporalCursor`         | `number`                           | —               | Controlled time position of the interactive cursor.                 |
| `onTemporalCursorChange` | `(time: number) => void`           | —               | Called as the cursor moves over the axis.                           |
| `hoveredId`              | `string \| null`                   | —               | Controlled hovered row id. Falls back to internal state if omitted. |
| `onItemHover`            | `(id: string \| null) => void`     | —               | Called when the hovered row changes.                                |
| `minWindow`              | `number`                           | `0.01`          | Minimum zoom window duration, in seconds.                           |
| `maxWindow`              | `number`                           | `duration * 10` | Maximum zoom window duration, in seconds.                           |
| `zoomFactor`             | `number`                           | `1.1`           | Multiplier applied per wheel-zoom step.                             |
| `enabled`                | `boolean`                          | `true`          | Enable wheel pan/zoom handling.                                     |
| `children`               | `ReactNode`                        | —               | Extra content rendered inside the timeline (e.g. custom overlays).  |
| `className`              | `string`                           | —               | Extra classes on the outer wrapper.                                 |

## Row shape — `LogItemType`

A row is either an instant event (`time`) or a duration bar
(`startTime` + `duration`). It extends the shared `TreeDataItem`, so `id`,
`parentId`, and `label` come from there.

| Field           | Type                                                                         | Description                                                     |
| --------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `id`            | `string`                                                                     | Unique row id. Referenced by children via `parentId`.           |
| `parentId`      | `string \| null`                                                             | Parent row id, or `null` for a root row.                        |
| `label`         | `string`                                                                     | Text shown in the tree and used by search.                      |
| `etype`         | `'task' \| 'attempt' \| 'info' \| 'step'`                                    | Row category — handy for choosing an icon.                      |
| `icon`          | `'history' \| 'file-code' \| 'bot' \| 'check-circle' \| 'pause-circle'`      | Optional built-in icon hint.                                    |
| `startTime`     | `number`                                                                     | Bar start time, in seconds. Pair with `duration`.               |
| `duration`      | `number`                                                                     | Bar length, in seconds. Pair with `startTime`.                  |
| `time`          | `number`                                                                     | Instant-event time, in seconds. Renders a dot instead of a bar. |
| `createTime`    | `number`                                                                     | Optional creation timestamp metadata.                           |
| `color`         | `'blue' \| 'green' \| 'orange' \| 'gray-light' \| 'gray-medium' \| 'purple'` | Bar / dot tone.                                                 |
| `isCollapsible` | `boolean`                                                                    | Whether the row can be collapsed in the tree.                   |
| `hasStripes`    | `boolean`                                                                    | Render the bar with a striped fill.                             |
| `isHaltedStep`  | `boolean`                                                                    | Mark a row as a halted step (e.g. error / rate-limit stop).     |
