// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { panelLeaf, panelSplit, type PanelNode } from './panel-tree'
import { useSplitEntryMotion } from './useSplitEntryMotion'

let host: HTMLDivElement
let tree: ReturnType<typeof createRoot>
let output: PanelNode
let clock = 0
let next = 0
const frames = new Map<number, FrameRequestCallback>()
beforeEach(() => {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  tree = createRoot(host)
  clock = 0
  frames.clear()
  vi.spyOn(performance, 'now').mockImplementation(() => clock)
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frames.set(++next, cb)
    return next
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})
afterEach(() => {
  act(() => tree.unmount())
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
function View({ root, enabled = true }: { root: PanelNode; enabled?: boolean }) {
  output = useSplitEntryMotion(root, enabled)
  return null
}
function render(root: PanelNode, enabled = true) {
  act(() => tree.render(<View root={root} enabled={enabled} />))
}
function step(time: number) {
  clock = time
  const callbacks = [...frames.values()]
  frames.clear()
  act(() => callbacks.forEach((cb) => cb(time)))
}
it('narrows the retained list over 220ms without changing the model', () => {
  const list = panelLeaf({ view: 'list' })
  render(list)
  const split = panelSplit('row', [list, panelLeaf({ view: 'chat' })], [22, 78])
  render(split)
  expect(output.kind === 'split' && output.sizes).toEqual([100, 0])
  step(60)
  expect(output.kind === 'split' && output.sizes[0]).toBeGreaterThan(22)
  expect(output.kind === 'split' && output.sizes[0]).toBeLessThan(100)
  expect(split.kind === 'split' && split.sizes).toEqual([22, 78])
  step(220)
  expect(output).toBe(split)
})
it('does not animate initial layout, ordinary tab updates, or divider resizing', () => {
  const split = panelSplit('row', [panelLeaf(), panelLeaf()], [22, 78])
  render(split)
  expect(output).toBe(split)
  const changed = { ...split, sizes: [40, 60] }
  render(changed)
  expect(output).toBe(changed)
  expect(frames.size).toBe(0)
})
it.each(['compact', 'reduced motion'])('opens immediately for %s', (mode) => {
  const list = panelLeaf()
  render(list)
  if (mode === 'reduced motion') vi.stubGlobal('matchMedia', () => ({ matches: true }))
  const split = panelSplit('row', [list, panelLeaf()], [22, 78])
  render(split, mode !== 'compact')
  expect(output).toBe(split)
  expect(frames.size).toBe(0)
})
it('interrupts safely when closed or resized mid-animation', () => {
  const list = panelLeaf()
  render(list)
  const split = panelSplit('row', [list, panelLeaf()], [22, 78])
  render(split)
  step(60)
  const resized = { ...split, sizes: [35, 65] }
  render(resized)
  expect(output).toBe(resized)
  expect(frames.size).toBe(0)
  render(list)
  expect(output).toBe(list)
})
