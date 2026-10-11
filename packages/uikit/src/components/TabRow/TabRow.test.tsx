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

it('fits opted-in text tabs intrinsically while retaining padding and keyboard navigation', () => {
  const change = vi.fn()
  act(() => root.render(<TabRow value="draft" onValueChange={change} tabs={[
    { value: 'notes', label: 'notes', fitContent: true },
    { value: 'draft', label: 'Draft' },
  ]} />))
  const tabs = container.querySelectorAll<HTMLButtonElement>('[role="tab"]')
  const fitted = getComputedStyle(tabs[0].parentElement!)
  expect(fitted.flexBasis).toBe('auto')
  expect(fitted.flexShrink).toBe('0')
  expect(fitted.minWidth).toBe('0px')
  expect(fitted.maxWidth).toBe('var(--tab-row-preferred-width)')
  expect(getComputedStyle(tabs[0]).paddingLeft).toBe('10px')
  expect(tabs[1].parentElement?.hasAttribute('data-fit-content')).toBe(false)
  act(() => tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })))
  expect(change).toHaveBeenCalledWith('notes')
  expect(document.activeElement).toBe(tabs[0])
})


it('caps a long fitted label using preferredTabWidth and retains its ellipsis and full accessible text', () => {
  const label = '@a-very-long-workspace-name/notes-and-project-documents'
  act(() => root.render(<TabRow value="draft" onValueChange={() => {}} preferredTabWidth={150} tabs={[
    { value: 'notes', label, fitContent: true },
    { value: 'draft', label: 'Draft' },
  ]} />))
  const tab = container.querySelector<HTMLButtonElement>('[role="tab"]')!
  expect(container.querySelector<HTMLElement>('.uikit-tab-row')!.style.getPropertyValue('--tab-row-preferred-width')).toBe('150px')
  expect(getComputedStyle(tab.parentElement!).maxWidth).toBe('var(--tab-row-preferred-width)')
  expect(getComputedStyle(tab).minWidth).toBe('0px')
  expect(getComputedStyle(tab).textOverflow).toBe('ellipsis')
  expect(getComputedStyle(tab).overflow).toBe('hidden')
  expect(tab.textContent).toBe(label)
  expect(tab.title).toBe(label)
})
