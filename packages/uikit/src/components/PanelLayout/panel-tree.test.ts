import { expect, it } from 'vitest'
import {
  applyActivateTab,
  applyAddTab,
  applyClose,
  applyDock,
  applyResize,
  applySplit,
  buildInitial,
  dockSideFromPoint,
  extractLeaf,
  findLeaf,
  findLeafByView,
  firstLeafId,
  makeLeaf,
  panelGroup,
  reseedCounters,
  type LeafNode,
  type PanelNode,
} from './panel-tree'

// A bare leaf helper (no id churn from makeLeaf) for structural assertions.
const leaf = (id: string, view?: string): LeafNode => ({ kind: 'leaf', id, n: 1, view, instanceId: id })
const split = (dir: 'row' | 'column', children: PanelNode[], sizes?: number[]): PanelNode => ({
  kind: 'split', id: `s-${children.map(c => c.id).join('')}`, dir, children,
  sizes: sizes ?? children.map(() => 100 / children.length),
})
const group = (activeId: string, ...children: LeafNode[]): PanelNode => ({ kind: 'group', id: 'g', children, activeId })

// ── current mutator surface (pinned BEFORE any group code path is exercised) ──

it('[panel-tree] applySplit L/R: wraps a leaf in a split with the seed', () => {
  const tree = leaf('a', 'chat')
  const seed = makeLeaf('editor', 'Editor')
  const { node, newId } = applySplit(tree, 'a', 'row', seed)
  expect(node.kind).toBe('split')
  expect(newId).toBe(seed.id)
  if (node.kind !== 'split') return
  expect(node.dir).toBe('row')
  expect(node.children.map(c => c.id)).toStrictEqual(['a', seed.id]) // old first, new right
})

it('[panel-tree] applySplit before=true puts the new panel first', () => {
  const seed = makeLeaf('editor')
  const { node } = applySplit(leaf('a'), 'a', 'row', seed, true)
  if (node.kind !== 'split') throw new Error('expected split')
  expect(node.children.map(c => c.id)).toStrictEqual([seed.id, 'a'])
})

it('[panel-tree] applySplit appends in-place when axis matches', () => {
  const tree = split('row', [leaf('a'), leaf('b')])
  const seed = makeLeaf('c')
  const { node } = applySplit(tree, 'a', 'row', seed)
  if (node.kind !== 'split') throw new Error('expected split')
  expect(node.children.map(c => c.id)).toStrictEqual(['a', seed.id, 'b'])
})

it('[panel-tree] applySplit survives a non-finite fraction instead of writing NaN sizes', () => {
  // A clamp is not a sanitizer — `Math.max(0.1, Math.min(0.9, NaN))` is NaN. A
  // caller measuring its own target divides by a width that can be zero, so a
  // NaN reaches this argument the same way it once reached `splitWith`. Every
  // size in the tree has to stay a real number.
  for (const bad of [NaN, Infinity, -Infinity]) {
    const { node } = applySplit(leaf('a'), 'a', 'row', makeLeaf(), false, bad)
    if (node.kind !== 'split') throw new Error('expected split')
    expect(node.sizes.every(Number.isFinite), `fraction ${bad}`).toBe(true)
    expect(node.sizes.reduce((x, y) => x + y, 0)).toBeCloseTo(100)
  }

  // The in-place-append branch writes sizes too, and reaches them by a
  // different route (scaling the target's existing size rather than 100).
  const { node: appended } = applySplit(split('row', [leaf('a'), leaf('b')]), 'a', 'row', makeLeaf(), false, NaN)
  if (appended.kind !== 'split') throw new Error('expected split')
  expect(appended.sizes.every(Number.isFinite)).toBe(true)
})

it('[panel-tree] applyClose collapses a single-child split to the survivor', () => {
  const tree = split('row', [leaf('a'), leaf('b')])
  const next = applyClose(tree, 'b')
  expect(next).toStrictEqual(leaf('a'))
})

it('[panel-tree] applyClose hands the freed share to the named primaryView sibling', () => {
  const tree = split('row', [leaf('chat', 'chat'), leaf('x'), leaf('y')], [50, 25, 25])
  const next = applyClose(tree, 'y', 'chat')
  if (!next || next.kind !== 'split') throw new Error('expected split')
  // chat absorbs y's 25 → 75; x keeps its 25.
  expect(next.sizes).toStrictEqual([75, 25])
})

it('[panel-tree] applyClose WITHOUT primaryView renormalizes proportionally', () => {
  // The view-agnostic default: no view is privileged, so the freed 25 is shared
  // between the survivors in proportion to the sizes they already had (2:1).
  const tree = split('row', [leaf('chat', 'chat'), leaf('x'), leaf('y')], [50, 25, 25])
  const next = applyClose(tree, 'y')
  if (!next || next.kind !== 'split') throw new Error('expected split')
  expect(next.sizes).toStrictEqual([(50 / 75) * 100, (25 / 75) * 100])
})

it('[panel-tree] applyClose primaryView that names no sibling falls back to proportional', () => {
  const tree = split('row', [leaf('a'), leaf('x'), leaf('y')], [50, 25, 25])
  const next = applyClose(tree, 'y', 'chat') // no leaf carries view 'chat'
  if (!next || next.kind !== 'split') throw new Error('expected split')
  expect(next.sizes).toStrictEqual([(50 / 75) * 100, (25 / 75) * 100])
})

it('[panel-tree] applyResize sets the two sizes either side of a divider', () => {
  const tree = split('row', [leaf('a'), leaf('b')], [50, 50])
  const next = applyResize(tree, tree.id, 0, 70, 30)
  if (next.kind !== 'split') throw new Error('expected split')
  expect(next.sizes).toStrictEqual([70, 30])
})

it('[panel-tree] applyDock re-docks a leaf beside the target (4 edges)', () => {
  for (const [side, expectDir, srcFirst] of [
    ['left', 'row', true], ['right', 'row', false], ['top', 'column', true], ['bottom', 'column', false],
  ] as const) {
    const tree = split('row', [leaf('a'), leaf('b'), leaf('c')])
    const next = applyDock(tree, 'a', 'b', side)
    // a is pulled out then re-inserted beside b; find the split holding a+b.
    const holder = findSplitWith(next, 'a', 'b')
    expect(holder, `${side}: a docked next to b`).toBeTruthy()
    if (!holder) continue
    expect(holder.dir).toBe(expectDir)
    const ids = holder.children.map(c => c.id)
    expect(ids.indexOf('a') < ids.indexOf('b'), `${side} order`).toBe(srcFirst)
  }
})

it('[panel-tree] extractLeaf hands the freed slot to the neighbor (local reflow)', () => {
  const tree = split('row', [leaf('a'), leaf('b'), leaf('c')], [30, 40, 30])
  const { tree: pruned, taken } = extractLeaf(tree, 'b')
  expect(taken?.id).toBe('b')
  if (!pruned || pruned.kind !== 'split') throw new Error('expected split')
  // b's 40 goes to its left neighbor a → [70, 30].
  expect(pruned.sizes).toStrictEqual([70, 30])
})

it('[panel-tree] reseedCounters lifts the id/label counters past a restored tree', () => {
  const restored = split('row', [{ kind: 'leaf', id: 'n-500', n: 42, instanceId: 'n-500' }, leaf('a')])
  reseedCounters(restored)
  const fresh = makeLeaf()
  const idNum = parseInt(/(\d+)$/.exec(fresh.id)![1], 10)
  expect(idNum, 'new id past the restored max').toBeGreaterThan(500)
  expect(fresh.n, 'new label past the restored max').toBeGreaterThan(42)
})

it('[panel-tree] buildInitial single is a lone leaf with instanceId', () => {
  const t = buildInitial(true)
  expect(t.kind).toBe('leaf')
  if (t.kind !== 'leaf') return
  expect(t.instanceId).toBe(t.id)
})

// ── group support ──────────────────────────────────────────────────────────

it('[panel-tree] applyAddTab: dock-center on a lone leaf promotes to a 2-tab group', () => {
  const tree = split('row', [leaf('a', 'chat'), leaf('b', 'editor')])
  const next = applyAddTab(tree, 'a', 'b')
  // a leaves its slot → b's slot becomes a group of [b, a] (a active).
  const g = findGroup(next)
  expect(g, 'a group was formed').toBeTruthy()
  if (!g) return
  expect(g.children.map(c => c.id)).toStrictEqual(['b', 'a'])
  expect(g.activeId, 'the dropped tab is active').toBe('a')
})

it('[panel-tree] applyAddTab: dock-center into an existing group appends a tab', () => {
  const tree = split('row', [group('b', leaf('b'), leaf('c')), leaf('a')])
  const next = applyAddTab(tree, 'a', 'b')
  const g = findGroup(next)
  if (!g) throw new Error('expected group')
  expect(g.children.map(c => c.id)).toStrictEqual(['b', 'c', 'a'])
  expect(g.activeId).toBe('a')
})

it('[panel-tree] applyClose drops a tab from a group, re-pointing activeId', () => {
  const tree = group('c', leaf('a'), leaf('b'), leaf('c'))
  const next = applyClose(tree, 'c')
  if (!next || next.kind !== 'group') throw new Error('expected group')
  expect(next.children.map(c => c.id)).toStrictEqual(['a', 'b'])
  expect(next.activeId, 'stale active re-pointed to the first child').toBe('a')
})

it('[panel-tree] applyClose collapses a 1-child group back to a bare leaf', () => {
  const tree = group('a', leaf('a'), leaf('b'))
  const next = applyClose(tree, 'b')
  expect(next).toStrictEqual(leaf('a'))
})

it('[panel-tree] applySplit on a grouped leaf extracts it, group collapses when it drops to one', () => {
  const tree = group('a', leaf('a', 'chat'), leaf('b', 'editor'))
  const seed = makeLeaf('terminal')
  const { node, newId } = applySplit(tree, 'a', 'row', seed)
  expect(newId).toBe(seed.id)
  // b was the only remaining child → group collapses to leaf b; a is split against seed.
  expect(findLeaf(node, 'a'), 'a survived').toBeTruthy()
  expect(findLeaf(node, 'b'), 'b survived (collapsed group)').toBeTruthy()
  expect(findLeaf(node, seed.id), 'seed added').toBeTruthy()
})

it('[panel-tree] applyActivateTab switches the visible tab; no-op for a bad id', () => {
  const tree = group('a', leaf('a'), leaf('b'))
  const next = applyActivateTab(tree, 'g', 'b')
  if (next.kind !== 'group') throw new Error('expected group')
  expect(next.activeId).toBe('b')
  expect(applyActivateTab(tree, 'g', 'zzz'), 'unknown leaf → same reference').toBe(tree)
})

it('[panel-tree] firstLeafId tolerates a group root', () => {
  const tree = group('b', leaf('a'), leaf('b'))
  expect(firstLeafId(tree)).toBe('a')
})

it('[panel-tree] findLeafByView finds a leaf inside a group', () => {
  const tree = split('row', [group('b', leaf('a', 'chat'), leaf('b', 'editor')), leaf('c')])
  expect(findLeafByView(tree, 'editor')?.id).toBe('b')
})

// ── dock-side zoning ─────────────────────────────────────────────────────────

it('[panel-tree] dockSideFromPoint: edges keep left/right/top/bottom, center is a small zone', () => {
  const rect = { left: 0, top: 0, width: 100, height: 100 }
  expect(dockSideFromPoint(rect, 5, 50)).toBe('left')
  expect(dockSideFromPoint(rect, 95, 50)).toBe('right')
  expect(dockSideFromPoint(rect, 50, 5)).toBe('top')
  expect(dockSideFromPoint(rect, 50, 95)).toBe('bottom')
  expect(dockSideFromPoint(rect, 50, 50)).toBe('center') // dead center
  // just outside the central zone (|.5-.3|=.2 < .25 on x, but y edge closer) still an edge
  expect(dockSideFromPoint(rect, 50, 10)).toBe('top')
})

it('[panel-tree] dockSideFromPoint: allowCenter=false never returns center (falls to nearest edge)', () => {
  const rect = { left: 0, top: 0, width: 100, height: 100 }
  // dead center with the central zone suppressed → nearest edge (ties break left→right→top→bottom).
  expect(dockSideFromPoint(rect, 50, 50, false), 'dead center falls to an edge, never center').toBe('left')
  // a point that WOULD be center defaults to its nearest edge instead (here the
  // right/top edges tie at .45; the min-scan checks right before top → 'right').
  expect(dockSideFromPoint(rect, 55, 45, false)).toBe('right')
  // edges are unchanged when center is disallowed.
  expect(dockSideFromPoint(rect, 5, 50, false)).toBe('left')
  expect(dockSideFromPoint(rect, 50, 95, false)).toBe('bottom')
})

it('[panel-tree] applyAddTab: canTab predicate refuses to group a singleton (degrades to edge dock)', () => {
  // sessions is a SINGLETON; chat is tabbable. A center-merge of the two must NOT
  // produce a group — it degrades to a right-edge dock so the singleton stays split.
  const canTab = (v: string | undefined) => v === 'chat' || v === 'editor'
  const tree = split('row', [leaf('a', 'sessions'), leaf('b', 'chat')])
  const next = applyAddTab(tree, 'a', 'b', canTab)
  expect(findGroup(next), 'no group formed for a singleton source').toBeNull()
  expect(findLeaf(next, 'a') && findLeaf(next, 'b'), 'both leaves survive as split panels').toBeTruthy()
})

it('[panel-tree] applyAddTab: canTab predicate refuses when the TARGET is a singleton', () => {
  const canTab = (v: string | undefined) => v === 'chat' || v === 'editor'
  const tree = split('row', [leaf('a', 'chat'), leaf('b', 'connection')])
  const next = applyAddTab(tree, 'a', 'b', canTab)
  expect(findGroup(next), 'no group formed when target is a singleton').toBeNull()
})

it('[panel-tree] applyAddTab: canTab predicate still groups two tabbable views', () => {
  const canTab = (v: string | undefined) => v === 'chat' || v === 'editor'
  const tree = split('row', [leaf('a', 'chat'), leaf('b', 'editor')])
  const next = applyAddTab(tree, 'a', 'b', canTab)
  const g = findGroup(next)
  expect(g, 'two tabbable views still group').toBeTruthy()
  if (g) expect(g.children.map(c => c.id)).toStrictEqual(['b', 'a'])
})

it('[panel-tree] applyDock center with a singleton predicate is a safe no-group fallback', () => {
  const canTab = (v: string | undefined) => v === 'chat' || v === 'editor'
  const tree = split('row', [leaf('a', 'machines'), leaf('b', 'chat')])
  const next = applyDock(tree, 'a', 'b', 'center', canTab)
  expect(findGroup(next), 'a programmatic center-dock of a singleton does not group').toBeNull()
})

it('[panel-tree] applyAddTab with NO predicate groups anything (the library default)', () => {
  // The kit ships view-agnostic: without a host-supplied `canTab`, every view is
  // tabbable. A host opts into singletons by passing the predicate.
  const tree = split('row', [leaf('a', 'sessions'), leaf('b', 'connection')])
  const g = findGroup(applyAddTab(tree, 'a', 'b'))
  expect(g, 'no predicate → the merge is allowed').toBeTruthy()
  if (g) expect(g.children.map(c => c.id)).toStrictEqual(['b', 'a'])
})

// ── helpers ──────────────────────────────────────────────────────────────────

function findSplitWith(node: PanelNode, a: string, b: string): Extract<PanelNode, { kind: 'split' }> | null {
  if (node.kind === 'leaf' || node.kind === 'group') return null
  const ids = node.children.filter(c => c.kind === 'leaf').map(c => c.id)
  if (ids.includes(a) && ids.includes(b)) return node
  for (const c of node.children) { const r = findSplitWith(c, a, b); if (r) return r }
  return null
}
function findGroup(node: PanelNode): Extract<PanelNode, { kind: 'group' }> | null {
  if (node.kind === 'group') return node
  if (node.kind === 'leaf') return null
  for (const c of node.children) { const r = findGroup(c); if (r) return r }
  return null
}

it('[panel-tree] panelGroup seeds a tab group; a group of one collapses to a leaf', () => {
  const a = makeLeaf('editor', 'A')
  const b = makeLeaf('editor', 'B')
  const g = panelGroup([a, b], 1)
  expect(g.kind).toBe('group')
  if (g.kind !== 'group') throw new Error('expected group')
  expect(g.activeId, 'activeIndex picks the visible tab').toBe(b.id)
  // Degenerate sizes collapse rather than producing an unrenderable group.
  expect(panelGroup([a]).kind).toBe('leaf')
  expect(panelGroup([]).kind).toBe('leaf')
  // An out-of-range index falls back to the first tab instead of undefined.
  expect((panelGroup([a, b], 9) as Extract<PanelNode, { kind: 'group' }>).activeId).toBe(a.id)
})
