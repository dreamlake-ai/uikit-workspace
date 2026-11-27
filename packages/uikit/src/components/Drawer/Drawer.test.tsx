// @vitest-environment jsdom
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Drawer, DrawerTrigger, DrawerContent, DrawerClose } from './Drawer'
let root: Root
let host: HTMLDivElement
beforeEach(() => {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
    { width: 100, height: 30 },
  ] as any)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.restoreAllMocks()
})
function Example() {
  const [value, setValue] = useState(0)
  return (
    <Drawer direction="right">
      <DrawerTrigger>Inspect account</DrawerTrigger>
      <DrawerContent managedFocus aria-label="Account permissions">
        <DrawerClose>Close permissions</DrawerClose>
        <button onClick={() => setValue(value + 1)}>Check {value}</button>
      </DrawerContent>
    </Drawer>
  )
}
it('focuses the drawer, preserves focus through updates, and restores the opener on Escape', async () => {
  await act(async () => root.render(<Example />))
  const trigger = host.querySelector('button')!
  trigger.focus()
  await act(async () => trigger.click())
  const drawer = document.querySelector('[role="dialog"]')!
  const buttons = drawer.querySelectorAll<HTMLButtonElement>('button')
  await vi.waitFor(() => expect(document.activeElement).toBe(buttons[0]))
  buttons[1].focus()
  await act(async () => buttons[1].click())
  expect(document.activeElement).toBe(buttons[1])
  expect(buttons[1].textContent).toBe('Check 1')
  await act(async () =>
    buttons[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
  )
  expect(document.querySelector('[role="dialog"]')).toBeNull()
  await vi.waitFor(() => expect(document.activeElement).toBe(trigger))
})
