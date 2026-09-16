import { expect, it } from 'vitest'
import {
  hasLeafInScope,
  leafScope,
  pruneLeaves,
  scopeSubtree,
  tagOwnerScopes,
  type ScopeOf,
} from './panel-scope'
import type { LeafNode, PanelNode } from './panel-tree'

const leaf = (id: string, view?: string, ownerScope?: string): LeafNode => ({
  kind: 'leaf',
  id,
  n: 1,
  view,
  ownerScope,
  instanceId: id,
})
const split = (children: PanelNode[], sizes?: number[]): PanelNode => ({
  kind: 'split',
  id: `s-${children.map((c) => c.id).join('')}`,
  dir: 'row',
  children,
  sizes: sizes ?? children.map(() => 100 / children.length),
})
const group = (activeId: string, ...children: LeafNode[]): PanelNode => ({
  kind: 'group',
  id: 'g',
  children,
  activeId,
})

// A host's derivation rule: app-wide chrome is 'global', documents are 'repo',
// everything else travels with the open document.
const GLOBAL = new Set(['connection', 'machines', 'daemons'])
const REPO = new Set(['sessions', 'issues'])
const scopeOf: ScopeOf = (l) =>
  !l.view ? 'session' : GLOBAL.has(l.view) ? 'global' : REPO.has(l.view) ? 'repo' : 'session'

// ── pruneLeaves: the primitive ───────────────────────────────────────────────

it('[panel-scope] pruneLeaves keeps the sizes of surviving split children', () => {
  // The bug this pins: filtering `children` while leaving `sizes` at its original
  // length shifts every panel after the gap onto the wrong size.
  const tree = split([leaf('a'), leaf('b'), leaf('c')], [50, 30, 20])
  const out = pruneLeaves(tree, (l) => l.id !== 'b')
  if (!out || out.kind !== 'split') throw new Error('expected split')
  expect(out.children.map((c) => c.id)).toStrictEqual(['a', 'c'])
  expect(out.sizes.length, 'sizes stay aligned with children').toBe(2)
  // a's 50 and c's 20 renormalized to 100.
  expect(out.sizes).toStrictEqual([(50 / 70) * 100, (20 / 70) * 100])
})

it('[panel-scope] pruneLeaves flattens a split down to one child, and empties to null', () => {
  const tree = split([leaf('a'), leaf('b')])
  expect(pruneLeaves(tree, (l) => l.id === 'a')).toStrictEqual(leaf('a'))
  expect(pruneLeaves(tree, () => false)).toBeNull()
})

it('[panel-scope] pruneLeaves returns the SAME group when nothing is dropped', () => {
  const tree = group('a', leaf('a'), leaf('b'))
  expect(pruneLeaves(tree, () => true)).toBe(tree)
})

it('[panel-scope] pruneLeaves collapses a group by GROUP rules, never leaving a dangling activeId', () => {
  // Dropping the ACTIVE tab must re-clamp activeId — the split rule would leave
  // it pointing at a tab that is no longer in the group.
  const tree = group('b', leaf('a'), leaf('b'), leaf('c'))
  const out = pruneLeaves(tree, (l) => l.id !== 'b')
  if (!out || out.kind !== 'group') throw new Error('expected group')
  expect(out.children.map((c) => c.id)).toStrictEqual(['a', 'c'])
  expect(out.children.some((c) => c.id === out.activeId), 'activeId names a kept tab').toBe(true)
  // A group down to one tab is a bare leaf, not a group of one.
  expect(pruneLeaves(tree, (l) => l.id === 'a')).toStrictEqual(leaf('a'))
})

// ── the scope layer ──────────────────────────────────────────────────────────

it('[panel-scope] leafScope: an explicit ownerScope overrides the derived one', () => {
  expect(leafScope(leaf('a', 'connection'), scopeOf)).toBe('global')
  expect(leafScope(leaf('a', 'connection', 'session'), scopeOf), 'hand-pinned wins').toBe('session')
  expect(leafScope(leaf('a', 'connection')), 'no rule, no tag → unscoped').toBeUndefined()
})

it('[panel-scope] scopeSubtree keeps only the named scope and flattens what collapses', () => {
  const tree = split([leaf('chat', 'chat'), leaf('conn', 'connection'), leaf('list', 'sessions')])
  expect(scopeSubtree(tree, 'session', scopeOf)).toStrictEqual(leaf('chat', 'chat'))
  expect(scopeSubtree(tree, 'global', scopeOf)).toStrictEqual(leaf('conn', 'connection'))
})

it('[panel-scope] scopeSubtree keeps a multi-leaf subtree and lifts the collapsed split', () => {
  const tree = split([
    leaf('conn', 'connection'), // global → dropped
    split([leaf('chat', 'chat'), leaf('preview', 'preview')]), // both session → kept
  ])
  const sub = scopeSubtree(tree, 'session', scopeOf)
  if (sub?.kind !== 'split') throw new Error('expected split')
  expect(sub.children.map((c) => c.id)).toStrictEqual(['chat', 'preview'])
})

it('[panel-scope] scopeSubtree returns null when the scope owns nothing', () => {
  const tree = split([leaf('conn', 'connection'), leaf('list', 'sessions')])
  expect(scopeSubtree(tree, 'session', scopeOf), 'nothing to persist for that owner').toBeNull()
  expect(hasLeafInScope(tree, 'session', scopeOf)).toBe(false)
})

it('[panel-scope] hasLeafInScope finds nested content', () => {
  const tree = split([leaf('conn', 'connection'), split([leaf('chat', 'chat'), leaf('x', 'diff')])])
  expect(hasLeafInScope(tree, 'session', scopeOf)).toBe(true)
  expect(hasLeafInScope(tree, 'repo', scopeOf)).toBe(false)
})

it('[panel-scope] scopeSubtree on a group keeps the in-scope tabs and re-clamps activeId', () => {
  const tree = group('conn', leaf('chat', 'chat'), leaf('preview', 'preview'), leaf('conn', 'connection'))
  const sub = scopeSubtree(tree, 'session', scopeOf)
  if (sub?.kind !== 'group') throw new Error('expected group')
  expect(sub.children.map((c) => c.id)).toStrictEqual(['chat', 'preview'])
  expect(sub.children.some((c) => c.id === sub.activeId)).toBe(true)
})

it('[panel-scope] tagOwnerScopes stamps every leaf, inside groups too', () => {
  const tagged = tagOwnerScopes(split([leaf('chat', 'chat'), leaf('conn', 'connection')]), scopeOf)
  if (tagged.kind !== 'split') throw new Error('expected split')
  expect((tagged.children[0] as LeafNode).ownerScope).toBe('session')
  expect((tagged.children[1] as LeafNode).ownerScope).toBe('global')

  const g = tagOwnerScopes(group('chat', leaf('chat', 'chat'), leaf('conn', 'connection')), scopeOf)
  if (g.kind !== 'group') throw new Error('expected group')
  expect(g.children.map((c) => c.ownerScope)).toStrictEqual(['session', 'global'])
})

it('[panel-scope] a tagged tree survives a round-trip through a DIFFERENT derivation rule', () => {
  // The point of stamping: a later reader honours what was saved rather than
  // re-deriving something else from a rule that has since changed.
  const tagged = tagOwnerScopes(split([leaf('chat', 'chat'), leaf('conn', 'connection')]), scopeOf)
  const everythingIsGlobal: ScopeOf = () => 'global'
  expect(scopeSubtree(tagged, 'session', everythingIsGlobal)).toStrictEqual({
    ...leaf('chat', 'chat'),
    ownerScope: 'session',
  })
})
