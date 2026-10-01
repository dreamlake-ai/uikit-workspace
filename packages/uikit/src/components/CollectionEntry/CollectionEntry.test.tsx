// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { CollectionEntry } from './CollectionEntry'

// ─────────────────────────────────────────────────────────────────────────────
// What the component PROMISES a host: a real button whose disclosure semantics
// (aria-expanded, toggle-on-click, host-preventable) track the props, and a
// stack whose depth tells the truth about small counts. The visual fan is CSS
// and stays untested; the wiring beneath it is what can fail silently.
// ─────────────────────────────────────────────────────────────────────────────

let root: Root
let container: HTMLDivElement

beforeEach(() => {
  ;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

const render = (ui: React.ReactElement) => act(() => root.render(ui))
const button = () => container.querySelector('button')!

it('renders a plain actionable button when no disclosure props are given', () => {
  render(<CollectionEntry label="All Bindrs" />)
  expect(button().type).toBe('button')
  expect(button().hasAttribute('aria-expanded')).toBe(false)
  expect(button().textContent).toContain('All Bindrs')
})

it('exposes aria-expanded and toggles through onExpandedChange', () => {
  const calls: boolean[] = []
  render(
    <CollectionEntry label="All Bindrs" expanded={false} onExpandedChange={(v) => calls.push(v)} />
  )
  expect(button().getAttribute('aria-expanded')).toBe('false')
  act(() => button().click())
  expect(calls).toEqual([true])

  render(
    <CollectionEntry label="All Bindrs" expanded onExpandedChange={(v) => calls.push(v)} />
  )
  expect(button().getAttribute('aria-expanded')).toBe('true')
  act(() => button().click())
  expect(calls).toEqual([true, false])
})

it('lets a host onClick preventDefault to suppress the toggle', () => {
  const calls: boolean[] = []
  render(
    <CollectionEntry
      label="All Bindrs"
      expanded={false}
      onExpandedChange={(v) => calls.push(v)}
      onClick={(e) => e.preventDefault()}
    />
  )
  act(() => button().click())
  expect(calls).toEqual([])
})

it('shows the count and caps the stack at three cards, floor one', () => {
  render(<CollectionEntry label="All Bindrs" count={12} />)
  expect(button().textContent).toContain('12')
  const stack = () => button().querySelector('[aria-hidden]')!
  expect(stack().children.length).toBe(3)

  render(<CollectionEntry label="All Bindrs" count={2} />)
  expect(stack().children.length).toBe(2)

  render(<CollectionEntry label="All Bindrs" count={0} />)
  expect(stack().children.length).toBe(1)
})
