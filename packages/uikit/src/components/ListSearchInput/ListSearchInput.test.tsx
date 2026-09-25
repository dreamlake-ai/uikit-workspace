// @vitest-environment jsdom
import { act, createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { ListSearchInput } from './ListSearchInput'
let root: Root
let container: HTMLDivElement
beforeEach(() => {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(() => { act(() => root.unmount()); container.remove() })
function setup(query = 'pitch') {
  const onRemove = vi.fn()
  const onQuery = vi.fn()
  const ref = createRef<HTMLInputElement>()
  act(() => root.render(<ListSearchInput query={query} onQuery={onQuery} searchRef={ref}
    filter={{ label: 'yours', onRemove }} />))
  const input = ref.current!
  act(() => input.focus())
  return { input, onRemove, onQuery }
}
function backspace(input: HTMLInputElement, options: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true, ...options })
  act(() => input.dispatchEvent(event))
  return event
}
it('removes the badge at the start of a nonempty query without editing the query', () => {
  const { input, onRemove, onQuery } = setup()
  input.setSelectionRange(0, 0)
  expect(backspace(input).defaultPrevented).toBe(true)
  expect(onRemove).toHaveBeenCalledOnce()
  expect(onQuery).not.toHaveBeenCalled()
  expect(input.value).toBe('pitch')
})
it('removes the badge from an empty search', () => {
  const { input, onRemove } = setup('')
  backspace(input)
  expect(onRemove).toHaveBeenCalledOnce()
})
it('preserves ordinary deletion, selections, composition and modified keys', () => {
  const { input, onRemove } = setup()
  for (const [start, end, options] of [[2, 2, {}], [0, 3, {}], [0, 0, { isComposing: true }], [0, 0, { metaKey: true }]] as const) {
    input.setSelectionRange(start, end)
    expect(backspace(input, options).defaultPrevented).toBe(false)
  }
  expect(onRemove).not.toHaveBeenCalled()
})
it('exposes only a removal button and returns focus to the input', () => {
  const { input, onRemove } = setup()
  const button = container.querySelector('button')!
  expect(button.getAttribute('aria-label')).toBe('Remove yours filter')
  expect(container.querySelector('[role="combobox"]')).toBeNull()
  act(() => { button.focus(); button.click() })
  expect(onRemove).toHaveBeenCalledOnce()
  expect(document.activeElement).toBe(input)
})
it('Escape blurs without clearing the query', () => {
  const { input, onQuery } = setup()
  act(() => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
  expect(document.activeElement).not.toBe(input)
  expect(onQuery).not.toHaveBeenCalled()
})
