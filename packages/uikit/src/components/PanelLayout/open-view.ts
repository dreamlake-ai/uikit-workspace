/**
 * open-view.ts — where a view should open, decided without touching the DOM.
 *
 * "Open the diff panel" is two things stuck together: a DECISION (which panel do
 * we split, on which axis, at what size?) and an EFFECT (call the handle, maybe
 * mount the layout first). The effect is unavoidably messy; the decision is a
 * pure function of the current tree and the user's remembered preference, and
 * pulling it out here makes it testable with no renderer at all.
 *
 * The one DOM-ish input — how wide the target panel currently is — is injected
 * as `widthOf`, so this module stays pure.
 */
import { findLeafByView, type Dir, type PanelNode } from './panel-tree'

/** A remembered per-view open preference. `px` is the width the user last
 *  dragged that view to; absent means "work it out on open". */
export type ViewPref = {
  dir: Dir
  /** Open on the leading side (left / top) of the anchor. */
  before: boolean
  px?: number
}

/** The resolved split, or `{ skip: true }` when the view is already open. */
export type ViewSplit =
  | { skip: true }
  | { targetId: string; dir: Dir; before: boolean | undefined; fraction: number | undefined }

export interface ResolveViewSplitOptions {
  /** The live tree, or null when the layout isn't mounted yet. */
  root: PanelNode | null
  /** The view being opened. */
  view: string
  /** Panel to split when the anchor isn't there (or the tree is null). */
  fallbackLeafId: string
  /** The view new panels open ALONGSIDE — usually the app's primary surface.
   *  Omitted, every open lands on `fallbackLeafId`. */
  anchorView?: string
  /** Remembered per-view preferences, keyed by view. */
  prefs?: Record<string, ViewPref>
  /** Current pixel width of a panel. Only consulted when a pref carries `px`. */
  widthOf?: (leafId: string) => number
}

/**
 * Resolve where `view` should open.
 *
 * - Already in the tree ⇒ `{ skip: true }`. This is what makes opening
 *   IDEMPOTENT: a deferred open that re-runs after the view exists is a no-op
 *   rather than a second copy. Views opened this way are singletons by
 *   construction — one panel per view.
 * - Otherwise split the `anchorView` panel when present, else `fallbackLeafId`.
 * - A remembered `px` is converted to a fraction of the target's CURRENT width,
 *   so restoring a width works at any window size. A zero/unknown width (the
 *   layout hasn't been laid out yet) drops the fraction rather than dividing by
 *   zero, leaving the caller on its own default.
 */
export function resolveViewSplit(opts: ResolveViewSplitOptions): ViewSplit {
  const { root, view, fallbackLeafId, anchorView, prefs = {}, widthOf } = opts

  if (root && findLeafByView(root, view)) return { skip: true }

  const anchor = root && anchorView ? findLeafByView(root, anchorView) : null
  const targetId = anchor?.id ?? fallbackLeafId
  const pref = prefs[view]

  let fraction: number | undefined
  if (pref?.px != null && widthOf) {
    const w = widthOf(targetId)
    if (w > 0) fraction = pref.px / w
  }

  return { targetId, dir: pref?.dir ?? 'row', before: pref?.before, fraction }
}
