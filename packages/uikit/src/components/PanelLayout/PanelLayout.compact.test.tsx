// @vitest-environment jsdom
import { act, createRef, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PanelLayout, type PanelLayoutHandle } from './PanelLayout'
import { panelGroup, panelLeaf, panelSplit, type LeafNode } from './panel-tree'

let root: Root
let container: HTMLDivElement
beforeEach(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

function fixture() {
  const list = panelLeaf({ view: 'files', title: 'Files' })
  const editor = panelLeaf({ view: 'editor', title: 'Draft' })
  const terminal = panelLeaf({ view: 'terminal', title: 'Terminal' })
  const chat = panelLeaf({ view: 'chat', title: 'Chat' })
  const tree = panelSplit('row', [list, panelSplit('column', [panelGroup([editor, terminal]), chat], [62, 38])], [23, 77])
  return { tree, list, editor, terminal, chat }
}
const surface = (id: string) => container.querySelector<HTMLElement>(`[data-surface="${id}"]`)!
const tabs = () => [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')]

it.each([false, true])('selects every split/group leaf and retains tree, DOM and editor values (tabbed=%s)', tabbed => {
  const { tree, list, editor, terminal, chat } = fixture()
  const ref = createRef<PanelLayoutHandle>()
  const changed = vi.fn()
  const mounts = vi.fn()
  const unmounts = vi.fn()
  function Editor({ leaf }: { leaf: LeafNode }) {
    useEffect(() => { mounts(leaf.id); return () => { unmounts(leaf.id) } }, [])
    return <textarea data-editor={leaf.id} defaultValue={leaf.title} />
  }
  const render = (compact: boolean) => act(() => root.render(
    <PanelLayout ref={ref} root={tree} compact={compact} tabbed={tabbed} onChange={changed} renderBody={leaf => <Editor leaf={leaf} />} />
  ))
  render(false)
  const elements = [list, editor, terminal, chat].map(leaf => container.querySelector<HTMLTextAreaElement>(`[data-editor="${leaf.id}"]`)!)
  elements[1].value = 'Unsaved work'
  expect(surface(terminal.id).hidden).toBe(true)
  render(true)
  expect(tabs().map(tab => tab.textContent)).toEqual(['Files', 'Draft', 'Terminal', 'Chat'])
  act(() => tabs()[2].click())
  expect(surface(terminal.id).hidden).toBe(false)
  expect(surface(list.id).hidden).toBe(true)
  expect(surface(list.id).inert).toBe(true)
  expect(surface(editor.id).style.display).toBe('none')
  act(() => ref.current!.focusLeaf(editor.id))
  expect(surface(editor.id).hidden).toBe(false)
  render(false)
  expect(ref.current!.getRoot()).toBe(tree)
  expect(changed).not.toHaveBeenCalled()
  expect(mounts).toHaveBeenCalledTimes(4)
  expect(unmounts).not.toHaveBeenCalled()
  elements.forEach((element, index) => {
    expect(element.isConnected).toBe(true)
    expect(container.querySelector(`[data-editor="${[list, editor, terminal, chat][index].id}"]`)).toBe(element)
  })
  expect(elements[1].value).toBe('Unsaved work')
  expect(surface(terminal.id).hidden).toBe(true)
  expect(surface(list.id).hidden).toBe(false)
  expect(surface(chat.id).hidden).toBe(false)
})

it('links tabs and panels and supports arrow/Home/End selection with roving keyboard focus', () => {
  const { tree, terminal } = fixture()
  const focused = vi.fn()
  act(() => root.render(<PanelLayout root={tree} compact onFocusedLeafChange={focused} />))
  expect(container.querySelector('[role="tablist"]')?.getAttribute('aria-label')).toBe('Workspace panels')
  tabs().forEach(tab => {
    const panel = document.getElementById(tab.getAttribute('aria-controls')!)!
    expect(panel.getAttribute('role')).toBe('tabpanel')
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.id)
  })
  const key = (index: number, value: string) => act(() => tabs()[index].dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true })))
  key(0, 'End')
  expect(document.activeElement).toBe(tabs()[3])
  key(3, 'ArrowLeft')
  expect(document.activeElement).toBe(tabs()[2])
  expect(focused.mock.lastCall?.[0].id).toBe(terminal.id)
  expect(tabs().map(tab => tab.tabIndex)).toEqual([-1, -1, 0, -1])
  key(2, 'Home')
  expect(document.activeElement).toBe(tabs()[0])
  key(0, 'ArrowLeft')
  expect(document.activeElement).toBe(tabs()[3])
})

it('tracks keyboard focus on desktop and repairs focus when restoring a group hides the compact editor', () => {
  const { tree, terminal, chat } = fixture()
  const ref = createRef<PanelLayoutHandle>()
  const render = (compact: boolean) => act(() => root.render(
    <PanelLayout ref={ref} root={tree} compact={compact} renderBody={leaf => <input aria-label={leaf.title} />} />
  ))
  render(false)
  act(() => surface(chat.id).querySelector('input')!.focus())
  render(true)
  expect(surface(chat.id).hidden).toBe(false)
  act(() => ref.current!.focusLeaf(terminal.id))
  act(() => surface(terminal.id).querySelector('input')!.focus())
  render(false)
  expect(surface(terminal.id).hidden).toBe(true)
  expect(surface(terminal.id).contains(document.activeElement)).toBe(false)
  expect(container.contains(document.activeElement)).toBe(true)
})

it('keeps close policy and chooses a live panel after closing or a controlled root replacement', () => {
  const { tree, list, editor } = fixture()
  const ref = createRef<PanelLayoutHandle>()
  const closed = vi.fn()
  act(() => root.render(<PanelLayout ref={ref} initial={() => tree} compact closable={leaf => leaf.id !== list.id} onRequestClose={closed} />))
  act(() => tabs()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true })))
  expect(closed).not.toHaveBeenCalled()
  act(() => tabs()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true })))
  expect(closed).toHaveBeenCalledWith(editor.id)
  act(() => ref.current!.focusLeaf(editor.id))
  act(() => ref.current!.closeLeaf(editor.id))
  expect(tabs().filter(tab => tab.getAttribute('aria-selected') === 'true')).toHaveLength(1)
  const replacement = panelLeaf({ title: 'New workspace' })
  act(() => root.render(<PanelLayout ref={ref} root={replacement} compact />))
  expect(surface(replacement.id).hidden).toBe(false)
  expect(tabs()).toHaveLength(0)
})

it('does not expose docking or trigger desktop split shortcuts in compact mode', () => {
  const { tree } = fixture()
  const changed = vi.fn()
  act(() => root.render(<PanelLayout root={tree} compact onChange={changed} />))
  expect(container.querySelector('[data-dock-handle]')).toBe(null)
  expect(container.querySelector('[role="separator"]')).toBe(null)
  act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true, bubbles: true })))
  expect(changed).not.toHaveBeenCalled()
})

it('preserves non-tabbed desktop headers and handles and omits a single-panel selector', () => {
  const { tree } = fixture()
  const header = (leaf: LeafNode) => <button>{leaf.title} actions</button>
  act(() => root.render(<PanelLayout root={tree} renderHeader={header} />))
  const desktopHeaders = [...container.querySelectorAll('header')].map(node => node.outerHTML)
  const handles = container.querySelectorAll('[data-dock-handle]').length
  act(() => root.render(<PanelLayout root={tree} compact={false} renderHeader={header} />))
  const visibleHeaders = [...container.querySelectorAll('[data-surface]:not([hidden]) header')].map(node => node.outerHTML)
  expect(visibleHeaders).toEqual(desktopHeaders)
  expect(container.querySelectorAll('[data-surface]:not([hidden]) [data-dock-handle]')).toHaveLength(handles)
  const single = panelLeaf({ title: 'Terminal' })
  act(() => root.render(<PanelLayout root={single} compact renderHeader={header} />))
  expect(tabs()).toHaveLength(0)
  expect(container.querySelector('[role="tabpanel"]')).toBe(null)
  expect(container.querySelector('header')?.textContent).toBe('Terminal actions')
})

it('returns keyboard focus to visible content when the compact selector disappears', () => {
  const { tree } = fixture()
  act(() => root.render(<PanelLayout root={tree} compact />))
  act(() => tabs()[2].focus())
  act(() => root.render(<PanelLayout root={tree} compact={false} />))
  expect(document.activeElement?.closest('[data-surface]')?.hasAttribute('hidden')).toBe(false)
})


it('accepts product-specific compact labels without changing desktop titles', () => {
  const { tree, list } = fixture()
  act(() => root.render(<PanelLayout root={tree} compact compactPanelLabel={leaf => leaf.id === list.id ? 'Browse' : ''} />))
  expect(tabs().map(tab => tab.textContent)).toEqual(['Browse', 'Draft', 'Terminal', 'Chat'])
  expect(list.title).toBe('Files')
})
