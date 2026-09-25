# BreadcrumbTree

A breadcrumb-style picker that opens a hierarchy panel anchored to the
breadcrumb. The panel floats above any clipping ancestor and offers two
layouts, switched by a toggle in its bottom-right corner. Children are fetched
on demand with pagination and results are reused when you revisit a node.

## Demo

Click the chevron to open the panel. Drill into nodes by clicking rows. Click a
breadcrumb item to navigate back (the panel closes). The toggle in the panel's
bottom-right switches layouts, and rows can be dragged between parents.

## Layouts

|  | `columns` (default) | `tree` |
| --- | --- | --- |
| Shape | one column per level of `path` | the whole expanded tree, wrapped into columns |
| A column means | a level of the hierarchy | only "what did not fit in the one before" |
| Shows at once | exactly one root→leaf path | as many open branches as fit |
| Auto-scroll | follows `path` to the newest column | none — it stays where you left it |

**`columns`** is Finder's Miller-column browser. Depth is the only axis, so it
answers "what is inside this?" precisely and cannot show two branches side by
side — opening one collapses the other out of view.

**`tree`** flattens everything expanded into one top-to-bottom flow and lets it
wrap when it reaches the panel's height. Breadth survives: several branches
stay on screen together. The price is that a column carries no meaning, so a
parent and its children routinely land in different ones. Two things pay that
back — the guidelines, which every row draws from its own ancestry so depth
survives a column break, and the ancestor trail, which marks a hovered row's
ancestors wherever they have ended up.

Both scroll horizontally and never vertically; in the wrapped tree a plain
vertical wheel is mapped to horizontal scroll, since there is nothing else it
could mean.

The layout is uncontrolled by default — `defaultView` picks what the panel
opens in, and the toggle takes it from there. Pass `view` with `onViewChange`
to drive it from outside (to persist the choice per user, say), or
`hideViewToggle` to remove the control and offer the switch elsewhere.

## Dragging rows

Pass `dnd` and rows become draggable between parents. Holding a drag over a row
springs it open after `springDelayMs`, so a node can be walked across to a
branch that was not visible when the drag started — in `columns` that is the
only way to reach one, since the panel shows a single path at a time.

**The tree moves the row before the host is called, and never refetches to
confirm it.** A re-parent is one splice and one push, and the panel already
holds everything needed to apply it: the node leaves its old parent, joins the
new one, and its whole subtree is re-keyed in place — so a branch that was
expanded before the drag is still expanded, and still populated, afterwards.
Refetching to learn the same thing is what made the panel blink and collapse
back to its unexpanded state on every drag, a far larger event on screen than
the one row that actually changed.

So `onMove` reports failure by returning a promise that **rejects**, and the
tree puts the row back. Resolving means it stuck — there is no need to bump
`refreshToken` to confirm a move, and doing so only spends a round of fetches
redrawing what is already on screen. `refreshToken` stays for changes the tree
cannot derive on its own, such as a delete or a rename.

Self-drops, drops into the dragged node's own subtree, and no-op drops are
refused before `canDrop` is consulted.

## rootPath and fetchChildren

When `rootPath` is provided (e.g. `"my-project"`), the component prepends it to
every `fetchChildren` call:

| Column depth | `path` argument to `fetchChildren` |
| --- | --- |
| Root | `"my-project"` |
| After selecting "datasets" | `"my-project/datasets"` |
| After selecting "droid-2024" | `"my-project/datasets/droid-2024"` |

Without `rootPath`, the root call uses `""` (empty string) and sub-calls use
`"datasets"`, `"datasets/droid-2024"`, etc.

Results are reused when you drill into the same node twice, so revisiting a
folder does not trigger a second request.

## Pagination

Each column loads its first page on open. Scrolling to the bottom of a column
loads the next page automatically.

## Floating panel

The panel floats above the content, so it is not clipped by `overflow: hidden`,
`transform`, or sticky containers. It tracks the trigger as the page scrolls or
resizes.

> **Controlled path** — `BreadcrumbTree` is fully controlled. Row clicks call
> `onNavigate(node, newPath)`; the caller updates `path`. The panel stays open
> after a row click and closes when a breadcrumb item is clicked.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `path` | `BreadcrumbNode[]` | — | Controlled path from root to the selected node. Empty array = root. |
| `onNavigate` | `(node, newPath) => void` | — | Fires on row click (panel stays open) and breadcrumb click (panel closes). Update `path` here. |
| `fetchChildren` | `(path, page, limit) => Promise<FetchChildrenResult>` | — | Async loader. `path` is slash-separated. Prepended with `rootPath` when set. |
| `rootPath` | `string` | — | Root prefix shown as the first breadcrumb item. |
| `renderEmpty` | `(parentNode) => ReactNode` | `"No items"` | Custom empty-state per column. Receives the parent node (`null` at root). |
| `refreshKey` | `number` | `0` | Increment to re-fetch the deepest visible column. |
| `refreshToken` | `number` | `0` | Increment to drop the whole cache after a host mutation (delete/rename). Open columns re-fetch immediately; otherwise they re-fetch fresh on next open. |
| `placeholder` | `string` | `"Select folder"` | Shown when `path` is empty and `rootPath` is unset. |
| `dnd` | `BreadcrumbDragAndDrop` | — | Opt in to dragging rows between parents. Omit and no drag listeners are attached. |
| `view` | `"columns" \| "tree"` | — | Controls the layout. Omit to leave it uncontrolled. |
| `defaultView` | `"columns" \| "tree"` | `"columns"` | Layout the panel opens in when `view` is not supplied. |
| `onViewChange` | `(view) => void` | — | Fires whichever way the layout is changed. |
| `hideViewToggle` | `boolean` | `false` | Drop the in-panel toggle. |
| `className` | `string` | — | Extra classes on the wrapper. |

### Types

```ts
interface BreadcrumbNode {
  id: string
  name: string
  displayName?: string // visible breadcrumb label; name stays the path key
  icon?: ReactNode // tree-row glyph; defaults to a folder
  /** When false, hides the chevron — signals no sub-children exist. */
  hasChildren?: boolean
}

interface FetchChildrenResult {
  items: BreadcrumbNode[]
  totalPages: number
}

type BreadcrumbView = 'columns' | 'tree'

interface BreadcrumbDragAndDrop {
  /** Reject to say the move failed; the tree puts the row back. */
  onMove: (move: BreadcrumbMove) => void | Promise<void>
  /** Host veto, on top of the built-in self/descendant/no-op guards. */
  canDrop?: (source: BreadcrumbNode, target: BreadcrumbDropTarget) => boolean
  /** Dwell before a hovered row springs open mid-drag. Default 500ms. */
  springDelayMs?: number
}

interface BreadcrumbMove {
  source: BreadcrumbNode
  /** Parent it is leaving; `null` = the root. */
  from: BreadcrumbNode | null
  /** Root→`from`, the mirror of `to.parentPath`. */
  fromPath: BreadcrumbNode[]
  to: BreadcrumbDropTarget
}

interface BreadcrumbDropTarget {
  /** Node it lands inside; `null` = the root. */
  parent: BreadcrumbNode | null
  /** Root→parent, so the host can rebuild a path key. */
  parentPath: BreadcrumbNode[]
  /** `"into"` = dropped on a row, `"level"` = dropped on empty space.
   *  There is no ordering in this model, so neither carries an index. */
  kind: 'into' | 'level'
}

// Per-column state, also exported for callers that inspect column status.
interface ColumnData {
  items: BreadcrumbNode[]
  page: number
  totalPages: number
  hasMore: boolean
  loading: boolean
  error: Error | null
}
```
