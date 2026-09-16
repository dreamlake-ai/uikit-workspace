import { expect, it } from 'vitest'
import {
  LAYOUT_SCHEMA_VERSION,
  normalizeTree,
  reseedCounters,
  unwrapLayout,
  wrapLayout,
  firstLeafId,
  type LeafNode,
  type PanelNode,
} from './panel-tree'

// A LEGACY leaf (no instanceId) — what a layout persisted before the group node
// existed carries: old localStorage blobs, rows in a sync backend, files on disk.
const legacyLeaf = (id: string, view?: string): PanelNode =>
  ({ kind: 'leaf', id, n: 1, view } as unknown as PanelNode)
const split = (dir: 'row' | 'column', children: PanelNode[]): PanelNode =>
  ({ kind: 'split', id: `s`, dir, children, sizes: children.map(() => 100 / children.length) })

// Mirror a host's load path (unwrap + shape guard + normalize) so the migration is
// tested end-to-end without a renderer.
function loadLike(raw: unknown): PanelNode | null {
  const root = unwrapLayout(raw)
  if (!(root as PanelNode | null)?.kind) return null
  return normalizeTree(root as PanelNode)
}

it('[migrate] a stored { v, root } envelope loads back (NOT null) structurally identical', () => {
  const legacy = split('row', [legacyLeaf('chat', 'chat'), legacyLeaf('e', 'editor')])
  const stored = wrapLayout(legacy) // { v:2, root }
  const loaded = loadLike(JSON.parse(JSON.stringify(stored)))
  expect(loaded, 'envelope did not wipe the layout').toBeTruthy()
  if (!loaded || loaded.kind !== 'split') throw new Error('expected split')
  expect(loaded.children.length).toBe(2)
  // instanceId backfilled; everything else identical.
  expect((loaded.children[0] as LeafNode).instanceId).toBe('chat')
  expect(loaded.children[0].id).toBe('chat')
})

it('[migrate] a BARE legacy tree (no envelope) still loads', () => {
  const legacy = legacyLeaf('chat', 'chat')
  const loaded = loadLike(JSON.parse(JSON.stringify(legacy)))
  expect(loaded).toBeTruthy()
  expect(loaded?.kind).toBe('leaf')
  if (loaded?.kind === 'leaf') expect(loaded.instanceId).toBe('chat')
})

it('[migrate] replaceRoot-style: a legacy split-only tree gets instanceId on every leaf', () => {
  const legacy = split('row', [legacyLeaf('a', 'chat'), split('column', [legacyLeaf('b'), legacyLeaf('c')])])
  const migrated = normalizeTree(legacy)
  reseedCounters(migrated) // replaceRoot also reseeds; must not throw
  const ids: string[] = []
  const walk = (n: PanelNode) => {
    if (n.kind === 'leaf') { ids.push(n.id); expect(n.instanceId, `instanceId backfilled for ${n.id}`).toBe(n.id) }
    else n.children.forEach(walk)
  }
  walk(migrated)
  expect(ids.sort()).toStrictEqual(['a', 'b', 'c'])
  expect(firstLeafId(migrated), 'firstLeafId returns a leaf id').toBeTruthy()
})

it('[migrate] group add/close/collapse round-trips through normalize', () => {
  // A 2-tab group with a stale activeId → clamped to first child.
  const g: PanelNode = { kind: 'group', id: 'g', activeId: 'gone', children: [
    { kind: 'leaf', id: 'a', n: 1 } as LeafNode, { kind: 'leaf', id: 'b', n: 2 } as LeafNode,
  ] }
  const n = normalizeTree(g)
  expect(n.kind).toBe('group')
  if (n.kind === 'group') {
    expect(n.activeId, 'stale activeId clamped').toBe('a')
    expect(n.children[0].instanceId).toBe('a')
  }
  // A 1-child group collapses to a bare leaf.
  const one: PanelNode = { kind: 'group', id: 'g', activeId: 'a', children: [{ kind: 'leaf', id: 'a', n: 1 } as LeafNode] }
  const collapsed = normalizeTree(one)
  expect(collapsed.kind).toBe('leaf')
})

it('[migrate] normalizeTree is idempotent', () => {
  const legacy = split('row', [legacyLeaf('chat', 'chat'), {
    kind: 'group', id: 'g', activeId: 'x', children: [
      { kind: 'leaf', id: 'x', n: 2 } as LeafNode, { kind: 'leaf', id: 'y', n: 3 } as LeafNode,
    ],
  }])
  const once = normalizeTree(legacy)
  const twice = normalizeTree(JSON.parse(JSON.stringify(once)))
  expect(twice).toStrictEqual(once)
})

it('[migrate] LAYOUT_SCHEMA_VERSION is 2 and wrapLayout stamps it', () => {
  expect(LAYOUT_SCHEMA_VERSION).toBe(2)
  const w = wrapLayout(legacyLeaf('chat', 'chat'))
  expect(w.v).toBe(2)
  expect(w.root.kind).toBe('leaf')
})
