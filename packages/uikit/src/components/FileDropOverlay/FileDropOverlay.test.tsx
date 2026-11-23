// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import { FileDropOverlay, useFileDropTarget } from './FileDropOverlay'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
let host: HTMLDivElement
function Target({ disabled = false, onFiles = vi.fn() }) {
  const { active, ...events } = useFileDropTarget({ disabled, onFiles })
  return <div data-target {...events}><span data-child>Memo content</span><FileDropOverlay active={active} title="Drop into this memo" /></div>
}
function mount(onFiles = vi.fn()) {
  host = document.createElement('div'); document.body.append(host)
  root = createRoot(host)
  act(() => root!.render(<Target onFiles={onFiles}/>))
}
const transfer = { types: ['Files'], files: [new File(['x'], 'photo.png', { type: 'image/png' })] }
function drag(type: string, selector = '[data-target]', data = transfer) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', { value: data })
  act(() => host.querySelector(selector)!.dispatchEvent(event))
}
afterEach(() => { act(() => root?.unmount()); host?.remove() })
it('claims external file drops once and clears feedback', () => {
  const onFiles = vi.fn(); mount(onFiles)
  drag('dragenter')
  expect(host.querySelector('[role=status]')?.textContent).toContain('Drop into this memo')
  drag('drop', '[data-child]')
  expect(onFiles).toHaveBeenCalledTimes(1)
  expect(onFiles.mock.calls[0][0][0].name).toBe('photo.png')
  expect(host.querySelector('[role=status]')).toBeNull()
})
it('leaves text drags and read-only targets alone', () => {
  const onFiles = vi.fn(); mount(onFiles)
  drag('dragenter', '[data-target]', { types: ['text/plain'], files: [] })
  expect(host.querySelector('[role=status]')).toBeNull()
  act(() => root!.render(<Target onFiles={onFiles} disabled />))
  drag('drop')
  expect(onFiles).not.toHaveBeenCalled()
})
it('does not flicker across children and clears on cancellation or lost access', () => {
  mount(); drag('dragenter'); drag('dragenter', '[data-child]'); drag('dragleave', '[data-child]')
  expect(host.querySelector('[role=status]')).not.toBeNull()
  act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })))
  expect(host.querySelector('[role=status]')).toBeNull()
  drag('dragenter')
  act(() => root!.render(<Target disabled />))
  expect(host.querySelector('[role=status]')).toBeNull()
})
