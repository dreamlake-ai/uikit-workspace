import { useCallback, useEffect, useRef } from 'react'
import {
  normalizeTree,
  reseedCounters,
  unwrapLayout,
  wrapLayout,
  type PanelNode,
} from './panel-tree'

/**
 * usePersistedPanelLayout — save a layout and get it back, correctly.
 *
 * Every step below is there because the obvious version of it is wrong:
 *
 *  • UNWRAP BEFORE YOU VALIDATE. Saved layouts are wrapped in a `{ v, root }`
 *    envelope, which has no top-level `kind`. Shape-check the raw blob first and
 *    you reject every layout saved under the current format — silently wiping
 *    the user's layout on upgrade. `unwrapLayout` also accepts a bare tree from
 *    before the envelope existed.
 *
 *  • MIGRATE ON THE WAY IN. A blob on disk may predate the current schema, so it
 *    runs through `normalizeTree` (backfills per-leaf instance ids, re-clamps a
 *    stale active tab, collapses a group that lost its siblings).
 *
 *  • RESEED THE COUNTERS. Node ids come from a module counter that restarts at a
 *    fixed value each load. Restore a tree with higher ids and the next panel
 *    you create collides with one already on screen — two panels answering to
 *    the same id. `reseedCounters` lifts the counter past the restored tree.
 *
 *  • COALESCE WRITES. `onChange` fires on every frame of a divider drag. Writing
 *    synchronously there means a JSON serialise plus a storage write at 60Hz;
 *    the last one of each burst is the only one that matters.
 */
export interface PersistedPanelLayoutOptions {
  /** Storage key. Namespace it per user/workspace if layouts shouldn't be shared. */
  key: string
  /** Tree to use when nothing is saved (or the saved blob is unusable). */
  fallback: () => PanelNode
  /** Where to persist. Defaults to `localStorage`; pass `sessionStorage` (or any
   *  `Storage`) to change that. */
  storage?: Storage
  /**
   * Last word on whether a restored tree is acceptable — run AFTER migration.
   * Return false to fall back, e.g. when the layout must contain the app's
   * primary panel and an older saved tree doesn't.
   */
  validate?: (root: PanelNode) => boolean
  /** Transform the tree before saving — e.g. `scopeSubtree` to persist only the
   *  panels this owner is responsible for. Returning null saves nothing. */
  transform?: (root: PanelNode) => PanelNode | null
  /** Milliseconds to coalesce writes over. Default 150. `0` writes immediately. */
  debounceMs?: number
}

export interface PersistedPanelLayout {
  /** Pass to `<PanelLayout initial={…}>`. Restores, or falls back. */
  initial: () => PanelNode
  /** Pass to `<PanelLayout onChange={…}>`. */
  onChange: (root: PanelNode) => void
  /** Forget the saved layout. Does not touch what's on screen — pair it with
   *  `replaceRoot(…)` to reset the live layout too. */
  clear: () => void
  /**
   * Forget the saved layout AND return a fresh one. Pass it to
   * `<PanelLayout resetTo={…}>`, or call it yourself and hand the result to
   * `replaceRoot`. This is the counterpart to `initial`: that one restores,
   * this one starts over — and Reset must not be wired to the restoring half.
   */
  reset: () => PanelNode
}

function resolveStorage(explicit?: Storage): Storage | null {
  if (explicit) return explicit
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    // Storage can throw on access alone — Safari private mode, blocked cookies.
    return null
  }
}

export function usePersistedPanelLayout(options: PersistedPanelLayoutOptions): PersistedPanelLayout {
  // Options are read through a ref so a caller passing inline closures (the
  // normal thing to do) doesn't get new callbacks on every render.
  const optsRef = useRef(options)
  optsRef.current = options

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<PanelNode | null>(null)

  const write = useCallback(() => {
    const { key, storage, transform } = optsRef.current
    const store = resolveStorage(storage)
    const root = pending.current
    pending.current = null
    if (!store || !root) return
    const toSave = transform ? transform(root) : root
    if (!toSave) return
    try {
      store.setItem(key, JSON.stringify(wrapLayout(toSave)))
    } catch {
      // Quota exceeded, or storage disabled mid-session. A layout is a
      // convenience — never take the app down over it.
    }
  }, [])

  const flush = useCallback(() => {
    if (timer.current != null) {
      clearTimeout(timer.current)
      timer.current = null
    }
    write()
  }, [write])

  // Don't lose the last burst of a drag to an unmount or a tab closing.
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [flush])

  const initial = useCallback((): PanelNode => {
    const { key, storage, fallback, validate } = optsRef.current
    const store = resolveStorage(storage)
    const restored = (() => {
      if (!store) return null
      try {
        const raw = store.getItem(key)
        if (!raw) return null
        // Envelope OR bare legacy tree — unwrap BEFORE the shape guard.
        const root = unwrapLayout(JSON.parse(raw))
        if (!(root as PanelNode | null)?.kind) return null
        const migrated = normalizeTree(root as PanelNode)
        return validate && !validate(migrated) ? null : migrated
      } catch {
        return null
      }
    })()
    const tree = restored ?? fallback()
    // Whichever branch won, the counters must clear the ids now in the tree.
    reseedCounters(tree)
    return tree
  }, [])

  const onChange = useCallback(
    (root: PanelNode) => {
      pending.current = root
      const wait = optsRef.current.debounceMs ?? 150
      if (wait <= 0) {
        write()
        return
      }
      if (timer.current != null) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        timer.current = null
        write()
      }, wait)
    },
    [write],
  )

  const clear = useCallback(() => {
    const { key, storage } = optsRef.current
    if (timer.current != null) {
      clearTimeout(timer.current)
      timer.current = null
    }
    pending.current = null
    try {
      resolveStorage(storage)?.removeItem(key)
    } catch {
      /* nothing to do */
    }
  }, [])

  const reset = useCallback((): PanelNode => {
    clear()
    return optsRef.current.fallback()
  }, [clear])

  return { initial, onChange, clear, reset }
}
