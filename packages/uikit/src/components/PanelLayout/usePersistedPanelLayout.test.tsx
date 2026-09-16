// @vitest-environment jsdom
import { act, createRef, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PanelLayout, type PanelLayoutHandle } from './PanelLayout'
import { usePersistedPanelLayout, type PersistedPanelLayoutOptions } from './usePersistedPanelLayout'
import { LAYOUT_SCHEMA_VERSION, panelLeaf, panelSplit, type LeafNode, type PanelNode } from './panel-tree'
import { scopeSubtree, type ScopeOf } from './panel-scope'

let root: Root
let container: HTMLDivElement
const KEY = 'test:layout'

beforeEach(() => {
  ;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  act(() => root.unmount())
  container.remove()
})

/** Mount a layout wired to the hook, exposing the handle and the hook result. */
function mount(opts: Omit<PersistedPanelLayoutOptions, 'key'> & { key?: string }) {
  const ref = createRef<PanelLayoutHandle>()
  const api: { clear?: () => void; onChange?: (r: PanelNode) => void } = {}
  function Host() {
    const persisted = usePersistedPanelLayout({ key: KEY, ...opts })
    const once = useRef(false)
    if (!once.current) {
      once.current = true
      api.clear = persisted.clear
      api.onChange = persisted.onChange
    }
    return <PanelLayout ref={ref} initial={persisted.initial} onChange={persisted.onChange} />
  }
  act(() => root.render(<Host />))
  return { ref, api }
}

const saved = () => JSON.parse(localStorage.getItem(KEY) || 'null')
const twoPane = () => panelSplit('row', [panelLeaf({ view: 'chat' }), panelLeaf({ view: 'files' })], [60, 40])

it('saves under the versioned envelope, coalescing a burst of changes into one write', () => {
  const setItem = vi.spyOn(Storage.prototype, 'setItem')
  const { ref, api } = mount({ fallback: twoPane })
  const tree = ref.current!.getRoot() as Extract<PanelNode, { kind: 'split' }>

  // A divider drag reports a change every frame.
  act(() => {
    for (let i = 0; i < 20; i++) api.onChange!(ref.current!.getRoot())
  })
  expect(setItem, 'nothing written before the debounce elapses').not.toHaveBeenCalled()
  act(() => vi.advanceTimersByTime(200))
  expect(setItem, 'one write for the whole burst').toHaveBeenCalledTimes(1)

  expect(saved().v).toBe(LAYOUT_SCHEMA_VERSION)
  expect(saved().root.kind).toBe('split')
  expect(tree.children).toHaveLength(2)
  setItem.mockRestore()
})

it('restores what was saved, in preference to the fallback', () => {
  const { ref } = mount({ fallback: twoPane })
  act(() => ref.current!.splitWith(ref.current!.inspect()[0].id, 'row', 'diff', 'Diff'))
  act(() => vi.advanceTimersByTime(200))

  // Remount: `initial` runs again and should pick up the saved tree.
  act(() => root.unmount())
  container.remove()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  const again = mount({ fallback: twoPane })
  const views = again.ref.current!.inspect().map((i) => i.view)
  expect(views, 'the extra panel came back').toContain('diff')
  expect(views).toHaveLength(3)
})

it('falls back when storage is empty, malformed, or the wrong shape', () => {
  for (const blob of [null, '{{{not json', '{"nope":1}', '[]']) {
    localStorage.clear()
    if (blob !== null) localStorage.setItem(KEY, blob)
    act(() => root.unmount())
    container.remove()
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    const { ref } = mount({ fallback: twoPane })
    expect(ref.current!.inspect().map((i) => i.view), `blob=${blob}`).toStrictEqual(['chat', 'files'])
  }
})

it('accepts a BARE legacy tree saved before the envelope existed', () => {
  // The regression this guards: shape-checking the raw blob for `kind` before
  // unwrapping rejects every enveloped layout. Both formats must load.
  const legacy = { kind: 'leaf', id: 'old-1', n: 7, view: 'legacy' }
  localStorage.setItem(KEY, JSON.stringify(legacy))
  const { ref } = mount({ fallback: twoPane })
  const r = ref.current!.getRoot() as LeafNode
  expect(r.view).toBe('legacy')
  expect(r.instanceId, 'migrated on the way in').toBe('old-1')
})

it('reseeds the id counters past a restored tree so new panels cannot collide', () => {
  localStorage.setItem(
    KEY,
    JSON.stringify({ v: 2, root: { kind: 'leaf', id: 'n-9000', n: 900, view: 'restored' } }),
  )
  const { ref } = mount({ fallback: twoPane })
  act(() => ref.current!.splitWith('n-9000', 'row', 'fresh'))
  const after = ref.current!.getRoot()
  const minted = (after.kind === 'split' ? after.children[1] : after) as LeafNode
  expect(Number(/(\d+)$/.exec(minted.id)![1])).toBeGreaterThan(9000)
})

it('validate runs AFTER migration and can reject a restored tree', () => {
  localStorage.setItem(KEY, JSON.stringify({ v: 2, root: { kind: 'leaf', id: 'x', n: 1, view: 'orphan' } }))
  const seen: PanelNode[] = []
  const { ref } = mount({
    fallback: twoPane,
    validate: (r) => {
      seen.push(r)
      return r.kind === 'split' // the saved leaf fails this
    },
  })
  expect(seen, 'validate saw the migrated tree').toHaveLength(1)
  expect((seen[0] as LeafNode).instanceId, 'already migrated when validate ran').toBe('x')
  expect(ref.current!.inspect().map((i) => i.view), 'rejected → fallback').toStrictEqual(['chat', 'files'])
})

it('transform narrows what gets saved — e.g. only one owner scope', () => {
  const scopeOf: ScopeOf = (l) => (l.view === 'settings' ? 'global' : 'doc')
  const { ref, api } = mount({
    fallback: () => panelSplit('row', [panelLeaf({ view: 'chat' }), panelLeaf({ view: 'settings' })]),
    transform: (r) => scopeSubtree(r, 'doc', scopeOf),
  })
  act(() => api.onChange!(ref.current!.getRoot()))
  act(() => vi.advanceTimersByTime(200))
  // The global panel is not this owner's to save.
  expect(saved().root.kind).toBe('leaf')
  expect(saved().root.view).toBe('chat')
})

it('debounceMs: 0 writes synchronously', () => {
  const { ref, api } = mount({ fallback: twoPane, debounceMs: 0 })
  act(() => api.onChange!(ref.current!.getRoot()))
  expect(saved(), 'no timer to advance').toBeTruthy()
})

it('clear() forgets the saved layout', () => {
  const { ref, api } = mount({ fallback: twoPane, debounceMs: 0 })
  act(() => api.onChange!(ref.current!.getRoot()))
  expect(saved()).toBeTruthy()
  act(() => api.clear!())
  expect(localStorage.getItem(KEY)).toBeNull()
})

it('a storage that throws never takes the app down', () => {
  const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('QuotaExceededError')
  })
  const { ref, api } = mount({ fallback: twoPane, debounceMs: 0 })
  expect(() => act(() => api.onChange!(ref.current!.getRoot()))).not.toThrow()
  setItem.mockRestore()
})

it('flushes a pending write on unmount rather than losing it', () => {
  const { ref } = mount({ fallback: twoPane })
  act(() => ref.current!.splitWith(ref.current!.inspect()[0].id, 'row', 'diff'))
  expect(saved(), 'still inside the debounce window').toBeNull()
  act(() => root.unmount())
  expect(saved(), 'the last change survived the unmount').toBeTruthy()
})

it('reset() forgets the saved layout and returns a fresh tree (Reset must not restore)', () => {
  // The trap this closes: `initial` restores, so wiring Reset to it hands back
  // the very layout the user is trying to get rid of.
  const ref = createRef<PanelLayoutHandle>()
  const api: { reset?: () => PanelNode } = {}
  function Host() {
    const persisted = usePersistedPanelLayout({ key: KEY, fallback: twoPane, debounceMs: 0 })
    api.reset = persisted.reset
    return (
      <PanelLayout
        ref={ref}
        initial={persisted.initial}
        resetTo={persisted.reset}
        onChange={persisted.onChange}
        showToolbar
      />
    )
  }
  act(() => root.render(<Host />))

  // Save a layout with an extra panel.
  act(() => ref.current!.splitWith(ref.current!.inspect()[0].id, 'row', 'diff'))
  expect(saved(), 'the 3-panel layout is on disk').toBeTruthy()
  expect(ref.current!.inspect()).toHaveLength(3)

  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Reset')!
  act(() => btn.click())
  expect(ref.current!.inspect().map((i) => i.view), 'back to the fallback').toStrictEqual(['chat', 'files'])
  expect(api.reset, 'reset is exposed for hosts wiring their own button').toBeTypeOf('function')
})
