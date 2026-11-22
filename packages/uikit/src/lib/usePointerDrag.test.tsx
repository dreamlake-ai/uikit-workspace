// @vitest-environment jsdom
import { act, createElement, type PointerEvent } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePointerDrag, type PointerDragOptions } from './usePointerDrag'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const cleanups: (() => void)[] = []
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup()
})

function harness(initial: PointerDragOptions<HTMLDivElement>) {
  const host = document.createElement('div')
  document.body.append(host)
  const root: Root = createRoot(host)
  let options = initial
  let handlers!: ReturnType<typeof usePointerDrag<HTMLDivElement>>
  function Surface() {
    handlers = usePointerDrag(options)
    return createElement('div')
  }
  const render = (next = options) => {
    options = next
    act(() => root.render(createElement(Surface)))
  }
  render()
  const target = host.firstElementChild as HTMLDivElement
  target.setPointerCapture = vi.fn()
  target.hasPointerCapture = vi.fn(() => true)
  target.releasePointerCapture = vi.fn()
  let mounted = true
  const unmount = () => {
    if (mounted) {
      mounted = false
      act(() => root.unmount())
      host.remove()
    }
  }
  cleanups.push(unmount)
  const event = (overrides = {}) =>
    ({
      currentTarget: target,
      pointerId: 1,
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientX: 10,
      preventDefault: vi.fn(),
      ...overrides,
    }) as unknown as PointerEvent<HTMLDivElement>
  return {
    get handlers() {
      return handlers
    },
    target,
    event,
    render,
    unmount,
  }
}

describe('usePointerDrag', () => {
  it('ignores hover and secondary pointers, captures a press, follows held movement and releases', () => {
    const onDrag = vi.fn(),
      onEnd = vi.fn()
    const h = harness({ onDrag, onEnd })
    h.handlers.onPointerMove(h.event({ buttons: 0 }))
    h.handlers.onPointerDown(h.event({ button: 2 }))
    h.handlers.onPointerDown(h.event({ isPrimary: false }))
    expect(onDrag).not.toHaveBeenCalled()
    h.handlers.onPointerDown(h.event())
    expect(h.target.setPointerCapture).toHaveBeenCalledWith(1)
    h.handlers.onPointerMove(h.event({ pointerId: 2 }))
    h.handlers.onPointerMove(h.event({ clientX: -30 }))
    h.handlers.onPointerUp(h.event({ clientX: 150, buttons: 0 }))
    h.handlers.onPointerMove(h.event({ clientX: 100 }))
    expect(onDrag.mock.calls.map(([e]) => e.clientX)).toEqual([10, -30, 150])
    expect(onEnd).toHaveBeenCalledOnce()
    expect(h.target.releasePointerCapture).toHaveBeenCalledWith(1)
    expect(h.handlers.isDragging()).toBe(false)
  })

  it.each(['cancel', 'lost', 'buttons', 'blur', 'escape', 'unmount', 'disabled'])(
    'ends %s without committing a release or accepting later moves',
    (kind) => {
      const onDrag = vi.fn(),
        onEnd = vi.fn(),
        onCancel = vi.fn()
      const options = { onDrag, onEnd, onCancel }
      const h = harness(options)
      h.handlers.onPointerDown(h.event())
      act(() => {
        if (kind === 'cancel') h.handlers.onPointerCancel(h.event())
        if (kind === 'lost') h.handlers.onLostPointerCapture(h.event())
        if (kind === 'buttons') h.handlers.onPointerMove(h.event({ buttons: 0 }))
        if (kind === 'blur') window.dispatchEvent(new Event('blur'))
        if (kind === 'escape') window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        if (kind === 'unmount') h.unmount()
        if (kind === 'disabled') h.render({ ...options, disabled: true })
      })
      h.handlers.onPointerUp(h.event())
      h.handlers.onPointerMove(h.event())
      expect(onDrag).toHaveBeenCalledOnce()
      expect(onCancel).toHaveBeenCalledOnce()
      expect(onEnd).not.toHaveBeenCalled()
    }
  )

  it('uses new callbacks through rerenders and lets another gesture own a rejected press', () => {
    const initial = vi.fn(),
      next = vi.fn()
    const h = harness({ onDrag: initial, onStart: () => false })
    h.handlers.onPointerDown(h.event())
    expect(h.target.setPointerCapture).not.toHaveBeenCalled()
    h.render({ onDrag: initial })
    h.handlers.onPointerDown(h.event())
    h.render({ onDrag: next })
    h.handlers.onPointerMove(h.event())
    h.handlers.onPointerUp(h.event())
    expect(initial).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledTimes(2)
  })
})
