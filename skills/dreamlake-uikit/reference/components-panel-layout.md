# PanelLayout

An IDE-style tiling workspace. Panels split, resize, drag onto each other's
edges to re-dock, and merge into tab groups — all over a recursive tree the
host can read, write, and persist.

It is **view-agnostic by construction**. A panel carries a `view` string that
only your `renderBody` / `renderHeader` interpret; the layout never reads it.
Everything a real app needs on top — which views may be tabbed, which one
reclaims space when a panel closes, which panels stay transparent — is injected
through props rather than inferred.

Three layers ship separately, and the lower two are useful on their own:

| Layer         | What it is                                                          |
| ------------- | ------------------------------------------------------------------- |
| `panel-tree`  | The pure tree — nodes, migration, mutators. No React, no DOM.       |
| `panel-box`   | Panel geometry as CSS math, published as `--panel-x` / `--panel-w`. |
| `PanelLayout` | The renderer plus the pointer and keyboard wiring.                  |

## Declarative requests and agent control

Use the [layout controller](reference/components-layout-controller.md) to address named destinations,
select panels by geometry or content, and apply pin-aware spawn requests. It provides
inspect → resolve → apply above these low-level mechanics, with forkable examples.

## Demo

Drag a divider to resize. Grab the **handle at the top of a panel header** and
drop it on another panel: near an edge it docks to that side, in the centre it
merges as a tab. `⌘D` splits the focused panel to the right, `⌘⇧D` below.
Escape cancels a drag in flight.

> **Note:** `PanelLayout` fills its container. Without an ancestor that has a real height it collapses to
>   nothing — the demos here sit in a fixed-height box.

## Tab groups

A `group` is a flat tab bar of panels sharing one region. By default, only the
active tab is mounted. Enable `tabbed` to keep each view mounted and connected
while switching tabs or docking it into another region. Groups normally arise from a user dropping one panel onto another's
centre, so `panelGroup` is how you seed a layout that already has tabs. A tab
can be dragged straight out of its group to dock elsewhere, and a group that
loses its second-to-last tab collapses back into a plain panel.

## Persistent editor and preview views

Use `tabbed` for editors, collaborative documents, and iframe previews that must
retain their own state when hidden or moved. Each leaf keeps one connected body;
inactive bodies are hidden. Closing a leaf disposes its body.

A singleton uses the same header row without an extra tab strip. Multiple views
show tabs beside the active view's header controls. Custom labels stay on one
line and clip when they reach those controls.

```tsx
<PanelLayout
  ref={layout}
  tabbed
  initial={() => panelGroup([panelLeaf({ view: 'editor', title: 'Draft' }), panelLeaf({ view: 'preview', title: 'Preview' })])}
  renderTab={(leaf) => <span>{leaf.title}</span>}
  renderHeader={(leaf) => <ViewActions viewId={leaf.id} />}
  renderBody={(leaf) => <ViewBody viewId={leaf.id} kind={leaf.view} />}
  onFocusedLeafChange={(leaf) => setActiveView(leaf.id)}
  onRequestClose={(id) => {
    if (canClose(id)) layout.current?.closeLeaf(id)
  }}
/>
```

`onRequestClose` delegates user close actions to the host. When supplied, the
host must call `closeLeaf` after its save/discard guard permits disposal.
`showSingleTab` can opt individual singleton leaves into tab presentation.
Calling `focusLeaf(id)` also activates that leaf when it belongs to a group.
Keep resource identity keyed by leaf ID; hiding or moving a view must not replace
its document or authorization context.

## Singletons

Some views should never be tabbed — a settings pane, a connection status, a
sessions list you want exactly one of. `isTabbable` marks them: the centre drop
zone is suppressed whenever either side of a merge is a singleton, so the live
drag preview and the actual drop always resolve to the same edge.

Drag **Settings** onto the editor's centre below — it docks to an edge instead
of merging. Drag Editor and Terminal onto each other and they tab.

## Panels that stay

A panel can be the SUBJECT of a screen rather than an auxiliary view — the note
you are reading, with reference panels beside it. Closing that one would leave
a window of satellites with nothing to orbit.

`closable` refuses it. The header's close button goes, a tab's × goes, and
Delete on that tab does nothing. It is a policy rather than a class hook
precisely because hiding the button is not enough: Delete never touches one, so
the refusal lives next to the close handler and the affordances just reflect it.

```tsx
<PanelLayout initial={initial} closable={(leaf) => leaf.view !== 'subject'} primaryView="subject" />
```

The imperative `closeLeaf` is deliberately NOT gated — a host taking a panel
away itself already knows its own policy, and would otherwise have to flip the
predicate first just to clean up after a route change.

## Filling the panels

`renderBody` and `renderHeader` are the only place a `view` string means
anything. A custom header replaces the default dot-and-title, but the drag
handle and close button stay — they are chrome the layout always owns.

`primaryView` names the panel that reclaims space: close `Terminal` below and
`Editor` absorbs the whole freed slot instead of every sibling growing a little.

## Driving it from code

The ref handle mutates the same tree the user does, and `onChange` reports every
mutation from either source.

## Persisting a layout

Save on `onChange`, restore in `initial`. `usePersistedPanelLayout` is both
halves, with the parts that are easy to get wrong already handled.

```tsx
const persisted = usePersistedPanelLayout({
  key: 'my-app:layout',
  fallback: () => panelSplit('row', [panelLeaf({ view: 'chat' }), panelLeaf({ view: 'files' })]),
  validate: (root) => hasView(root, 'chat'), // reject a saved tree missing the primary panel
})

<PanelLayout initial={persisted.initial} onChange={persisted.onChange} />
```

> **Warning:** Saved layouts are wrapped in a `{ v, root }` envelope, which has no top-level
>   `kind`. Shape-check the raw blob first and you reject every layout saved under
>   the current format — silently wiping the user's layout on upgrade.
>   `unwrapLayout` handles both the envelope and a bare tree from before it
>   existed; `normalizeTree` migrates whatever comes out.

| Option       | Type                          | Default        | Description                                          |
| ------------ | ----------------------------- | -------------- | ---------------------------------------------------- |
| `key`        | `string`                      | —              | Storage key. Namespace it per user or workspace.     |
| `fallback`   | `() => PanelNode`             | —              | Tree to use when nothing usable is saved.            |
| `storage`    | `Storage`                     | `localStorage` | Any `Storage` — e.g. `sessionStorage`.               |
| `validate`   | `(root) => boolean`           | —              | Last word on a restored tree, run _after_ migration. |
| `transform`  | `(root) => PanelNode \| null` | —              | Narrow what gets saved — pair with `scopeSubtree`.   |
| `debounceMs` | `number`                      | `150`          | Write coalescing window. `0` writes immediately.     |

Returns `{ initial, onChange, clear, reset }`. A pending write is flushed on
unmount and on `pagehide`, so the last drag of a session isn't lost.

> **Warning:** `initial` RESTORES a layout, so wiring the toolbar's Reset to it hands back the very layout the
>   user is clearing. `reset()` is the other half — it forgets the saved layout and returns the
>   fallback. Pass it as `resetTo`, or call it yourself and give the result to `replaceRoot`.

## Scoped layouts

"The layout is per-document and swaps when you switch documents" falls apart the
moment app-wide chrome shares the same tree: a connection panel or a settings
pane either duplicates into every document's saved layout, or vanishes when you
open a document whose layout predates it.

Give each panel an owner. `scopeSubtree` then extracts just the part one owner is
responsible for, and `tagOwnerScopes` stamps the scope into the tree before you
save it — so a later reader honours what was saved rather than re-deriving it
from a rule that has since changed.

```tsx
const scopeOf = (leaf) => (GLOBAL_VIEWS.has(leaf.view) ? 'global' : 'document')

usePersistedPanelLayout({
  key: `doc:${docId}:layout`,
  fallback: freshDocLayout,
  transform: (root) => scopeSubtree(root, 'document', scopeOf),
})
```

`pruneLeaves(node, keep)` is the primitive underneath, and is useful on its own
whenever you need to drop panels and be left with a tree that still renders: a
split keeps the sizes of its survivors (renormalized), a split down to one child
is replaced by that child, and a group collapses by the group's rules — a stale
active tab is re-clamped rather than left dangling.

## Opening a view

`resolveViewSplit` answers "where should this view open?" with no DOM and no side
effects, so the decision is testable on its own. It returns `{ skip: true }` when
the view is already open, which is what makes an open IDEMPOTENT — a deferred
open that re-runs after the panel exists is a no-op rather than a second copy.

```tsx
const plan = resolveViewSplit({
  root: panelRef.current?.getRoot() ?? null,
  view: 'diff',
  anchorView: 'editor', // open alongside the primary panel
  fallbackLeafId: firstLeafId,
  prefs, // remembered { dir, before, px } per view
  widthOf: (id) => measure(id),
})
if (!('skip' in plan)) {
  panelRef.current?.splitWith(plan.targetId, plan.dir, 'diff', 'Diff', plan.before, plan.fraction)
}
```

A remembered pixel width is converted to a fraction of the target's _current_
width, so a restored width behaves at any window size; an unmeasurable target
drops the fraction instead of dividing by zero.

## Keyboard and accessibility

| Where          | Keys                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------- |
| Any panel      | `⌘/Ctrl D` split right · `⌘/Ctrl ⇧D` split down (see `splitShortcut`)                             |
| Tab bar        | `←` `→` move between tabs (selection follows focus) · `Home` `End` first/last · `Delete` close    |
| Divider        | `←` `→` (or `↑` `↓`) nudge · `PageUp` `PageDown` coarse · `Home` `End` to the minimum either side |
| Drag in flight | `Escape` cancels                                                                                  |

The tab bar is a real `tablist`: tabs are `<button>`s carrying `aria-selected`
and `aria-controls`, the panel they control is the matching `tabpanel`, and the
strip is a single tab stop with focus roving inside it. Each divider is a
focusable `separator` reporting `aria-valuenow/min/max`, and the keyboard runs
through the same clamp as the pointer, so no key can push a panel below its
minimum.

> **Note:** Dragging a panel onto another's edge — or a tab out of its group — has no keyboard equivalent. The
>   split shortcut and the imperative handle cover creating and closing panels; rearranging them needs
>   a pointer.

## Panel geometry without measuring

Content inside a panel sometimes needs to know where that panel _is_ — a column
centered on the viewport rather than on its panel, a header that must line up
with the body beneath it. Measuring with a `ResizeObserver` is the obvious way
and the wrong one: the callback fires after layout and commits a frame late, so
during any animation that moves the panel the content chases an edge that has
already moved, and visibly shakes.

It never needs measuring. A panel's box is pure arithmetic over the panel area
and the split ratios above it, so each level hands its children a `calc()`-able
**expression**, which every leaf publishes as `--panel-x` and `--panel-w`. The
browser resolves it in the same layout pass as everything it depends on, every
frame, for free.

The contract is that the host declares `--panel-area-x` / `--panel-area-w` on
(or above) the element it mounts the layout into, as real lengths — typically a
`calc()` of the surrounding chrome, e.g. `100vw - var(--sidebar-w)`. Pass
`rootBox` to use different variable names. The demos on this page don't declare
them — nothing here reads `--panel-x`, so it stays inert.

## Server rendering

Node ids come from module-level counters, so a tree built during SSR and again
on the client will not agree. Mount the layout client-only, or hand it a tree
whose ids are fixed. For the same reason, build trees inside the `initial`
callback rather than at module scope.

Each layout scopes its DOM lookups to its own root, so several on one page stay
independent — a drag in one can never dock into another.

## Props

| Prop                       | Type                                      | Default             | Description                                                                                                                         |
| -------------------------- | ----------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `initial`                  | `() => PanelNode`                         | 3-panel demo        | Builds the initial tree. Called once, on mount.                                                                                     |
| `initialSingle`            | `boolean`                                 | `false`             | Without `initial`: `true` starts with one panel.                                                                                    |
| `root`                     | `PanelNode`                               | —                   | Controlled mode. The layout renders this and never mutates its own state; every change arrives via `onChange`.                      |
| `onChange`                 | `(root: PanelNode) => void`               | —                   | Fires on every tree mutation — split, close, resize, dock, reset. The hook for persistence.                                         |
| `onResize`                 | `(root: PanelNode) => void`               | —                   | Fires _only_ on a divider drag — the one signal that expresses "I want this panel at this size".                                    |
| `renderBody`               | `(leaf: LeafNode) => ReactNode`           | placeholder         | Renders a panel's content. Dispatch on `leaf.view`.                                                                                 |
| `renderHeader`             | `(leaf: LeafNode) => ReactNode`           | dot + title         | Replaces the header's centre content.                                                                                               |
| `isTabbable`               | `(view?: string) => boolean`              | every view          | Return `false` to make a view a singleton that can never be tab-merged.                                                             |
| `closable`                 | `(leaf: LeafNode) => boolean`             | every panel         | Return `false` to withhold a panel's close affordances _and_ refuse those closes. The handle's `closeLeaf` is not gated by it.      |
| `primaryView`              | `string`                                  | —                   | The view that absorbs a freed slot when a sibling closes. Default: every sibling grows proportionally.                              |
| `leafClassName`            | `(leaf: LeafNode) => string \| undefined` | —                   | Extra classes on a panel root. Appended, so `bg-transparent` overrides the default opaque fill.                                     |
| `headerClassName`          | `(leaf: LeafNode) => string \| undefined` | —                   | Extra classes on a panel header band. Appended.                                                                                     |
| `headerContentClassName`   | `(leaf: LeafNode) => string \| undefined` | `overflow-hidden`   | **Replaces** the overflow policy on the custom-header wrapper.                                                                      |
| `rootBox`                  | `PanelBox`                                | `--panel-area-x/-w` | The box the tree's root occupies, as CSS math.                                                                                      |
| `contentColumnHeaderClass` | `string`                                  | —                   | Class for the header of a panel that has both a custom header and a `contentMax` — the hook for a viewport-centered content column. |
| `palette`                  | `readonly string[]`                       | 8 tints             | Tints for placeholder panels and the drag surrogate.                                                                                |
| `splitShortcut`            | `false \| { key?: string }`               | `{ key: 'd' }`      | `⌘/Ctrl + key` splits the focused panel (`⇧` = vertical). `false` removes the binding.                                              |
| `showToolbar`              | `boolean`                                 | `false`             | Show the built-in toolbar (title, hints, Reset).                                                                                    |
| `toolbar`                  | `ReactNode`                               | —                   | Replace the toolbar's contents. Implies `showToolbar`.                                                                              |
| `resetTo`                  | `() => PanelNode`                         | `initial`           | What the toolbar's Reset builds. Point it at a _fresh_ tree whenever `initial` restores one.                                        |
| `className`                | `string`                                  | —                   | Extra classes on the root element.                                                                                                  |

## Handle

`ref` exposes the imperative API.

| Method                                                               | Description                                                                              |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `splitWith(leafId, dir, view?, title?, before?, size?, contentMax?)` | Split a panel, seeding the new one. `size` is auto-computed for row splits when omitted. |
| `getRoot()`                                                          | The current tree.                                                                        |
| `replaceRoot(tree)`                                                  | Swap the whole layout. Migrates the incoming tree and reseeds the id counters past it.   |
| `inspect()`                                                          | Every panel with its live pixel rect, walked from the DOM.                               |
| `closeLeaf(id)`                                                      | Close a panel. Closing the last one leaves a fresh blank panel.                          |
| `focusLeaf(id)`                                                      | Target keyboard splits at a panel. No-op for a dead id.                                  |

## Tree model

`panel-tree` is importable on its own — pure, DOM-free, and unit-testable. Every
mutator returns a new tree and never mutates the one it was handed.

Don't memoize on node identity, though. A mutator rebuilds every node along the
path it walks, so a subtree it changed nothing in still comes back as a new
object — and a split that lost no children is rebuilt all the same. Compare by
`id`, which survives a mutation, rather than by reference.

| Export                                                                                         | Description                                                                       |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `panelLeaf` · `panelSplit` · `panelGroup`                                                      | Builders for composing a tree.                                                    |
| `applySplit` · `applyClose` · `applyResize` · `applyDock` · `applyAddTab` · `applyActivateTab` | The mutators the UI drives.                                                       |
| `extractLeaf` · `insertBeside`                                                                 | Pull a panel out and put it back — what a dock is made of.                        |
| `findLeaf` · `findLeafByView` · `firstLeafId`                                                  | Queries.                                                                          |
| `normalizeTree` · `normalizeGroup` · `wrapLayout` · `unwrapLayout`                             | Migration and the persistence envelope.                                           |
| `dockSideFromPoint` · `dockRect`                                                               | Drag geometry: which edge a cursor is nearest, and the rect a drop would produce. |
| `reseedCounters`                                                                               | Lift the id counters past a restored tree so new nodes cannot collide.            |
