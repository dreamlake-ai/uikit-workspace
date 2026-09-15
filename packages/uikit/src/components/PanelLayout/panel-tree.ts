// ---------------------------------------------------------------------------
// panel-tree.ts — the PURE tiling-tree model behind <PanelLayout>.
//
// A recursive n-ary tree of panels:
//
//  • A `leaf` is a single panel.
//  • A `split` lays its children out in one direction (`row` = side by side,
//    `column` = stacked) and stores each child's size as a percentage.
//  • A `group` is a flat TAB BAR of leaves — freely-movable tabs sharing one
//    region. Only its `activeId` child renders; nesting stays `split`'s job.
//
// The tree logic lives here (React-free, DOM-free, SSR-safe) so the mutators +
// migration are unit-testable with NO renderer; `PanelLayout.tsx` imports these
// and owns only the React render + pointer/keyboard wiring.
//
// VIEW-AGNOSTIC BY CONSTRUCTION: nothing in this file knows what a `view` string
// means. Every policy decision a host might want (which views may share a tab
// group, which view absorbs freed space on close) is injected by the caller as a
// predicate or an option. See `applyAddTab`'s `canTab` and `applyClose`'s
// `primaryView`.
// ---------------------------------------------------------------------------

export type Dir = 'row' | 'column'

export type LeafNode = {
  kind: 'leaf'
  id: string
  n: number
  view?: string
  title?: string
  contentMax?: number
  /** Owner scope — an OPTIONAL host-defined lifetime tag, in the host's own
   *  vocabulary. A host that persists only part of its layout (app-wide chrome
   *  stays global while a per-document subtree is saved per document) stamps it
   *  here; a hand-pinned value wins over anything the host derives from `view`.
   *  The tree itself never reads this field — see `panel-scope.ts`. */
  ownerScope?: string
  /** Per-leaf INSTANCE id: lets a tabbable view appear more than once (each
   *  instance is a distinct leaf). `normalizeTree` backfills it to `id` so legacy
   *  trees round-trip; SINGLETON views keep the one-per-view invariant via
   *  `findLeafByView`. */
  instanceId?: string
}

export type PanelNode =
  | LeafNode
  | { kind: 'split'; id: string; dir: Dir; children: PanelNode[]; sizes: number[] }
  // NEW — a flat tab bar of leaves; `activeId` names the visible tab.
  | { kind: 'group'; id: string; children: LeafNode[]; activeId: string }

/** Persisted-layout schema version. Bumped to 2 for the group node + the
 *  `{v,root}` envelope. `normalizeTree` accepts BOTH the envelope and a bare
 *  legacy tree, so old persisted trees still load. */
export const LAYOUT_SCHEMA_VERSION = 2

const MIN_PX = 120 // smallest a panel may be dragged to
const MAX_NEW_PANEL_PX = 420 // cap for newly created panels (row splits)
export { MIN_PX, MAX_NEW_PANEL_PX }

// ---------------------------------------------------------------------------
// Id / label counters
// ---------------------------------------------------------------------------

// Unique tree ids start past the initial leaf-1..3 so SSR and client agree on
// the initial tree (no hydration id mismatch). Display numbers track separately
// so freshly split panels read 4, 5, 6… rather than the raw id counter.
let ID_SEQ = 100
let LABEL_SEQ = 3
export const nextId = () => `n-${++ID_SEQ}`

// Reseed the id/label counters above everything already in `tree`, so nodes
// minted after a workspace restore never collide with the restored ids.
export function reseedCounters(tree: PanelNode): void {
  let maxId = ID_SEQ
  let maxN = LABEL_SEQ
  const walk = (node: PanelNode) => {
    const m = /(\d+)$/.exec(node.id)
    if (m) maxId = Math.max(maxId, parseInt(m[1], 10))
    if (node.kind === 'leaf') maxN = Math.max(maxN, node.n)
    else node.children.forEach(walk)
  }
  walk(tree)
  ID_SEQ = maxId
  LABEL_SEQ = maxN
}

export const makeLeaf = (view?: string, title?: string, contentMax?: number): LeafNode => {
  const id = nextId()
  return {
    kind: 'leaf',
    id,
    n: ++LABEL_SEQ,
    view,
    title,
    contentMax,
    instanceId: id,
  }
}

// Builders for composing a custom initial tree (e.g. an IDE-shaped layout).
// `view`/`title` tag a leaf so the host's renderBody can dispatch on it. Call
// these inside a builder passed to PanelLayout's `initial` prop, never at module
// scope: the id counters below are module state, so building a tree on the
// server and again on the client would mint different ids and mismatch hydration.
export function panelLeaf(opts: { view?: string; title?: string; contentMax?: number } = {}): LeafNode {
  return makeLeaf(opts.view, opts.title, opts.contentMax)
}
export function panelSplit(dir: 'row' | 'column', children: PanelNode[], sizes?: number[]): PanelNode {
  return { kind: 'split', id: nextId(), dir, children, sizes: sizes ?? children.map(() => 100 / children.length) }
}
/** A tab group over `children`, with `activeIndex` showing. Groups otherwise
 *  only ever arise from a user's centre-drop, so this is how a host SEEDS a
 *  layout that already has tabs. A group of one is pointless — it collapses to
 *  a bare leaf, matching what `normalizeGroup` would do to it on the way in. */
export function panelGroup(children: LeafNode[], activeIndex = 0): PanelNode {
  if (children.length === 0) return makeLeaf()
  if (children.length === 1) return children[0]
  const active = children[activeIndex] ?? children[0]
  return { kind: 'group', id: nextId(), children, activeId: active.id }
}

/** Initial layout. `single` → one panel (what an app with a single primary
 *  surface wants); otherwise the 3-panel demo (one left, two stacked right). */
export function buildInitial(single = false): PanelNode {
  // LABEL_SEQ only ever climbs. It used to be ASSIGNED here (1 or 3) so that the
  // next panel after a rebuild read "Panel 4" — but the counter is module-wide
  // while this tree is not. Mounting a second layout rewound it under the first
  // one, which then minted an `n` it had already used: two panels in the SAME
  // tree labelled "Panel 4", in the same tint. Monotonic numbering costs a
  // cosmetically higher number after a reset and is worth it.
  if (single) {
    LABEL_SEQ = Math.max(LABEL_SEQ, 1)
    return { kind: 'leaf', id: 'leaf-1', n: 1, instanceId: 'leaf-1' }
  }
  LABEL_SEQ = Math.max(LABEL_SEQ, 3)
  return {
    kind: 'split',
    id: 'split-root',
    dir: 'row',
    sizes: [50, 50],
    children: [
      { kind: 'leaf', id: 'leaf-1', n: 1, instanceId: 'leaf-1' },
      {
        kind: 'split',
        id: 'split-2',
        dir: 'column',
        sizes: [50, 50],
        children: [
          { kind: 'leaf', id: 'leaf-2', n: 2, instanceId: 'leaf-2' },
          { kind: 'leaf', id: 'leaf-3', n: 3, instanceId: 'leaf-3' },
        ],
      },
    ],
  }
}

// ---------------------------------------------------------------------------
// Migration / normalization
// ---------------------------------------------------------------------------

/** Normalize one `group` node: clamp a stale `activeId` to the first child, drop
 *  an empty group (→ null), and collapse a 1-child group back to a bare leaf so a
 *  legacy round-trip stays leaf-shaped (a group of one is never persisted). */
export function normalizeGroup(node: Extract<PanelNode, { kind: 'group' }>): PanelNode | null {
  const children = node.children.map(normalizeLeaf)
  if (children.length === 0) return null
  if (children.length === 1) return children[0]
  const activeId = children.some((c) => c.id === node.activeId) ? node.activeId : children[0].id
  return { ...node, children, activeId }
}

function normalizeLeaf(leaf: LeafNode): LeafNode {
  // Backfill the additive instanceId (defaults to the leaf's id) so a legacy leaf
  // gains a stable instance handle without changing its structure.
  return leaf.instanceId ? leaf : { ...leaf, instanceId: leaf.id }
}

/**
 * Migrate a parsed tree to the current schema. IDENTITY on `leaf`/`split` except
 * backfilling `instanceId ??= id` on every leaf; on `group`, run `normalizeGroup`.
 * NEVER synthesizes a group — grouping happens only on an explicit user tab-merge.
 * A legacy leaf/split-only tree is returned structurally identical (bar the
 * instanceId backfill). Idempotent.
 */
export function normalizeTree(node: PanelNode): PanelNode {
  if (node.kind === 'leaf') return normalizeLeaf(node)
  if (node.kind === 'group') {
    const g = normalizeGroup(node)
    // A group can only appear at a spot a subtree may live; if it emptied out
    // (shouldn't happen post-parse), fall back to a fresh leaf so the tree stays
    // renderable rather than returning null up an arbitrary arm.
    return g ?? makeLeaf()
  }
  return { ...node, children: node.children.map(normalizeTree) }
}

/**
 * Unwrap the persisted `{ v, root }` envelope (schema v2+) OR a bare legacy tree,
 * returning the raw root (still un-normalized). A blob that is neither is returned
 * as-is so the caller's shape guards handle it.
 */
export function unwrapLayout(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && 'root' in (raw as Record<string, unknown>)) {
    return (raw as { root: unknown }).root
  }
  return raw
}

/** Wrap a tree in the versioned persistence envelope. */
export function wrapLayout(root: PanelNode): { v: number; root: PanelNode } {
  return { v: LAYOUT_SCHEMA_VERSION, root }
}

// ---------------------------------------------------------------------------
// Mutators (pure)
// ---------------------------------------------------------------------------

/** Split the leaf `targetId` along `dir`. Appends as a sibling when the parent
 *  already runs in that direction, otherwise wraps the leaf in a new split. When
 *  the target leaf lives INSIDE a group, it is first extracted out of that group
 *  (a split can't live under a group), then split at the group's slot. */
export function applySplit(node: PanelNode, targetId: string, dir: Dir, seed?: LeafNode, before = false, newFraction = 0.5): { node: PanelNode; newId: string | null } {
  const f = Math.max(0.1, Math.min(0.9, newFraction))
  if (node.kind === 'leaf') {
    if (node.id !== targetId) return { node, newId: null }
    const fresh = seed ?? makeLeaf()
    const newSz = f * 100
    const oldSz = (1 - f) * 100
    return {
      node: { kind: 'split', id: nextId(), dir, children: before ? [fresh, node] : [node, fresh], sizes: before ? [newSz, oldSz] : [oldSz, newSz] },
      newId: fresh.id,
    }
  }

  // A group that owns the target: pull the target leaf out (collapsing the group
  // if it drops to one child), then split the group's remaining slot in-place.
  if (node.kind === 'group') {
    if (!node.children.some((c) => c.id === targetId)) return { node, newId: null }
    const target = node.children.find((c) => c.id === targetId)!
    const remaining = normalizeGroup({ ...node, children: node.children.filter((c) => c.id !== targetId) })
    const fresh = seed ?? makeLeaf()
    const newSz = f * 100
    const oldSz = (1 - f) * 100
    // Split the target leaf itself against the fresh panel; if a group remains it
    // becomes a sibling next to that split so nothing is lost. Common case (a lone
    // tabbable leaf) collapses to a plain split — byte-identical to a leaf split.
    const splitTarget: PanelNode = {
      kind: 'split',
      id: nextId(),
      dir,
      children: before ? [fresh, target] : [target, fresh],
      sizes: before ? [newSz, oldSz] : [oldSz, newSz],
    }
    if (!remaining) return { node: splitTarget, newId: fresh.id }
    return {
      node: { kind: 'split', id: nextId(), dir: 'row', children: [remaining, splitTarget], sizes: [50, 50] },
      newId: fresh.id,
    }
  }

  // Append in-place when a direct leaf child matches and the axis lines up.
  const idx = node.children.findIndex((c) => c.kind === 'leaf' && c.id === targetId)
  if (idx >= 0 && node.dir === dir) {
    const fresh = seed ?? makeLeaf()
    const children = node.children.slice()
    const sizes = node.sizes.slice()
    const newPanelSz = sizes[idx] * f
    sizes[idx] = sizes[idx] * (1 - f)
    const at = before ? idx : idx + 1
    children.splice(at, 0, fresh)
    sizes.splice(at, 0, newPanelSz)
    return { node: { ...node, children, sizes }, newId: fresh.id }
  }

  // Otherwise recurse, stopping at the first branch that consumes the target.
  let newId: string | null = null
  const children = node.children.map((c) => {
    if (newId) return c
    const r = applySplit(c, targetId, dir, seed, before, f)
    if (r.newId) newId = r.newId
    return r.node
  })
  return { node: { ...node, children }, newId }
}

/** Remove a leaf, collapsing any split left with a single child. A leaf living
 *  inside a group is dropped from that group (re-pointing `activeId`, collapsing
 *  a 1-child group to a bare leaf). Returns null if the subtree empties out.
 *
 *  `primaryView` (optional) names the app's PRIMARY view — the one an auxiliary
 *  panel was opened alongside. When a leaf carrying it is a direct sibling of the
 *  slot being freed, the whole freed share is handed to that leaf, so the primary
 *  column recovers its width symmetrically as auxiliary panels are dismissed one
 *  by one. Omitted (the default), every surviving sibling grows proportionally
 *  instead — the view-agnostic behaviour. Stays VIEW-AGNOSTIC either way: this
 *  file never decides WHICH view is primary, the caller names it. */
export function applyClose(node: PanelNode, targetId: string, primaryView?: string): PanelNode | null {
  if (node.kind === 'leaf') return node.id === targetId ? null : node

  if (node.kind === 'group') {
    if (!node.children.some((c) => c.id === targetId)) return node
    return normalizeGroup({ ...node, children: node.children.filter((c) => c.id !== targetId) })
  }

  const kept: PanelNode[] = []
  const keptSizes: number[] = []
  let freed = 0
  node.children.forEach((c, i) => {
    const r = applyClose(c, targetId, primaryView)
    if (r) {
      kept.push(r)
      keptSizes.push(node.sizes[i])
    } else {
      freed += node.sizes[i]
    }
  })
  if (kept.length === 0) return null
  if (kept.length === 1) return kept[0]

  const primaryIdx = primaryView == null
    ? -1
    : kept.findIndex((k) => k.kind === 'leaf' && k.view === primaryView)
  if (freed > 0 && primaryIdx >= 0) {
    const newSizes = keptSizes.slice()
    newSizes[primaryIdx] = newSizes[primaryIdx] + freed
    return { ...node, children: kept, sizes: newSizes }
  }

  const total = keptSizes.reduce((a, b) => a + b, 0) || 1
  return { ...node, children: kept, sizes: keptSizes.map((s) => (s / total) * 100) }
}

/** Set the two sizes either side of a divider inside split `splitId`. */
export function applyResize(node: PanelNode, splitId: string, index: number, a: number, b: number): PanelNode {
  if (node.kind === 'leaf') return node
  if (node.kind === 'group') return node
  if (node.id === splitId) {
    const sizes = node.sizes.slice()
    sizes[index] = a
    sizes[index + 1] = b
    return { ...node, sizes }
  }
  return { ...node, children: node.children.map((c) => applyResize(c, splitId, index, a, b)) }
}

export type DockSide = 'left' | 'right' | 'top' | 'bottom' | 'center'

/** Remove a leaf, returning the pruned tree plus the extracted node (so it can
 *  be re-docked). Reflow is kept *local*: the removed panel's slot is handed to
 *  its adjacent sibling only — every other panel keeps its exact size, and
 *  splits the change never touched are returned byte-for-byte. A split left with
 *  one child collapses, the survivor inheriting the whole slot. A leaf inside a
 *  group is pulled out of the group (which collapses/re-points per `normalizeGroup`). */
export function extractLeaf(node: PanelNode, id: string): { tree: PanelNode | null; taken: LeafNode | null } {
  if (node.kind === 'leaf') {
    return node.id === id ? { tree: null, taken: node } : { tree: node, taken: null }
  }
  if (node.kind === 'group') {
    const taken = node.children.find((c) => c.id === id) ?? null
    if (!taken) return { tree: node, taken: null }
    const remaining = normalizeGroup({ ...node, children: node.children.filter((c) => c.id !== id) })
    return { tree: remaining, taken }
  }
  let taken: LeafNode | null = null
  const kept: PanelNode[] = []
  const keptSizes: number[] = []
  let removedSize = 0
  let gapAt = -1 // index in `kept` where the removed child sat
  node.children.forEach((c, i) => {
    const r = extractLeaf(c, id)
    if (r.taken) taken = r.taken
    if (r.tree) {
      kept.push(r.tree)
      keptSizes.push(node.sizes[i])
    } else {
      // A direct child vanished (it was the removed leaf) — remember its slot.
      removedSize += node.sizes[i]
      gapAt = kept.length
    }
  })
  if (kept.length === 0) return { tree: null, taken }
  if (kept.length === 1) return { tree: kept[0], taken }
  // Hand the freed slot to the neighbor before the gap (or after, if it was
  // first). Other siblings are untouched, so nothing else in the tree reflows.
  if (removedSize > 0 && gapAt >= 0) {
    const neighbor = gapAt > 0 ? gapAt - 1 : 0
    keptSizes[neighbor] += removedSize
  }
  return { tree: { ...node, children: kept, sizes: keptSizes }, taken }
}

/** Insert `incoming` next to the leaf `targetId`, on the given side. Appends in
 *  place when the target's parent already runs in the needed direction, else
 *  wraps the target in a fresh split. */
export function insertBeside(node: PanelNode, targetId: string, incoming: PanelNode, side: Exclude<DockSide, 'center'>): PanelNode {
  const dir: Dir = side === 'left' || side === 'right' ? 'row' : 'column'
  const before = side === 'left' || side === 'top'

  if (node.kind === 'leaf') {
    if (node.id !== targetId) return node
    return {
      kind: 'split',
      id: nextId(),
      dir,
      children: before ? [incoming, node] : [node, incoming],
      sizes: [50, 50],
    }
  }

  if (node.kind === 'group') {
    // A group renders as one region; wrap the whole group in a split when a
    // panel docks against one of its tabs' edges.
    if (!node.children.some((c) => c.id === targetId)) return node
    return {
      kind: 'split',
      id: nextId(),
      dir,
      children: before ? [incoming, node] : [node, incoming],
      sizes: [50, 50],
    }
  }

  const idx = node.children.findIndex((c) => c.kind === 'leaf' && c.id === targetId)
  if (idx >= 0 && node.dir === dir) {
    const children = node.children.slice()
    const sizes = node.sizes.slice()
    const half = sizes[idx] / 2
    sizes[idx] = half
    const at = before ? idx : idx + 1
    children.splice(at, 0, incoming)
    sizes.splice(at, 0, half)
    return { ...node, children, sizes }
  }

  return { ...node, children: node.children.map((c) => insertBeside(c, targetId, incoming, side)) }
}

/** Dock the leaf `srcId` against the `targetId` panel on the given side:
 *  pull it out of its current spot, then re-insert it beside the target. A
 *  `center` side merges the source INTO the target's group/leaf as a new tab
 *  (see {@link applyAddTab}).
 *
 *  `canTab` is an optional belt-and-suspenders predicate: when a PROGRAMMATIC
 *  `center` dock names a SINGLETON view (one the interaction layer would never
 *  have offered `center` for), the merge degrades gracefully to a right-edge
 *  dock instead of grouping the singleton. The pointer-drag path already
 *  gates `center` up front (see `dockSideFromPoint`'s `allowCenter`), so this
 *  only bites the non-interactive callers. Stays VIEW-AGNOSTIC — the caller
 *  supplies the predicate; this file knows nothing about the allowlist. */
export function applyDock(
  node: PanelNode,
  srcId: string,
  targetId: string,
  side: DockSide,
  canTab?: (view: string | undefined) => boolean,
): PanelNode {
  if (srcId === targetId) return node
  if (side === 'center') return applyAddTab(node, srcId, targetId, canTab)
  const { tree, taken } = extractLeaf(node, srcId)
  if (!tree || !taken) return node
  return insertBeside(tree, targetId, taken, side)
}

/** Merge the leaf `srcId` INTO the group (or lone leaf) that owns `targetId` as a
 *  new TAB. Pulls the source out of its current slot, then either appends it into
 *  the target group, or — when the target is a bare leaf — promotes the target +
 *  the incoming into a fresh group (`activeId` = the incoming, so the just-dropped
 *  tab shows). The incoming keeps its identity; nothing else in the tree reflows.
 *  A no-op when either side is missing or the target isn't a leaf/group host.
 *
 *  `canTab` (optional) refuses the merge when EITHER the incoming or the target
 *  view is a singleton: the source falls back to a right-edge dock so a
 *  programmatic center-dock of a singleton stays split rather than grouped. When
 *  omitted, every view is tabbable (legacy behaviour). */
export function applyAddTab(
  node: PanelNode,
  srcId: string,
  targetId: string,
  canTab?: (view: string | undefined) => boolean,
): PanelNode {
  if (srcId === targetId) return node
  if (canTab) {
    const src = findLeaf(node, srcId)
    const tgt = findLeaf(node, targetId)
    if (src && tgt && (!canTab(src.view) || !canTab(tgt.view))) {
      // A singleton is involved — don't group it; degrade to an edge dock.
      return applyDock(node, srcId, targetId, 'right')
    }
  }
  const { tree, taken } = extractLeaf(node, srcId)
  if (!tree || !taken) return node
  const inserted = insertTab(tree, targetId, taken)
  return inserted ?? node
}

/** Append `incoming` into whatever hosts `targetId`. Returns null (no change)
 *  when the target isn't found — the caller falls back to the original tree. */
function insertTab(node: PanelNode, targetId: string, incoming: LeafNode): PanelNode | null {
  if (node.kind === 'leaf') {
    if (node.id !== targetId) return null
    // Promote the lone leaf + the incoming into a fresh group; the dropped tab
    // becomes active so it's the one shown.
    return { kind: 'group', id: nextId(), children: [node, incoming], activeId: incoming.id }
  }
  if (node.kind === 'group') {
    if (!node.children.some((c) => c.id === targetId)) return null
    return { ...node, children: [...node.children, incoming], activeId: incoming.id }
  }
  let changed = false
  const children = node.children.map((c) => {
    if (changed) return c
    const r = insertTab(c, targetId, incoming)
    if (r) { changed = true; return r }
    return c
  })
  return changed ? { ...node, children } : null
}

/** Set a group's active tab to `leafId`. No-op when the group/leaf isn't found. */
export function applyActivateTab(node: PanelNode, groupId: string, leafId: string): PanelNode {
  if (node.kind === 'leaf') return node
  if (node.kind === 'group') {
    if (node.id !== groupId) return node
    if (!node.children.some((c) => c.id === leafId)) return node
    return { ...node, activeId: leafId }
  }
  return { ...node, children: node.children.map((c) => applyActivateTab(c, groupId, leafId)) }
}

export function findLeaf(node: PanelNode, id: string): LeafNode | null {
  if (node.kind === 'leaf') return node.id === id ? node : null
  for (const c of node.children) {
    const r = findLeaf(c, id)
    if (r) return r
  }
  return null
}

export function findLeafByView(node: PanelNode, view: string): LeafNode | null {
  if (node.kind === 'leaf') return node.view === view ? node : null
  for (const c of node.children) {
    const r = findLeafByView(c, view)
    if (r) return r
  }
  return null
}

export function firstLeafId(node: PanelNode): string {
  if (node.kind === 'leaf') return node.id
  if (node.kind === 'group') return firstLeafId(node.children[0])
  return firstLeafId(node.children[0])
}

/** Which of the four edges the cursor is closest to — or `center` when the cursor
 *  sits in a small central zone (a center drop MERGES as a tab instead of docking
 *  to an edge).
 *
 *  `allowCenter=false` suppresses the central zone entirely — the cursor there
 *  falls through to its nearest edge instead of `center`. The interaction layer
 *  passes `false` when a SINGLETON is involved (the host's `isTabbable`
 *  predicate), so BOTH the live drag preview and the drop resolve to the SAME
 *  gated side and a singleton can never be tab-merged. This file stays
 *  VIEW-AGNOSTIC — it never inspects a view; the caller decides. */
export function dockSideFromPoint(rect: DOMRect | PanelRect, x: number, y: number, allowCenter = true): DockSide {
  const px = (x - rect.left) / rect.width
  const py = (y - rect.top) / rect.height
  // Central zone: within CENTER_FRACTION of the panel center on BOTH axes.
  const CENTER = 0.25
  if (allowCenter && Math.abs(px - 0.5) < CENTER && Math.abs(py - 0.5) < CENTER) return 'center'
  const dl = px
  const dr = 1 - px
  const dt = py
  const db = 1 - py
  const m = Math.min(dl, dr, dt, db)
  if (m === dl) return 'left'
  if (m === dr) return 'right'
  if (m === dt) return 'top'
  return 'bottom'
}

/** A viewport rect, in the `getBoundingClientRect()` shape this module needs.
 *  Named `PanelRect` rather than `Rect` because it is part of the kit's public
 *  API and a bare `Rect` is too generic there; `Rect` remains exported as an
 *  alias so code written against the original module keeps compiling. */
export type PanelRect = { left: number; top: number; width: number; height: number }
export type Rect = PanelRect

/** The viewport rect the dragged panel would occupy if dropped on `side` of the
 *  target — used to morph the floating surrogate to its future position. A
 *  `center` drop covers the whole target (it merges as a tab, not a half). */
export function dockRect(r: PanelRect, side: DockSide): PanelRect {
  switch (side) {
    case 'left':
      return { left: r.left, top: r.top, width: r.width / 2, height: r.height }
    case 'right':
      return { left: r.left + r.width / 2, top: r.top, width: r.width / 2, height: r.height }
    case 'top':
      return { left: r.left, top: r.top, width: r.width, height: r.height / 2 }
    case 'bottom':
      return { left: r.left, top: r.top + r.height / 2, width: r.width, height: r.height / 2 }
    case 'center':
      return { left: r.left, top: r.top, width: r.width, height: r.height }
  }
}
