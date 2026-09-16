import { expect, it } from 'vitest'
import { resolveViewSplit, type ViewPref } from './open-view'
import type { LeafNode, PanelNode } from './panel-tree'

const leaf = (id: string, view?: string): LeafNode => ({ kind: 'leaf', id, n: 1, view, instanceId: id })
const split = (children: PanelNode[]): PanelNode => ({
  kind: 'split',
  id: 's',
  dir: 'row',
  children,
  sizes: children.map(() => 100 / children.length),
})

const base = { view: 'connection', fallbackLeafId: 'fallback-1', anchorView: 'chat' }

it('[open-view] a view already open resolves to skip (idempotent, never a second copy)', () => {
  const root = split([leaf('c', 'chat'), leaf('x', 'connection')])
  expect(resolveViewSplit({ ...base, root })).toStrictEqual({ skip: true })
})

it('[open-view] the anchor panel is the split target when present', () => {
  const root = split([leaf('chat-leaf', 'chat'), leaf('other', 'diff')])
  const r = resolveViewSplit({ ...base, root })
  expect('skip' in r).toBe(false)
  if (!('skip' in r)) expect(r.targetId).toBe('chat-leaf')
})

it('[open-view] falls back when the anchor is absent, when there is no anchor, and when the tree is null', () => {
  const noAnchor = split([leaf('a', 'diff'), leaf('b', 'preview')])
  for (const root of [noAnchor, null]) {
    const r = resolveViewSplit({ ...base, root })
    if (!('skip' in r)) expect(r.targetId).toBe('fallback-1')
  }
  // No anchorView configured at all: every open lands on the fallback.
  const r = resolveViewSplit({ view: 'connection', fallbackLeafId: 'fallback-1', root: split([leaf('c', 'chat')]) })
  if (!('skip' in r)) expect(r.targetId).toBe('fallback-1')
})

it('[open-view] a remembered px becomes a fraction of the target CURRENT width', () => {
  const root = split([leaf('chat-leaf', 'chat')])
  const prefs: Record<string, ViewPref> = { connection: { dir: 'row', before: false, px: 300 } }
  const r = resolveViewSplit({
    ...base,
    root,
    prefs,
    widthOf: (id) => (id === 'chat-leaf' ? 1200 : 0),
  })
  if (!('skip' in r)) expect(r.fraction).toBe(300 / 1200)
})

it('[open-view] a zero/unknown width drops the fraction instead of dividing by zero', () => {
  const root = split([leaf('chat-leaf', 'chat')])
  const prefs: Record<string, ViewPref> = { connection: { dir: 'row', before: false, px: 300 } }
  // Not laid out yet.
  const r = resolveViewSplit({ ...base, root, prefs, widthOf: () => 0 })
  if (!('skip' in r)) expect(r.fraction).toBeUndefined()
  // No measure supplied at all.
  const r2 = resolveViewSplit({ ...base, root, prefs })
  if (!('skip' in r2)) expect(r2.fraction).toBeUndefined()
})

it('[open-view] a remembered dir/before is honoured; without a pref it is row/undefined', () => {
  const root = split([leaf('chat-leaf', 'chat')])
  const r = resolveViewSplit({
    ...base,
    root,
    prefs: { connection: { dir: 'column', before: true } },
  })
  if (!('skip' in r)) {
    expect(r.dir).toBe('column')
    expect(r.before).toBe(true)
    expect(r.fraction).toBeUndefined()
  }

  const bare = resolveViewSplit({ ...base, root })
  if (!('skip' in bare)) {
    expect(bare.dir).toBe('row')
    expect(bare.before).toBeUndefined()
    expect(bare.fraction).toBeUndefined()
  }
})

it('[open-view] a view inside a tab group still counts as open', () => {
  const root: PanelNode = {
    kind: 'group',
    id: 'g',
    children: [leaf('a', 'chat'), leaf('b', 'connection')],
    activeId: 'a',
  }
  expect(resolveViewSplit({ ...base, root })).toStrictEqual({ skip: true })
})
