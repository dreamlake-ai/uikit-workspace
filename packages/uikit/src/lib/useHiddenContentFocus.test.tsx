// @vitest-environment jsdom
import { act, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useHiddenContentFocus } from './useHiddenContentFocus'

let host: HTMLDivElement
let root: Root
beforeEach(() => {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.restoreAllMocks()
})
function Probe({ hidden, disabled = false }: { hidden: boolean; disabled?: boolean }) {
  const content = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const props = useHiddenContentFocus(hidden, content, () => trigger.current)
  return (
    <>
      <button ref={trigger} disabled={disabled}>
        Trigger
      </button>
      <input aria-label="Outside" />
      <div ref={content} data-content {...props}>
        <textarea />
      </div>
    </>
  )
}

it('moves focus before hiding retained content, and reveals it immediately on reopen', async () => {
  await act(async () => root.render(<Probe hidden={false} />))
  const content = host.querySelector('[data-content]')!
  const input = host.querySelector('textarea')!
  input.focus()
  const setAttribute = content.setAttribute.bind(content)
  const focusedAtHide: boolean[] = []
  vi.spyOn(content, 'setAttribute').mockImplementation((name, value) => {
    if (name === 'aria-hidden' || name === 'inert')
      focusedAtHide.push(content.contains(document.activeElement))
    setAttribute(name, value)
  })
  await act(async () => root.render(<Probe hidden />))
  expect(focusedAtHide).toEqual([false, false])
  expect(document.activeElement).toBe(host.querySelector('button'))
  expect(content.getAttribute('aria-hidden')).toBe('true')
  await act(async () => root.render(<Probe hidden={false} />))
  expect(content.hasAttribute('inert')).toBe(false)
  expect(content.hasAttribute('aria-hidden')).toBe(false)
  input.focus()
  expect(document.activeElement).toBe(input)
})

it('preserves focus explicitly moved outside by a navigation or pointer action', async () => {
  await act(async () => root.render(<Probe hidden={false} />))
  host.querySelector('textarea')!.focus()
  const outside = host.querySelector('input')!
  outside.focus()
  await act(async () => root.render(<Probe hidden />))
  expect(document.activeElement).toBe(outside)
})

it('releases focus when a disabled return target cannot receive it', async () => {
  await act(async () => root.render(<Probe hidden={false} disabled />))
  host.querySelector('textarea')!.focus()
  await act(async () => root.render(<Probe hidden disabled />))
  expect(host.querySelector('[data-content]')!.contains(document.activeElement)).toBe(false)
})
