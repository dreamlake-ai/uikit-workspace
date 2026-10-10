// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ResizableLayout, type ResizableLayoutProps } from './ResizableLayout'

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>
beforeEach(() => {
  ;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
  localStorage.removeItem('compact-widths')
})
const props = {
  left: <input aria-label="Navigation draft" defaultValue="navigation" />,
  middle: <textarea aria-label="Content draft" defaultValue="draft" />,
  right: <input aria-label="Details draft" defaultValue="details" />,
  compactLabels: { left: 'Browse', middle: 'Editor', right: 'Preview' },
}
function render(extra: Partial<ResizableLayoutProps> = {}) {
  act(() => root.render(<ResizableLayout {...props} {...extra} />))
}
function tab(label: string) {
  return Array.from(host.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find(el => el.textContent === label)!
}
function activePanels() {
  return Array.from(host.querySelectorAll<HTMLElement>('[role="tabpanel"]')).filter(el => el.style.display !== 'none')
}

it('selects every visible panel with accessible keyboard tabs and retains editor DOM and values', () => {
  render({ compact: true })
  const draft = host.querySelector('textarea')!
  draft.value = 'unfinished work'
  expect(activePanels()).toHaveLength(1)
  expect(activePanels()[0].contains(draft)).toBe(true)
  expect(tab('Editor').getAttribute('aria-controls')).toBe(activePanels()[0].id)
  expect(activePanels()[0].getAttribute('aria-labelledby')).toBe(tab('Editor').id)
  expect(host.querySelector('.group\\/divider')).toBeNull()
  act(() => tab('Editor').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
  expect(tab('Preview').getAttribute('aria-selected')).toBe('true')
  expect(document.activeElement).toBe(tab('Preview'))
  expect(activePanels()).toHaveLength(1)
  expect(draft.parentElement!.style.display).toBe('none')
  act(() => tab('Browse').click())
  expect(activePanels()[0].querySelector('input')?.value).toBe('navigation')
  act(() => tab('Editor').click())
  expect(host.querySelector('textarea')).toBe(draft)
  expect(draft.value).toBe('unfinished work')
})

it('preserves persisted desktop widths and DOM across repeated mode changes', () => {
  localStorage.setItem('compact-widths', JSON.stringify({ left: 2, middle: 420, right: 5 }))
  const sizes = { storageKey: 'compact-widths', leftFixedPx: 220, middleFixedPx: 300 }
  render(sizes)
  const draft = host.querySelector('textarea')!
  const editor = draft.parentElement!
  draft.value = 'unsaved'
  expect(editor.style.flexBasis).toBe('420px')
  for (let i = 0; i < 2; i++) {
    render({ ...sizes, compact: true })
    expect(editor.style.flexBasis).toBe('0%')
    act(() => tab('Preview').click())
    render(sizes)
    expect(host.querySelector('textarea')).toBe(draft)
    expect(draft.value).toBe('unsaved')
    expect(editor.style.flexBasis).toBe('420px')
  }
  expect(JSON.parse(localStorage.getItem('compact-widths')!).middle).toBe(420)
})

it('supports controlled detail selection and omits hidden panels with a visible fallback', () => {
  const onChange = vi.fn()
  render({ compact: true, compactPanel: 'right', onCompactPanelChange: onChange })
  expect(tab('Preview').getAttribute('aria-selected')).toBe('true')
  act(() => tab('Editor').click())
  expect(onChange).toHaveBeenCalledWith('middle')
  expect(tab('Preview').getAttribute('aria-selected')).toBe('true')
  render({ compact: true, compactPanel: 'right', rightHidden: true })
  expect(tab('Preview')).toBeUndefined()
  expect(tab('Editor').getAttribute('aria-selected')).toBe('true')
  expect(activePanels()).toHaveLength(1)
  render({ compact: true, leftHidden: true, middleHidden: true, rightHidden: true })
  expect(activePanels()).toHaveLength(0)
  expect(host.querySelector('[role="tablist"]')).toBeNull()
})


it('makes inactive panels inert and moves focus out of an editor hidden by the breakpoint', () => {
  render()
  const navigation = host.querySelector<HTMLInputElement>('[aria-label="Navigation draft"]')!
  const editor = host.querySelector('textarea')!
  navigation.focus()
  expect(document.activeElement).toBe(navigation)
  render({ compact: true })
  expect(navigation.parentElement!.hasAttribute('inert')).toBe(true)
  expect(editor.parentElement!.hasAttribute('inert')).toBe(false)
  expect(document.activeElement).toBe(editor.parentElement)
  render()
  expect(navigation.parentElement!.hasAttribute('inert')).toBe(false)
  expect(editor.parentElement!.hasAttribute('inert')).toBe(false)
})

it('omits the selector and tab relationships when only one panel is visible', () => {
  render({ compact: true, leftHidden: true, middleHidden: true })
  expect(host.querySelector('[role="tablist"]')).toBeNull()
  expect(host.querySelector('[role="tabpanel"]')).toBeNull()
  const details = host.querySelector<HTMLInputElement>('[aria-label="Details draft"]')!.parentElement!
  expect(details.style.display).toBe('flex')
  expect(details.hasAttribute('aria-labelledby')).toBe(false)
  expect(details.hasAttribute('inert')).toBe(false)
})


it('keeps touch selectors tall and supplies meaningful names for blank labels', () => {
  render({ compact: true, compactLabels: { left: '', middle: '  ', right: 'Results' } })
  expect(tab('Navigation')).toBeDefined()
  expect(tab('Content')).toBeDefined()
  expect(tab('Results')).toBeDefined()
  const row = host.querySelector<HTMLElement>('.uikit-tab-row')!
  expect(row.style.getPropertyValue('--tab-row-min-height')).toBe('44px')
})

it('restores focus to visible content when the compact selector disappears', () => {
  render({ compact: true })
  act(() => tab('Editor').focus())
  render({ compact: false })
  expect(document.activeElement).toBe(host.querySelector('textarea')!.parentElement)
})
