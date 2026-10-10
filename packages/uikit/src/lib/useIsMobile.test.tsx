// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useIsMobile } from './useIsMobile'

let root: Root
let container: HTMLDivElement
let viewport: number
let queries: { media: string; matches: boolean; listeners: Set<() => void> }[]
beforeEach(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  viewport = 900
  queries = []
  vi.stubGlobal('matchMedia', vi.fn((media: string) => {
    const query = { media, matches: viewport <= Number(media.match(/([\d.]+)px/)![1]), listeners: new Set<() => void>() }
    queries.push(query)
    return Object.assign(query, {
      addEventListener: (_: string, listener: () => void) => query.listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => query.listeners.delete(listener),
    })
  }))
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

function Probe({ breakpoint, onRender }: { breakpoint?: number; onRender?: (value: boolean) => void }) {
  const narrow = useIsMobile(breakpoint)
  onRender?.(narrow)
  return <span>{String(narrow)}</span>
}

it('keeps the default 768px breakpoint and initializes from matchMedia after the first render', () => {
  viewport = 600
  const renders = vi.fn()
  act(() => root.render(<Probe onRender={renders} />))
  expect(queries[0].media).toBe('(max-width: 767px)')
  expect(renders.mock.calls[0][0]).toBe(false)
  expect(container.textContent).toBe('true')
})

it('matches a custom breakpoint and responds to media changes', () => {
  act(() => root.render(<Probe breakpoint={1024} />))
  expect(queries[0].media).toBe('(max-width: 1023px)')
  expect(container.textContent).toBe('true')
  act(() => {
    queries[0].matches = false
    queries[0].listeners.forEach(listener => listener())
  })
  expect(container.textContent).toBe('false')
})

it('replaces the subscription when breakpoint changes and cleans up on unmount', () => {
  act(() => root.render(<Probe breakpoint={1024} />))
  expect(container.textContent).toBe('true')
  act(() => root.render(<Probe breakpoint={768} />))
  expect(queries[0].listeners.size).toBe(0)
  expect(queries[1].listeners.size).toBe(1)
  expect(container.textContent).toBe('false')
  act(() => root.render(null))
  expect(queries[1].listeners.size).toBe(0)
})

it('returns false during server rendering without accessing window', () => {
  const browserWindow = globalThis.window
  vi.stubGlobal('window', undefined)
  try {
    expect(renderToString(<Probe breakpoint={1024} />)).toBe('<span>false</span>')
  } finally {
    vi.stubGlobal('window', browserWindow)
  }
  expect(queries).toHaveLength(0)
})
