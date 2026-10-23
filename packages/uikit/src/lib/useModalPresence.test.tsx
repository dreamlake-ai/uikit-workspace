// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, StrictMode, useEffect, useState, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Dialog } from '../components/Dialog/Dialog'
import { Modal, ModalContent } from '../components/Modal/Modal'
import { MODAL_EXIT_FALLBACK_MS } from './useModalPresence'

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

const panel = () => document.querySelector<HTMLElement>('[role="dialog"]')
const backdrop = () => panel()?.parentElement ?? null
const wait = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)))
async function render(node: ReactNode) {
  await act(async () => root.render(node))
}
// jsdom has no AnimationEvent, so React listens for the prefixed name there.
function animationEnd(el: Element, animationName: string) {
  return act(async () => {
    for (const type of ['animationend', 'webkitAnimationEnd']) {
      const event = new Event(type, { bubbles: true })
      Object.defineProperty(event, 'animationName', { value: animationName })
      el.dispatchEvent(event)
    }
  })
}

/** A caller that clears its data on close, like `{target && …}` dialogs. */
function Harness({ initial = null }: { initial?: string | null }) {
  const [target, setTarget] = useState<string | null>(initial)
  const [closes, setCloses] = useState(0)
  return (
    <>
      <button onClick={() => setTarget('alpha')}>Open alpha</button>
      <button onClick={() => setTarget(null)}>Clear</button>
      <output>{closes}</output>
      <Dialog
        open={target !== null}
        onClose={() => {
          setCloses((n) => n + 1)
          setTarget(null)
        }}
        title={target ? `Delete ${target}` : 'Delete'}
        footer={<span>{target ? `footer ${target}` : 'footer'}</span>}
      >
        <p>{target ? `body ${target}` : 'body'}</p>
      </Dialog>
    </>
  )
}
const btn = (text: string) =>
  Array.from(document.querySelectorAll('button')).find((b) => b.textContent === text)!
const closes = () => Number(document.querySelector('output')!.textContent)

it('keeps the closing dialog, inert and with its last open content, until the exit ends', async () => {
  await render(<Harness />)
  await act(async () => btn('Open alpha').click())
  expect(panel()!.dataset.state).toBe('open')
  expect(document.body.style.overflow).toBe('hidden')

  await act(async () => btn('Clear').click())
  const closing = panel()!
  expect(closing.dataset.state).toBe('closed')
  expect(backdrop()!.dataset.state).toBe('closed')
  expect(backdrop()!.hasAttribute('inert')).toBe(true)
  expect(backdrop()!.getAttribute('aria-hidden')).toBe('true')
  // The caller already cleared `target`; the panel still reads as it did.
  expect(closing.textContent).toContain('Delete alpha')
  expect(closing.textContent).toContain('body alpha')
  expect(closing.textContent).toContain('footer alpha')
  // Scroll lock releases when closing starts, as before.
  expect(document.body.style.overflow).toBe('')

  // A descendant's animation bubbling up does not end the exit.
  await animationEnd(closing.querySelector('p')!, 'uikit-modal-out')
  expect(panel()).toBe(closing)
  await animationEnd(closing, 'uikit-modal-out')
  expect(panel()).toBeNull()
})

it('ignores Escape and backdrop clicks while closing, and unmounts on the fallback timer', async () => {
  await render(<Harness />)
  await act(async () => btn('Open alpha').click())
  await act(async () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  })
  expect(closes()).toBe(1)
  await act(async () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  })
  await act(async () => backdrop()!.click())
  expect(closes()).toBe(1)
  expect(panel()).not.toBeNull()
  await wait(MODAL_EXIT_FALLBACK_MS + 20)
  expect(panel()).toBeNull()
})

it('reopens an exiting dialog in place and the old exit never unmounts it', async () => {
  await render(<Harness />)
  await act(async () => btn('Open alpha').click())
  const first = panel()
  await act(async () => btn('Clear').click())
  await wait(MODAL_EXIT_FALLBACK_MS / 2)
  await act(async () => btn('Open alpha').click())
  expect(panel()).toBe(first)
  expect(panel()!.dataset.state).toBe('open')
  expect(backdrop()!.hasAttribute('inert')).toBe(false)
  // A late exit animationend from before the reopen is ignored.
  await animationEnd(panel()!, 'uikit-modal-out')
  await wait(MODAL_EXIT_FALLBACK_MS + 20)
  expect(panel()).toBe(first)
  expect(document.body.style.overflow).toBe('hidden')
})

it('starts each interrupting animation from the pose on screen; a fresh open does not', async () => {
  await render(<Harness />)
  await act(async () => btn('Open alpha').click())
  expect(panel()!.style.getPropertyValue('--uikit-modal-from-opacity')).toBe('')

  const real = window.getComputedStyle.bind(window)
  const pose = { opacity: '0.42', transform: 'matrix(0.91, 0, 0, 0.91, 0, 0)' }
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
    const cs = real(el)
    if (el === panel())
      return { ...cs, opacity: pose.opacity, transform: pose.transform } as CSSStyleDeclaration
    if (el === backdrop())
      return { ...cs, backgroundColor: 'rgba(0, 0, 0, 0.2)' } as CSSStyleDeclaration
    return cs
  })
  await act(async () => btn('Clear').click())
  expect(panel()!.style.getPropertyValue('--uikit-modal-from-opacity')).toBe('0.42')
  expect(panel()!.style.getPropertyValue('--uikit-modal-from-transform')).toBe(pose.transform)
  expect(backdrop()!.style.getPropertyValue('--uikit-modal-scrim-from')).toBe('rgba(0, 0, 0, 0.2)')
  // The consumer-facing width/lineHeight survive the pose variables.
  expect(panel()!.style.width).toBe('480px')

  pose.opacity = '0.3'
  pose.transform = 'matrix(0.97, 0, 0, 0.97, 0, 0)'
  await act(async () => btn('Open alpha').click())
  expect(panel()!.dataset.state).toBe('open')
  expect(panel()!.style.getPropertyValue('--uikit-modal-from-opacity')).toBe('0.3')
  // A late end of the interrupted exit must not reset the running enter.
  await animationEnd(panel()!, 'uikit-modal-out')
  expect(panel()!.style.getPropertyValue('--uikit-modal-from-opacity')).toBe('0.3')

  await act(async () => btn('Clear').click())
  await wait(MODAL_EXIT_FALLBACK_MS + 20)
  expect(panel()).toBeNull()
  await act(async () => btn('Open alpha').click())
  expect(panel()!.style.getPropertyValue('--uikit-modal-from-opacity')).toBe('')
  expect(panel()!.style.getPropertyValue('--uikit-modal-from-transform')).toBe('')
})

it('enters on an initial-open mount under StrictMode and still completes its exit', async () => {
  await render(
    <StrictMode>
      <Harness initial="alpha" />
    </StrictMode>
  )
  expect(panel()!.dataset.state).toBe('open')
  expect(panel()!.style.getPropertyValue('--uikit-modal-from-opacity')).toBe('')
  await act(async () => btn('Clear').click())
  expect(panel()!.dataset.state).toBe('closed')
  await wait(MODAL_EXIT_FALLBACK_MS + 20)
  expect(panel()).toBeNull()
})

it('mounts no children while closed, so an always-rendered Dialog loads nothing', async () => {
  const mounted = vi.fn()
  function Loader() {
    useEffect(() => mounted(), [])
    return null
  }
  function Example() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button onClick={() => setOpen((v) => !v)}>Toggle</button>
        <Dialog open={open} onClose={() => setOpen(false)}>
          <Loader />
        </Dialog>
      </>
    )
  }
  await render(<Example />)
  expect(mounted).not.toHaveBeenCalled()
  await act(async () => btn('Toggle').click())
  expect(mounted).toHaveBeenCalledTimes(1)
  // Closing keeps the same instance through the exit; no second load.
  await act(async () => btn('Toggle').click())
  await wait(MODAL_EXIT_FALLBACK_MS + 20)
  expect(panel()).toBeNull()
  expect(mounted).toHaveBeenCalledTimes(1)
})

it("runs a forwarded callback ref's returned cleanup on detach, as React 19 does", async () => {
  const calls: (HTMLElement | null)[] = []
  const cleanup = vi.fn()
  const ref = (el: HTMLDivElement | null) => {
    calls.push(el)
    return cleanup
  }
  function Example() {
    const [open, setOpen] = useState(true)
    return (
      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent ref={ref}>
          <p>body</p>
        </ModalContent>
      </Modal>
    )
  }
  await render(<Example />)
  const el = panel()!
  expect(calls).toEqual([el])
  await act(async () =>
    document.querySelector<HTMLButtonElement>('[data-slot="modal-close"]')!.click()
  )
  await wait(MODAL_EXIT_FALLBACK_MS + 20)
  expect(panel()).toBeNull()
  expect(cleanup).toHaveBeenCalledTimes(1)
  // React 19 runs the cleanup instead of calling the ref with null.
  expect(calls).toEqual([el])
})

it("ModalContent keeps the consumer's ref, style and animation callback", async () => {
  const ref = { current: null as HTMLDivElement | null }
  const onAnimationEnd = vi.fn()
  function Example() {
    const [open, setOpen] = useState(true)
    return (
      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent ref={ref} style={{ color: 'red' }} onAnimationEnd={onAnimationEnd}>
          <p>{open ? 'live' : 'cleared'}</p>
        </ModalContent>
      </Modal>
    )
  }
  await render(<Example />)
  const el = panel()!
  expect(ref.current).toBe(el)
  expect(el.classList.contains('uikit-panel-in')).toBe(false)
  await act(async () =>
    document.querySelector<HTMLButtonElement>('[data-slot="modal-close"]')!.click()
  )
  expect(el.dataset.state).toBe('closed')
  expect(el.style.color).toBe('red')
  expect(el.textContent).toContain('live')
  await animationEnd(el, 'uikit-modal-out')
  expect(onAnimationEnd).toHaveBeenCalledTimes(1)
  expect(panel()).toBeNull()
  expect(ref.current).toBeNull()
})

it('styles.css: enter leaves no transform behind and reduced motion never scales', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')
  const rule = (selector: string, from = 0) => {
    const at = css.indexOf(`${selector} {`, from)
    expect(at).toBeGreaterThan(-1)
    return css.slice(at, css.indexOf('}', at))
  }
  const keyframes = (name: string) => {
    const at = css.indexOf(`@keyframes ${name} {`)
    expect(at).toBeGreaterThan(-1)
    return css.slice(at, css.indexOf('\n}', at))
  }
  for (const s of [
    '.uikit-modal-panel[data-state="open"]',
    '.uikit-modal-backdrop[data-state="open"]',
  ])
    expect(rule(s)).toMatch(/ backwards;/)
  expect(css).not.toMatch(/will-change/)

  const reduced = css.indexOf('@media (prefers-reduced-motion: reduce) {\n  .uikit-modal-panel')
  expect(reduced).toBeGreaterThan(-1)
  expect(rule('.uikit-modal-panel[data-state="open"]', reduced)).toMatch(/uikit-modal-fade-in /)
  expect(rule('.uikit-modal-panel[data-state="closed"]', reduced)).toMatch(/uikit-modal-fade-out /)
  for (const name of ['uikit-modal-fade-in', 'uikit-modal-fade-out'])
    expect(keyframes(name)).not.toMatch(/transform|scale/)
})
