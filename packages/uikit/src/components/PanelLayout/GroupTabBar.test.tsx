// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import { GroupTabBar } from './GroupTabBar'
import { panelGroup, panelLeaf, type PanelNode } from './panel-tree'
import { PanelConfigContext, DEFAULT_PALETTE } from './config'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
it('reveals selected tabs on open and resize without scrolling the document or changing focus', () => {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  let resize = () => {}
  const disconnect = vi.fn()
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resize = callback }
    observe() {}
    disconnect = disconnect
  })
  let width = 160
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  const note = panelLeaf({ title: 'Long note title' }), chat = panelLeaf({ title: 'Chat' })
  const group = panelGroup([note, chat], 1) as Extract<PanelNode, {kind:'group'}>
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const bar = host.querySelector('[role=tablist]') as HTMLElement | null
    const left = this.getAttribute('role') === 'tab' ? (this.id.endsWith(chat.id) ? 140 : 0) - (bar?.scrollLeft ?? 0) : 0
    const w = this.getAttribute('role') === 'tab' ? 60 : width
    return { left, right:left+w, width:w, top:0, bottom:26, height:26, x:left, y:0, toJSON(){} }
  })
  const render = (activeId: string) => act(() => root.render(<GroupTabBar group={{...group,activeId}} onActivate={()=>{}} onCloseTab={()=>{}} onHandleDown={()=>{}} />))
  try {
    render(chat.id)
    const bar = host.querySelector('[role=tablist]') as HTMLElement
    expect(bar.scrollLeft).toBe(40)
    width = 120
    act(() => resize())
    expect(bar.scrollLeft).toBe(80)
    render(note.id)
    expect(bar.scrollLeft).toBe(0)
    expect(document.activeElement).toBe(document.body)
    expect(window.scrollY).toBe(0)
  } finally { act(()=>root.unmount());host.remove() }
  expect(disconnect).toHaveBeenCalled()
})

it('focuses the clicked tab before hiding a retained iframe and leaves nested actions independent', () => {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  vi.stubGlobal('ResizeObserver', class { observe() {}; disconnect() {} })
  const host = document.createElement('div')
  const frame = document.createElement('iframe')
  document.body.append(host, frame)
  const root = createRoot(host)
  const first = panelLeaf({ title: 'First' }), second = panelLeaf({ title: 'Second' })
  const group = panelGroup([first, second]) as Extract<PanelNode, {kind:'group'}>
  const onActivate = vi.fn((id: string) => {
    expect(document.activeElement).toBe(host.querySelector(`[data-tab-id="${id}"]`))
  })
  const action = vi.fn()
  const close = vi.fn()
  try {
    act(() => root.render(
      <PanelConfigContext.Provider value={{ palette: DEFAULT_PALETTE, tabbed: true,
        renderTab: leaf => <><span data-label>{leaf.title}</span><button onClick={action}>Pin</button></>,
      }}>
        <GroupTabBar group={group} onActivate={onActivate} onCloseTab={close} onHandleDown={(_leaf, event) => event.preventDefault()} />
      </PanelConfigContext.Provider>
    ))
    const tab = host.querySelector<HTMLElement>(`[data-tab-id="${second.id}"]`)!
    frame.focus()
    expect(document.activeElement).toBe(frame)
    // Synthetic click has no native focus default: the handler must transfer
    // focus before activation can make the previously focused surface inert.
    act(() => tab.querySelector<HTMLElement>('[data-label]')!.click())
    expect(onActivate).toHaveBeenCalledExactlyOnceWith(second.id)
    onActivate.mockClear()
    const pin = tab.querySelector<HTMLButtonElement>('button')!
    pin.focus()
    act(() => pin.click())
    expect(action).toHaveBeenCalledOnce()
    expect(onActivate).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(pin)
    const closer = tab.querySelector<HTMLElement>('[role="button"]')!
    act(() => closer.click())
    expect(close).toHaveBeenCalledExactlyOnceWith(second.id)
    expect(onActivate).not.toHaveBeenCalled()
  } finally { act(() => root.unmount()); host.remove(); frame.remove() }
})
