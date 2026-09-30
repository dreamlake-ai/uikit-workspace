// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { ResizableLayout } from './ResizableLayout'

it('keeps all travel and persisted width when moves and release outrun React rendering', () => {
  ;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  let frame: FrameRequestCallback | undefined
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => { frame = cb; return 1 })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(900)
  try {
    act(() => root.render(<ResizableLayout leftHidden left={null} middle={<div data-middle/>} right={<div/>} middleFixedPx={300} storageKey="resize-burst-test" />))
    const divider = host.querySelector('.group\\/divider')!
    // No render/effect may occur between these events: this was the listener gap.
    act(() => {
      divider.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, buttons: 1, clientX: 300 }))
      window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, buttons: 1, clientX: 340 }))
      frame!(0)
      window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, buttons: 1, clientX: 380 }))
      frame!(0)
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 410 }))
    })
    expect((host.querySelector('[data-middle]')!.parentElement as HTMLElement).style.flexBasis).toBe('410px')
    expect(JSON.parse(localStorage.getItem('resize-burst-test')!).middle).toBe(410)
    expect(document.body.style.cursor).toBe('')
    expect(divider.getAttribute('data-dragging')).toBeNull()
  } finally {
    act(() => root.unmount())
    host.remove()
    localStorage.removeItem('resize-burst-test')
    vi.restoreAllMocks()
  }
})
