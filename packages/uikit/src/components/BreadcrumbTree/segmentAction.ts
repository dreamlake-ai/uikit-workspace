/**
 * What a click on one breadcrumb segment should do.
 *
 * Split out of the component because the rule is easy to state and easy to get
 * wrong, and because the two handlers that used to implement it disagreed:
 * both treated "you are already here" as nothing to do, which left the root
 * segment inert whenever it was the only segment there was. The chevron at the
 * end of the row became the sole way into the tree, and a reader who clicks
 * the name and sees no response concludes it has no children.
 *
 * `environment: 'node'` in this package's vitest config is deliberate — see
 * the comment there — so the rule lives here as a pure function rather than in
 * a test that would need a DOM to click anything.
 */

/** Index of the root segment, which sits before `path[0]`. */
export const ROOT_SEGMENT = -1

export type SegmentAction =
  /** Open (or close) the tree: the click landed on the current location. */
  | { kind: 'toggle' }
  /** Navigate, with the new path the caller should adopt. */
  | { kind: 'navigate'; depth: number }

/**
 * @param index      `ROOT_SEGMENT` for the root, else the index within `path`.
 * @param pathLength How many segments follow the root.
 */
export function segmentAction(index: number, pathLength: number): SegmentAction {
  // The root is the current location only when nothing follows it.
  if (index === ROOT_SEGMENT) {
    return pathLength === 0 ? { kind: 'toggle' } : { kind: 'navigate', depth: 0 }
  }
  // The last segment is where you already are.
  if (index === pathLength - 1) return { kind: 'toggle' }
  return { kind: 'navigate', depth: index + 1 }
}
