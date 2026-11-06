// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { SplitButton } from './SplitButton'
import { MenuItem } from '../Menu'
let root: Root
let host: HTMLDivElement
beforeEach(() => {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
})
const click = (node: HTMLElement) => act(() => node.click())
const key = (node: HTMLElement, key: string) =>
  act(() => node.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })))
const tick = () =>
  act(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve))
  })
it('keeps the direct action separate, selects alternatives and restores focus', async () => {
  const primary = vi.fn(),
    alternative = vi.fn()
  act(() =>
    root.render(
      <SplitButton
        onClick={primary}
        menu={
          <>
            <MenuItem label="Disabled" disabled />
            <MenuItem label="Existing" onClick={alternative} />
            <MenuItem label="Folder" />
          </>
        }
      >
        New note
      </SplitButton>
    )
  )
  const [main, arrow] = host.querySelectorAll('button')
  click(main)
  expect(primary).toHaveBeenCalledOnce()
  expect(document.querySelector('[role="menu"]')).toBeNull()
  key(arrow, 'ArrowDown')
  await tick()
  expect(document.activeElement?.textContent).toBe('Existing')
  key(document.activeElement as HTMLElement, 'ArrowDown')
  expect(document.activeElement?.textContent).toBe('Folder')
  key(document.activeElement as HTMLElement, 'Home')
  key(document.activeElement as HTMLElement, 'Enter')
  expect(alternative).toHaveBeenCalledOnce()
  expect(primary).toHaveBeenCalledOnce()
  expect(arrow.getAttribute('aria-expanded')).toBe('false')
  expect(document.activeElement).toBe(arrow)
  click(arrow)
  await tick()
  key(document.activeElement as HTMLElement, 'Escape')
  expect(arrow.getAttribute('aria-expanded')).toBe('false')
  expect(document.activeElement).toBe(arrow)
})
it.each(['disabled', 'loading'] as const)('%s prevents either action', (state) => {
  const primary = vi.fn()
  act(() =>
    root.render(
      <SplitButton {...{ [state]: true }} onClick={primary} menu={<MenuItem label="Existing" />}>
        New note
      </SplitButton>
    )
  )
  const buttons = host.querySelectorAll('button')
  for (const button of buttons) {
    expect(button.disabled).toBe(true)
    click(button)
  }
  expect(primary).not.toHaveBeenCalled()
  expect(document.querySelector('[role="menu"]')).toBeNull()
})
it('supports controlled opening and closes when disabled', async () => {
  const change = vi.fn()
  const render = (open: boolean, disabled = false) =>
    act(() =>
      root.render(
        <SplitButton
          open={open}
          onOpenChange={change}
          disabled={disabled}
          menu={<MenuItem label="Existing" />}
        >
          New note
        </SplitButton>
      )
    )
  render(false)
  click(host.querySelectorAll('button')[1])
  expect(change).toHaveBeenLastCalledWith(true)
  render(true)
  await tick()
  render(true, true)
  expect(change).toHaveBeenLastCalledWith(false)
  expect(host.querySelectorAll('button')[1].getAttribute('aria-expanded')).toBe('false')
})
