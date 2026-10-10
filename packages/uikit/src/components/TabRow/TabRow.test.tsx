// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { TabRow } from './TabRow'

let root: Root
let container: HTMLDivElement
beforeEach(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

it('keeps an icon-only tab compact and named while preserving existing keyboard selection', () => {
  const change = vi.fn()
  act(() => root.render(<TabRow value="list" onValueChange={change}
    leading={<button>Menu</button>}
    tabs={[
      { value: 'list', label: 'List', icon: <svg data-list-icon />, iconOnly: true },
      { value: 'content', label: 'Content' },
    ]} />))
  const tabs = container.querySelectorAll<HTMLButtonElement>('[role="tab"]')
  expect(tabs[0].getAttribute('aria-label')).toBe('List')
  expect(tabs[0].title).toBe('List')
  expect(tabs[0].textContent).toBe('')
  expect(tabs[0].querySelector('[data-list-icon]')?.parentElement?.getAttribute('aria-hidden')).toBe('true')
  expect(tabs[0].parentElement?.style.getPropertyValue('--tab-row-preferred-width')).toBe('32px')
  expect(tabs[1].parentElement?.style.getPropertyValue('--tab-row-preferred-width')).toBe('')
  expect(container.querySelector('.uikit-tab-row-controls')?.textContent).toBe('Menu')
  act(() => tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
  expect(change).toHaveBeenCalledWith('content')
  expect(document.activeElement).toBe(tabs[1])
})

it('retains icon-and-text labels and accessible close actions for compact icon tabs', () => {
  const close = vi.fn()
  act(() => root.render(<TabRow value="list" onValueChange={() => {}} onClose={close} tabs={[
    { value: 'list', label: 'List', icon: <svg />, iconOnly: true },
    { value: 'content', label: 'Content', icon: <svg /> },
  ]} />))
  const tabs = container.querySelectorAll<HTMLButtonElement>('[role="tab"]')
  expect(tabs[0].parentElement?.style.getPropertyValue('--tab-row-preferred-width')).toBe('54px')
  expect(tabs[1].textContent).toBe('Content')
  act(() => tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true })))
  expect(close).toHaveBeenCalledWith('list')
  expect(container.querySelector('[aria-label="Close List"]')).toBeTruthy()
})
