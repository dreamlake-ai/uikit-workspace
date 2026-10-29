// @vitest-environment jsdom
import { act, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MediaTransport, useMediaKeys } from './MediaTransport'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
let container: HTMLDivElement
beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

const byLabel = (label: string) =>
  document.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)

function Player(props: {
  onTogglePlay: () => void
  onStep: (d: -1 | 1) => void
  onSkip: (to: 'start' | 'end') => void
  playing?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useMediaKeys(ref, props)
  return (
    <div ref={ref} tabIndex={0} data-testid="player">
      <MediaTransport playing={!!props.playing} {...props} />
      <input aria-label="note" />
    </div>
  )
}

const key = (el: Element, k: string) =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
  })

describe('MediaTransport', () => {
  it('names each control with its shortcut and reflects play state', () => {
    act(() =>
      root.render(
        <MediaTransport
          playing={false}
          onTogglePlay={() => {}}
          onStep={() => {}}
          onSkip={() => {}}
        />
      )
    )
    expect(byLabel('Play (Space)')).not.toBeNull()
    expect(byLabel('Play (Space)')!.getAttribute('aria-pressed')).toBe('false')
    expect(byLabel('Back one frame (←)')).not.toBeNull()
    expect(byLabel('Forward one frame (→)')).not.toBeNull()
    expect(byLabel('Go to start (Home)')).not.toBeNull()
    expect(byLabel('Go to end (End)')).not.toBeNull()
    expect(document.querySelector('[role="group"]')!.getAttribute('aria-label')).toBe('Playback')
  })

  it('hides step and skip when no handler is given', () => {
    act(() => root.render(<MediaTransport playing onTogglePlay={() => {}} />))
    expect(byLabel('Pause (Space)')).not.toBeNull()
    expect(byLabel('Back one frame (←)')).toBeNull()
    expect(byLabel('Go to start (Home)')).toBeNull()
  })
})

describe('useMediaKeys', () => {
  it('answers Space, arrows and Home/End only inside its own player', () => {
    const onTogglePlay = vi.fn()
    const onStep = vi.fn()
    const onSkip = vi.fn()
    act(() => root.render(<Player onTogglePlay={onTogglePlay} onStep={onStep} onSkip={onSkip} />))
    const player = document.querySelector('[data-testid="player"]')!
    key(player, ' ')
    key(player, 'ArrowLeft')
    key(player, 'ArrowRight')
    key(player, 'Home')
    key(player, 'End')
    expect(onTogglePlay).toHaveBeenCalledTimes(1)
    expect(onStep.mock.calls).toEqual([[-1], [1]])
    expect(onSkip.mock.calls).toEqual([['start'], ['end']])

    // Outside the player nothing fires.
    key(document.body, ' ')
    expect(onTogglePlay).toHaveBeenCalledTimes(1)
  })

  it('leaves typing alone', () => {
    const onTogglePlay = vi.fn()
    const onStep = vi.fn()
    act(() => root.render(<Player onTogglePlay={onTogglePlay} onStep={onStep} onSkip={() => {}} />))
    const input = document.querySelector('input[aria-label="note"]')!
    key(input, ' ')
    key(input, 'ArrowLeft')
    expect(onTogglePlay).not.toHaveBeenCalled()
    expect(onStep).not.toHaveBeenCalled()
  })
})
