# CollectionList

Folders, Bindrs and projects use the same row geometry: an 18px type icon,
truncated title, optional location, pin indicator, quiet metadata and a `…` menu.
`CollectionRowBody` also fits inside an existing link or selectable row, preserving
its navigation, selection, drag and preview behavior. DreamLake uses it in its
folder, Bindr and project list rows. The `…` action wrapper is transparent, so
hover and selection tints remain continuous across the row. Metadata yields to
visible actions without changing the row width; there is no page-colored patch
behind the button, including in dark mode.

## Contextual pins

Open a row's `…` menu and choose **Pin to top**. The same entry in the other
examples stays where it was: pins belong to a collection. **Unpin from top**
restores the ordinary sort position. Pinned rows appear once, in a drawer above
the ordinary contents. The drawer starts open and can be collapsed with its
header; a neutral Lucide-derived pin over three translucent paper sheets identifies
the group. An amber pin overlays a slightly smaller type icon on each pinned row. It is status, not another button, and leaves the title clear. This treatment is independent of node or resource type. Search still narrows the pinned entries. These examples keep state in
memory; the product persists collection pins on the server and applies them
before pagination, under the collection's write permissions.

### Pin badges across resource icons

Use the same badge for every type glyph. Toggling status preserves the title's
position; only the type glyph shrinks under its amber pin. The badge has no
background box and keeps its accessible “Pinned in this collection” label.

## Large lists

Use [ListDivider](/components/list-divider/) for labelled boundaries such as
Today and Yesterday. Dividers are never selectable or collapsible; keep them
outside the row selection array and keyboard navigation targets.

Use the existing `VirtualListFlow` for long lists, with the same row renderer.
Keep pagination, loading, errors, selection and data mutations in the host.
Do not merge separately paginated families or sort only the loaded pages to
implement pinning. Use `CollectionList` for a small list already in normal flow.

## Row slots

| Prop                 | Purpose                                                              |
| -------------------- | -------------------------------------------------------------------- |
| `icon`, `name`       | Type glyph and title. Long titles show their full text in a tooltip. |
| `nameText`           | Plain tooltip text when the title includes search highlights.        |
| `location`, `detail` | Inline location or secondary row content.                            |
| `meta`, `actions`    | Quiet timestamp or count and independent action targets.             |
| `pinned`             | Accessible “Pinned in this collection” indicator.                    |
| `prefix`, `badge`    | Optional leading control and trailing status.                        |

The host owns accessible names and keyboard selection. Action clicks and key
presses do not activate the row. Preserve native links for navigation and use
`useListSelection` for multi-selection. Keep the same row pattern at narrow
widths and in both themes; do not create a separate list per resource kind.

## Pinned drawer

Use `PinnedCollectionDrawer` before the ordinary contents and pass only pinned
rows as its children. It starts expanded (`defaultOpen=true`), supports controlled
`open` / `onOpenChange`, and uses the shared Collapsible for keyboard activation,
height animation and inert hidden content. Render it only when matching pins
exist. Reset expansion for a new collection and omit hidden rows from range
selection. Pass `count` to show the number of matching pinned rows currently shown,
including while collapsed. The count is also announced as the trigger description;
it updates with filtering, pinning and loading more. Omit it only when unknown.
Filtering and loading more stay with the host list.
`PinnedPlaneIcon` is also exported for other contextual pin affordances.

## Collection icons and motion

`FolderCollectionIcon` and `BindrCollectionIcon` use the upstream Lucide folder,
open-folder and folder-kanban paths with translucent fills. Hover or keyboard
focus activates a short 180ms transition; `open` holds the active state for an
expanded or selected collection. Folders crossfade to the open silhouette, Bindrs
lift slightly, and the pinned drawer uses a larger 28px canvas with three softly
rounded, translucent perspective sheets. Its neutral pin lifts diagonally out and
fades away when expanded, leaving the papers unobstructed. The sheets separate
and rotate on hover or keyboard focus, compress on press, and fan wider while
expanded. Expanded hover opens the fan a little further. Closing gathers the
papers and brings the pin back. Paper transforms take 240ms and the pin fades in
180ms; the fixed slot keeps the label still throughout the sequence.
Reduced-motion users get immediate state changes. For folder and Bindr icons, `size` defaults to 18 and
`strokeWidth` to 1.5; use a lighter stroke for large icons.
