// @vitest-environment jsdom
import { act, createRef } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip'

it("asChild keeps the child's own ref", () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  const ref = createRef<HTMLButtonElement>()
  act(() =>
    root.render(
      <Tooltip>
        <TooltipTrigger asChild>
          <button ref={ref}>Read aloud</button>
        </TooltipTrigger>
        <TooltipContent>Read aloud</TooltipContent>
      </Tooltip>
    )
  )
  // A wrapped button must still be reachable through the ref its owner holds.
  expect(ref.current).toBe(host.querySelector('button'))
  act(() => root.unmount())
  host.remove()
})

it('keeps pointer-following hints keyboard accessible and dismisses on Escape', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  await act(async () =>
    root.render(
      <Tooltip followPointer side="bottom" showArrow={false}>
        <TooltipTrigger asChild>
          <button>Session details</button>
        </TooltipTrigger>
        <TooltipContent>Host and workspace</TooltipContent>
      </Tooltip>
    )
  )
  await act(async () => host.querySelector('button')!.focus())
  expect(document.querySelector('[role="tooltip"]')?.textContent).toBe('Host and workspace')
  await act(async () =>
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  )
  expect(document.querySelector('[role="tooltip"]')).toBeNull()
  act(() => root.unmount())
  host.remove()
})

it('dismisses without consuming Escape stopped by a native target-capture editor', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  await act(async () =>
    root.render(
      <>
        <Tooltip followPointer defaultOpen>
          <TooltipTrigger asChild>
            <button>Copy reference</button>
          </TooltipTrigger>
          <TooltipContent>Copy reference</TooltipContent>
        </Tooltip>
        <input onKeyDown={(event) => event.stopPropagation()} />
      </>
    )
  )
  let editorEscapes = 0
  // xterm installs its handler directly on its focused textarea.
  host.querySelector('input')!.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') editorEscapes++
      event.stopPropagation()
    },
    true
  )
  await act(async () =>
    host
      .querySelector('input')!
      .dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, isComposing: true })
      )
  )
  expect(editorEscapes).toBe(1)
  expect(document.querySelector('[role="tooltip"]')).not.toBeNull()
  editorEscapes = 0
  await act(async () =>
    host
      .querySelector('input')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  )
  expect(editorEscapes).toBe(1)
  expect(document.querySelector('[role="tooltip"]')).toBeNull()
  act(() => root.unmount())
  host.remove()
})

it.each([false, true])(
  'Escape cancels pending hover (followPointer=%s) before a native editor stops the key',
  async (followPointer) => {
    vi.useFakeTimers()
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    try {
      await act(async () =>
        root.render(
          <>
            <Tooltip defaultOpen>
              <TooltipTrigger asChild>
                <button>Open session</button>
              </TooltipTrigger>
              <TooltipContent>Open session hint</TooltipContent>
            </Tooltip>
            <Tooltip followPointer={followPointer} delayDuration={200}>
              <TooltipTrigger asChild>
                <button>Copy reference</button>
              </TooltipTrigger>
              <TooltipContent>Copy reference hint</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button>Other control</button>
              </TooltipTrigger>
              <TooltipContent>Other hint</TooltipContent>
            </Tooltip>
            <input />
          </>
        )
      )
      const editor = host.querySelector('input')!
      const copy = host.querySelectorAll('button')[1]
      let escapes = 0
      editor.addEventListener(
        'keydown',
        (event) => {
          if (event.key === 'Escape') escapes++
          event.stopPropagation()
        },
        true
      )
      await act(async () => copy.dispatchEvent(new MouseEvent('mouseenter')))
      await act(async () => vi.advanceTimersByTime(100))
      expect(document.querySelectorAll('[role="tooltip"]')).toHaveLength(1)
      await act(async () =>
        editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      )
      await act(async () => vi.advanceTimersByTime(500))
      expect(escapes).toBe(1)
      expect(document.querySelectorAll('[role="tooltip"]')).toHaveLength(0)
      // Moving off the trigger and returning must still open a fresh hint.
      await act(async () => copy.dispatchEvent(new MouseEvent('mouseleave')))
      await act(async () => copy.dispatchEvent(new MouseEvent('mouseenter')))
      await act(async () => vi.advanceTimersByTime(200))
      expect(document.querySelector('[role="tooltip"]')?.textContent).toBe('Copy reference hint')
      await act(async () =>
        editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      )
      // Escape must not disable keyboard focus hints for untouched controls.
      await act(async () => host.querySelectorAll('button')[2].focus())
      expect(document.querySelector('[role="tooltip"]')?.textContent).toBe('Other hint')
    } finally {
      act(() => root.unmount())
      host.remove()
      vi.useRealTimers()
    }
  }
)
