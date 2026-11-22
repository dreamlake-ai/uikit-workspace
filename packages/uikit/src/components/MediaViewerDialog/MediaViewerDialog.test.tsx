// @vitest-environment jsdom
import { act, createRef, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MediaViewerDialog } from './MediaViewerDialog'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root
let host: HTMLDivElement
let opener: HTMLButtonElement
beforeEach(() => {
  host = document.createElement('div')
  opener = document.createElement('button')
  document.body.append(opener, host)
  opener.focus()
  document.body.style.overflow = 'auto'
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
  opener.remove()
  document.body.style.overflow = ''
})
const render = (children: ReactNode) => act(() => root.render(children))
const viewer = (name: string) =>
  document.querySelector(`[role="dialog"][aria-label="${name}"]`) as HTMLElement
const key = (name: string, shiftKey = false) =>
  act(() =>
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: name, shiftKey, bubbles: true, cancelable: true })
    )
  )

describe('MediaViewerDialog', () => {
  it('locks scrolling, cycles keyboard focus and returns focus on close', () => {
    const initialFocus = createRef<HTMLButtonElement>()
    render(
      <MediaViewerDialog title="Media" onClose={vi.fn()} initialFocus={initialFocus}>
        <button ref={initialFocus}>Play</button>
      </MediaViewerDialog>
    )
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.activeElement).toBe(initialFocus.current)
    key('Tab', true)
    const close = viewer('Media').querySelector('[aria-label="Close"]')
    expect(document.activeElement).toBe(close)
    key('Tab')
    expect(document.activeElement).toBe(initialFocus.current)
    render(null)
    expect(document.body.style.overflow).toBe('auto')
    expect(document.activeElement).toBe(opener)
  })

  it('blocks every dismissal while pending, then uses the latest close callback', () => {
    const onClose = vi.fn(),
      updated = vi.fn()
    render(
      <MediaViewerDialog title="Pending" onClose={onClose} dismissible={false}>
        <div>Uploading</div>
      </MediaViewerDialog>
    )
    key('Escape')
    act(() => viewer('Pending').click())
    act(() =>
      (viewer('Pending').querySelector('[aria-label="Close"]') as HTMLButtonElement).click()
    )
    expect(onClose).not.toHaveBeenCalled()
    render(
      <MediaViewerDialog title="Pending" onClose={updated}>
        <div>Uploaded</div>
      </MediaViewerDialog>
    )
    key('Escape')
    expect(updated).toHaveBeenCalledOnce()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('dismisses only the top portal when nested clicks bubble through React parents', () => {
    const parentClose = vi.fn(),
      childClose = vi.fn()
    const view = (nested: boolean) => (
      <MediaViewerDialog title="Parent" onClose={parentClose}>
        <button>Open</button>
        {nested && (
          <MediaViewerDialog title="Child" onClose={childClose}>
            <div>Child media</div>
          </MediaViewerDialog>
        )}
      </MediaViewerDialog>
    )
    render(view(false))
    render(view(true))
    act(() => viewer('Child').click())
    expect(childClose).toHaveBeenCalledOnce()
    expect(parentClose).not.toHaveBeenCalled()
    key('Escape')
    expect(childClose).toHaveBeenCalledTimes(2)
    expect(parentClose).not.toHaveBeenCalled()
    render(view(false))
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.activeElement).toBe(viewer('Parent'))
    render(null)
    expect(document.body.style.overflow).toBe('auto')
    expect(document.activeElement).toBe(opener)
  })

  it('keeps scrolling locked and top focus when an underlying viewer disappears first', () => {
    const view = (first: boolean, second: boolean) => (
      <>
        {first && (
          <MediaViewerDialog key="first" title="First" onClose={vi.fn()}>
            <div>First</div>
          </MediaViewerDialog>
        )}
        {second && (
          <MediaViewerDialog key="second" title="Second" onClose={vi.fn()}>
            <div>Second</div>
          </MediaViewerDialog>
        )}
      </>
    )
    render(view(true, false))
    render(view(true, true))
    expect(document.activeElement).toBe(viewer('Second'))
    render(view(false, true))
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.activeElement).toBe(viewer('Second'))
    render(null)
    expect(document.body.style.overflow).toBe('auto')
    expect(document.activeElement).toBe(opener)
  })
})
