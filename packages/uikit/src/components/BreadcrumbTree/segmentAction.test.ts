import { describe, it, expect } from 'vitest'
import { segmentAction, ROOT_SEGMENT } from './segmentAction'

describe('segmentAction', () => {
  it('opens the tree when the root is the only segment', () => {
    // The case that was broken: at a project's top level the root is where you
    // already are, and the old handler returned early — so the name was inert
    // and the chevron was the only way in.
    expect(segmentAction(ROOT_SEGMENT, 0)).toEqual({ kind: 'toggle' })
  })

  it('navigates to the root from a deeper path', () => {
    expect(segmentAction(ROOT_SEGMENT, 1)).toEqual({ kind: 'navigate', depth: 0 })
    expect(segmentAction(ROOT_SEGMENT, 3)).toEqual({ kind: 'navigate', depth: 0 })
  })

  it('opens the tree when the last segment is clicked', () => {
    expect(segmentAction(0, 1)).toEqual({ kind: 'toggle' })
    expect(segmentAction(2, 3)).toEqual({ kind: 'toggle' })
  })

  it('navigates when an ancestor segment is clicked', () => {
    // path = [a, b, c]; clicking `a` keeps one segment, clicking `b` keeps two.
    expect(segmentAction(0, 3)).toEqual({ kind: 'navigate', depth: 1 })
    expect(segmentAction(1, 3)).toEqual({ kind: 'navigate', depth: 2 })
  })

  it('never answers "navigate to where you already are"', () => {
    // The property behind all of the above: every segment does something, and
    // no click resolves to a destination equal to the current path.
    for (let len = 0; len <= 4; len++) {
      for (let i = ROOT_SEGMENT; i < len; i++) {
        const action = segmentAction(i, len)
        if (action.kind === 'navigate') expect(action.depth).toBeLessThan(len)
      }
    }
  })
})
