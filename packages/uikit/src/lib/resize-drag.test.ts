// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { startResizeDrag } from './resize-drag'

let target: HTMLDivElement
let frames: Map<number, FrameRequestCallback>
let nextFrame: number
beforeEach(() => {
  target = document.createElement('div')
  document.body.append(target)
  target.setPointerCapture = vi.fn()
  target.hasPointerCapture = () => true
  target.releasePointerCapture = vi.fn()
  frames = new Map()
  nextFrame = 0
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
    frames.set(++nextFrame, cb)
    return nextFrame
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => { frames.delete(id) })
})
afterEach(() => {
  window.dispatchEvent(new Event('blur'))
  target.remove()
  vi.restoreAllMocks()
})
function pointer(type: string, x: number, id = 1, buttons = 1) {
  window.dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: x, clientY: x + 10, buttons }))
}
const down = { pointerId: 1, clientX: 0, clientY: 10 }

it('tracks immediately, outside the handle, and processes only the latest point per frame', () => {
  const move = vi.fn()
  const end = vi.fn()
  startResizeDrag(target, down, 'col-resize', move, end)
  expect(target.setPointerCapture).toHaveBeenCalledWith(1)
  pointer('pointermove', 100)
  pointer('pointermove', 200)
  pointer('pointermove', 900)
  pointer('pointermove', 123, 2)
  expect(move).not.toHaveBeenCalled()
  expect(frames.size).toBe(1)
  ;[...frames.values()][0](0)
  expect(move).toHaveBeenCalledExactlyOnceWith({ clientX: 900, clientY: 910 })
  pointer('pointerup', 1000)
  expect(move).toHaveBeenLastCalledWith({ clientX: 1000, clientY: 1010 })
  expect(end).toHaveBeenCalledTimes(1)
  pointer('pointermove', 1200)
  expect(move).toHaveBeenCalledTimes(2)
})

it('flushes release before a delayed frame, restoring selection and cursor exactly once', () => {
  document.body.style.cursor = 'crosshair'
  document.body.style.userSelect = 'text'
  document.body.style.webkitUserSelect = 'text'
  const move = vi.fn()
  const end = vi.fn()
  const stop = startResizeDrag(target, down, 'row-resize', move, end)
  pointer('pointermove', 100)
  pointer('pointerup', 250)
  expect(move).toHaveBeenCalledExactlyOnceWith({ clientX: 250, clientY: 260 })
  expect(frames.size).toBe(0)
  stop()
  expect(end).toHaveBeenCalledTimes(1)
  expect(target.releasePointerCapture).toHaveBeenCalledWith(1)
  expect(document.body.style.cursor).toBe('crosshair')
  expect(document.body.style.userSelect).toBe('text')
  expect(document.body.style.webkitUserSelect).toBe('text')
})

it.each(['pointercancel', 'lostpointercapture', 'blur', 'unmount', 'missed-release'])('ends on %s without leaving listeners or a pending frame', reason => {
  const move = vi.fn()
  const end = vi.fn()
  const stop = startResizeDrag(target, down, 'col-resize', move, end)
  pointer('pointermove', 60)
  pointer('pointercancel', 0, 2)
  expect(end).not.toHaveBeenCalled()
  if (reason === 'lostpointercapture') target.dispatchEvent(new PointerEvent(reason, { pointerId: 1 }))
  else if (reason === 'blur') window.dispatchEvent(new Event('blur'))
  else if (reason === 'unmount') stop()
  else if (reason === 'missed-release') pointer('pointermove', 60, 1, 0)
  else pointer(reason, 0)
  expect(move).toHaveBeenCalledExactlyOnceWith({ clientX: 60, clientY: 70 })
  expect(end).toHaveBeenCalledTimes(1)
  expect(frames.size).toBe(0)
  pointer('pointerup', 90)
  pointer('pointermove', 100)
  expect(move).toHaveBeenCalledTimes(1)
})

it('still tracks if pointer capture is unavailable', () => {
  target.setPointerCapture = () => { throw new Error('capture unavailable') }
  const move = vi.fn()
  startResizeDrag(target, down, 'col-resize', move, vi.fn())
  pointer('pointerup', 180)
  expect(move).toHaveBeenCalledExactlyOnceWith({ clientX: 180, clientY: 190 })
})
