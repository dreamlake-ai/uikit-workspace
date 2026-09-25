import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ForwardedRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { cn } from '../../lib/utils'
import {
  DEFAULT_PALETTE,
  PanelConfigContext,
  TAB_DRAG_THRESHOLD_PX,
  tintFor,
  type PanelConfig,
} from './config'
import { RenderNode } from './RenderNode'
import { PersistentPanels } from './PersistentPanels'
import { ROOT_PANEL_BOX, type PanelBox } from './panel-box'
import {
  applyActivateTab,
  applyClose,
  applyDock,
  applyResize,
  applySplit,
  buildInitial,
  dockRect,
  dockSideFromPoint,
  findLeaf,
  firstLeafId,
  makeLeaf,
  normalizeTree,
  reseedCounters,
  MAX_NEW_PANEL_PX,
  type Dir,
  type DockSide,
  type LeafNode,
  type PanelNode,
  type PanelRect,
} from './panel-tree'
import type { ClosablePredicate, LeafClassName, LeafRenderer, TabbablePredicate } from './types'

// ---------------------------------------------------------------------------
// PanelLayout — a recursive tiling panel workspace.
//
//  • A `leaf` is a single panel.
//  • A `split` lays its children out in one direction (`row` = side by side,
//    `column` = stacked) and stores each child's size as a percentage.
//  • A `group` is a flat tab bar of leaves sharing one region.
//
// Keyboard (see `splitShortcut`):
//   ⌘/Ctrl + D          → split the focused panel horizontally (new panel right)
//   ⌘/Ctrl + Shift + D  → split the focused panel vertically   (new panel below)
//
// Dragging a divider shows a light pill that rides along the border under the
// cursor. Each panel header carries a grab handle you can drag onto another
// panel to dock it against an edge — or, in the panel's centre, to merge it into
// that panel as a tab.
//
// This file owns the React render plus the pointer/keyboard wiring. The tree
// itself is pure and lives in `panel-tree.ts`.
//
// SSR: the layout mints node ids from module-level counters, so a tree built on
// the server and again on the client would not agree. Render it client-only (or
// hand it a tree with fixed ids) if the host does server rendering.
// ---------------------------------------------------------------------------

type DragState = {
  /** False while the pointer is down but hasn't travelled far enough to be a
   *  drag. An unarmed drag paints nothing and commits nothing. */
  armed: boolean
  srcId: string
  label: string
  tint: string
  grabDX: number // cursor offset within the source panel at grab time
  grabDY: number
  srcW: number
  srcH: number
  x: number // current cursor position
  y: number
  target: { id: string; side: DockSide; rect: PanelRect } | null
}

/** One leaf's identity plus its live pixel rect — what `inspect()` returns. */
export type PanelLeafInfo = {
  id: string
  view?: string
  title?: string
  rect: { left: number; top: number; width: number; height: number }
  /** Source pointer of the panel's root element, when the host's build stamps
   *  `data-loc` attributes. Omitted otherwise — treat it as optional. */
  loc?: string
}

export interface PanelLayoutHandle {
  /** Split `leafId` along `dir`, seeding the new panel with `view`/`title`.
   *  `before` puts the new panel first; `size` is the new panel's fraction of the
   *  slot (auto-computed for row splits when omitted). */
  splitWith: (
    leafId: string,
    dir: Dir,
    view?: string,
    title?: string,
    before?: boolean,
    size?: number,
    contentMax?: number
  ) => void
  getRoot: () => PanelNode
  /** Replace the entire layout at runtime (e.g. switching workspaces). */
  replaceRoot: (tree: PanelNode) => void
  /** Walks the live DOM to return each leaf with its current pixel rect. */
  inspect: () => PanelLeafInfo[]
  /** Close the leaf with the given id. */
  closeLeaf: (id: string) => void
  /** Mark a leaf as the focused panel (targets keyboard splits at it). No-op if
   *  the id isn't a live leaf. */
  focusLeaf: (id: string) => void
}

export interface PanelLayoutProps {
  /** Layout-owned tabs; keep view DOM connected across moves. */
  tabbed?: boolean
  /** Show a tab for a lone view only when its content opts in. Groups always show tabs. */
  showSingleTab?: ClosablePredicate
  /** Host disposal guard. Called for every user close affordance. */
  onRequestClose?: (id: string) => void
  // ── the tree ────────────────────────────────────────────────────────────
  /** Build the initial tree (uncontrolled). Called once, on mount. Compose it
   *  with `panelLeaf` / `panelSplit`. */
  initial?: () => PanelNode
  /** Without `initial`: `true` starts with one panel, `false` with a 3-panel demo. */
  initialSingle?: boolean
  /** Controlled mode: when set, this IS the tree and the layout never mutates its
   *  own state — every change arrives through `onChange` for the host to apply. */
  root?: PanelNode
  /** Fires on every tree mutation (split/close/resize/dock/reset). Use this for
   *  persisting the layout. Cause is intentionally not exposed — to tell a user
   *  drag from a programmatic change, subscribe to `onResize` instead. */
  onChange?: (root: PanelNode) => void
  onFocusedLeafChange?: (leaf: LeafNode) => void
  /** Fires ONLY when the user drags a divider — the one signal that actually
   *  expresses "I want this panel at this size". Split/close/dock produce
   *  computed sizes that should not be confused with user intent. */
  onResize?: (root: PanelNode) => void

  // ── content ─────────────────────────────────────────────────────────────
  /** Optional identity/eyebrow content inside a tab. */
  renderTab?: LeafRenderer
  renderBody?: LeafRenderer
  renderHeader?: LeafRenderer

  // ── chrome ──────────────────────────────────────────────────────────────
  /** Show the built-in toolbar (title, shortcut hints, Reset). Default false —
   *  a layout shouldn't inject a title bar into a host's chrome uninvited. */
  showToolbar?: boolean
  /** Replace the built-in toolbar's contents. Implies `showToolbar`. */
  toolbar?: ReactNode
  /**
   * What the toolbar's Reset button builds. Defaults to `initial` — which is
   * right only while `initial` means "a fresh layout". The moment `initial`
   * RESTORES one (as `usePersistedPanelLayout` does), the two part company:
   * Reset would hand back the very layout the user is trying to get rid of.
   * Point this at the fresh tree instead — `usePersistedPanelLayout().reset`
   * forgets the saved layout and returns the fallback.
   */
  resetTo?: () => PanelNode
  className?: string

  // ── policy seams ────────────────────────────────────────────────────────
  /** Which views may share a tab group. Default: every view may. Returning false
   *  makes a view a SINGLETON — the centre/tab drop zone is suppressed for it, in
   *  both the live drag preview and the drop itself. */
  isTabbable?: TabbablePredicate
  /** Which panels may be dismissed. Default: every panel may. Returning false
   *  withholds that leaf's close affordances AND refuses those closes — see
   *  `ClosablePredicate`. The imperative handle's `closeLeaf` is not gated by
   *  it, so a host can still take a panel away on its own terms. */
  closable?: ClosablePredicate
  /** The app's PRIMARY view. When a panel closes next to a leaf carrying it, that
   *  leaf absorbs the whole freed slot, so the primary column recovers its width
   *  as auxiliary panels are dismissed. Default: every sibling grows
   *  proportionally. */
  primaryView?: string
  /** Extra classes on a leaf's root. APPENDED to the defaults and resolved by
   *  tailwind-merge, so returning `bg-transparent` overrides the default opaque
   *  fill for that panel. */
  leafClassName?: LeafClassName
  /** Extra classes on a leaf's header band. APPENDED (as `leafClassName`). */
  headerClassName?: LeafClassName
  /** REPLACES the overflow policy on the wrapper around `renderHeader`'s output
   *  (default `overflow-hidden`). For a header that must let something escape
   *  vertically — a tab strip whose active tab notches the border, say. */
  headerContentClassName?: LeafClassName
  /** The box the ROOT of the tree occupies, as CSS math. Default reads
   *  `--panel-area-x` / `--panel-area-w`; pass your own to use different names. */
  rootBox?: PanelBox
  /** Class applied to the header of a leaf that has BOTH a custom header and a
   *  `contentMax`, in place of the default flush-left padding — the hook for a
   *  host whose panels share a viewport-centered content column. */
  contentColumnHeaderClass?: string
  /** Tints for placeholder panels (and the drag surrogate's dot). */
  palette?: readonly string[]
  /** ⌘/Ctrl + `key` splits the focused panel (⇧ = vertical). `false` removes the
   *  window listener entirely. Default `{ key: 'd' }`. */
  splitShortcut?: false | { key?: string }
}

export const PanelLayout = forwardRef<PanelLayoutHandle, PanelLayoutProps>(function PanelLayout(
  {
    initial,
    initialSingle = false,
    tabbed = false,
    showSingleTab,
    onRequestClose,
    root: rootProp,
    onChange,
    onFocusedLeafChange,
    onResize,
    renderTab,
    renderBody,
    renderHeader,
    showToolbar = false,
    toolbar,
    resetTo,
    className,
    isTabbable,
    closable,
    primaryView,
    leafClassName,
    headerClassName,
    headerContentClassName,
    rootBox = ROOT_PANEL_BOX,
    contentColumnHeaderClass,
    palette = DEFAULT_PALETTE,
    splitShortcut = { key: 'd' },
  }: PanelLayoutProps,
  ref: ForwardedRef<PanelLayoutHandle>
) {
  const controlled = rootProp !== undefined
  const [internalRoot, setInternalRoot] = useState<PanelNode>(() => {
    const seed = rootProp ?? (initial ? initial() : buildInitial(initialSingle))
    // The SAME treatment `replaceRoot` gives an incoming tree, because `initial`
    // is just as likely to be handing us one off disk. Skipping it here meant a
    // restored layout kept the id counters at their start-of-page values — and
    // since a previous session minted its ids from those same counters, the very
    // next panel the user opened was handed an id already in the tree. Two
    // panels, one id: `findLeaf`, `applySplit` and every `data-leaf-id` lookup
    // then silently operate on whichever one they reach first.
    // `normalizeTree` is idempotent and cheap, so a tree that needs neither pays
    // almost nothing.
    const migrated = normalizeTree(seed)
    reseedCounters(migrated)
    return migrated
  })
  const root = controlled ? rootProp : internalRoot
  const [focusedId, setFocusedId] = useState<string>(() => firstLeafId(root))
  // Active drag: the floating surrogate + where it would dock. `target` is null
  // while the cursor is over the source panel or empty space (the surrogate just
  // tracks the cursor at the panel's own size).
  const [drag, setDrag] = useState<DragState | null>(null)

  // Refs keep the window handlers stable while reading fresh state. Assigning
  // during render is what lets several mutations fired in one tick compose off
  // the latest tree instead of all reusing the pre-render value — and, in
  // controlled mode, what re-syncs the ref to whatever the host handed back.
  // The layout's own root element. Every DOM lookup below is scoped to it:
  // `data-leaf-id` is unique within ONE tree, but a page may mount several
  // layouts, and a document-wide query would happily return another layout's
  // panel — letting a drag in one dock into the other.
  const containerRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef(root)
  rootRef.current = root
  const focusedLeafCallback = useRef(onFocusedLeafChange)
  focusedLeafCallback.current = onFocusedLeafChange
  const focusRef = useRef(focusedId)
  focusRef.current = focusedId
  const dragRef = useRef(drag)
  dragRef.current = drag
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onResizeRef = useRef(onResize)
  onResizeRef.current = onResize
  const isTabbableRef = useRef(isTabbable)
  isTabbableRef.current = isTabbable
  const requestCloseRef = useRef(onRequestClose)
  requestCloseRef.current = onRequestClose
  const closableRef = useRef(closable)
  closableRef.current = closable
  const primaryViewRef = useRef(primaryView)
  primaryViewRef.current = primaryView

  /** Adopt `next` as the tree: sync the ref (so a second mutation this tick sees
   *  it), hold it in state unless the host is driving, and announce it. */
  const commit = (next: PanelNode) => {
    rootRef.current = next
    if (!controlled) setInternalRoot(next)
    onChangeRef.current?.(next)
  }

  const focus = (id: string) => {
    focusRef.current = id
    setFocusedId(id)
    const leaf = findLeaf(rootRef.current, id)
    if (leaf) focusedLeafCallback.current?.(leaf)
  }

  /** Close a leaf, keeping focus on a live one. A tree that empties out is
   *  replaced by a fresh blank panel — the layout always renders something. */
  const closeLeaf = (id: string) => {
    // Nothing to close is not a change. Without this the layout would announce
    // an `onChange` for a tree it never altered, and a host persisting that
    // would write the identical blob back to storage. (Reference equality is no
    // help here: `applyClose` rebuilds a split node even when it removes
    // nothing from it.)
    if (!findLeaf(rootRef.current, id)) return
    const next = applyClose(rootRef.current, id, primaryViewRef.current) ?? makeLeaf()
    commit(next)
    focus(findLeaf(next, focusRef.current) ? focusRef.current : firstLeafId(next))
  }

  /** The close every USER affordance goes through — a header's close button, a
   *  tab's ×, Delete on a focused tab. `closable` is enforced here rather than
   *  only by hiding those buttons, because Delete never touches a button; a
   *  hidden button on its own would be a suggestion. `closeLeaf` above stays
   *  ungated on purpose: it is the host's own tool, and a host closing a panel
   *  itself already knows its policy. */
  const requestClose = (id: string) => {
    const leaf = findLeaf(rootRef.current, id)
    if (leaf && closableRef.current?.(leaf) === false) return
    if (requestCloseRef.current) requestCloseRef.current(id)
    else closeLeaf(id)
  }

  const doSplit = (id: string, dir: Dir) => {
    // Same reasoning as `closeLeaf`: a stale target (the focused panel can
    // outlive the tree it was in — a host `replaceRoot`, or any swap in
    // controlled mode) splits nothing, but `applySplit` still rebuilds an
    // equivalent tree, and committing it would announce a change that never
    // happened.
    if (!findLeaf(rootRef.current, id)) return
    const { node, newId } = applySplit(rootRef.current, id, dir)
    commit(node)
    if (newId) focus(newId)
  }

  const doResize = (splitId: string, index: number, a: number, b: number) => {
    const next = applyResize(rootRef.current, splitId, index, a, b)
    commit(next)
    onResizeRef.current?.(next)
  }

  // Switch which tab shows inside a group. Focus follows, so keyboard splits and
  // the surrogate track the newly-visible leaf.
  const doActivateTab = (groupId: string, leafId: string) => {
    const next = applyActivateTab(rootRef.current, groupId, leafId)
    if (next === rootRef.current) return
    commit(next)
    focus(leafId)
  }

  const doReset = () => {
    const seed = resetTo ? resetTo() : initial ? initial() : buildInitial(initialSingle)
    // Same treatment as `initial` and `replaceRoot`: a host's reset may well
    // hand back a tree it built earlier, so migrate it and lift the counters
    // past its ids before it goes live.
    const fresh = normalizeTree(seed)
    reseedCounters(fresh)
    commit(fresh)
    focus(firstLeafId(fresh))
  }

  useImperativeHandle(
    ref,
    () => ({
      splitWith: (
        targetId: string,
        dir: Dir,
        view?: string,
        title?: string,
        before?: boolean,
        size?: number,
        contentMax?: number
      ) => {
        let fraction = size
        if (fraction == null && dir === 'row') {
          const el = containerRef.current?.querySelector(`[data-leaf-id="${targetId}"]`)
          // A zero width means the panel is not laid out yet (hidden ancestor, or
          // a split fired before first paint). Dividing by it would put NaN into
          // every size in the split, so leave `fraction` undefined and let
          // applySplit fall back to its own default.
          const w = el ? el.getBoundingClientRect().width : 0
          if (w > 0) {
            // Round to 10px so float jitter never varies the fraction between calls.
            const cappedPx = Math.round(Math.min(MAX_NEW_PANEL_PX, w / 2) / 10) * 10
            fraction = cappedPx / w
          }
        }
        const seed = makeLeaf(view, title, contentMax)
        const { node, newId } = applySplit(rootRef.current, targetId, dir, seed, before, fraction)
        commit(node)
        if (newId) focus(newId)
      },
      getRoot: () => rootRef.current,
      replaceRoot: (tree: PanelNode) => {
        // An incoming tree may be a real persisted blob from an older schema —
        // migrate it (backfill instanceId, normalize groups) before it enters the
        // live tree, and lift the id counters past it so newly minted nodes can
        // never collide with the restored ids.
        const migrated = normalizeTree(tree)
        reseedCounters(migrated)
        commit(migrated)
        const first = firstLeafId(migrated)
        if (first) focus(first)
      },
      inspect: (): PanelLeafInfo[] => {
        const results: PanelLeafInfo[] = []
        const walk = (node: PanelNode) => {
          if (node.kind === 'leaf') {
            const el = containerRef.current?.querySelector(`[data-leaf-id="${node.id}"]`)
            const r = el?.getBoundingClientRect()
            // Nearest stamped element at/under the leaf root (selector pointers).
            const loc =
              el?.closest('[data-loc]')?.getAttribute('data-loc') ??
              el?.querySelector('[data-loc]')?.getAttribute('data-loc') ??
              undefined
            results.push({
              id: node.id,
              view: node.view,
              title: node.title,
              rect: r
                ? {
                    left: Math.round(r.left),
                    top: Math.round(r.top),
                    width: Math.round(r.width),
                    height: Math.round(r.height),
                  }
                : { left: 0, top: 0, width: 0, height: 0 },
              ...(loc ? { loc } : {}),
            })
          } else {
            node.children.forEach(walk)
          }
        }
        walk(rootRef.current)
        return results
      },
      closeLeaf,
      focusLeaf: (id: string) => {
        if (!findLeaf(rootRef.current, id)) return // not a live leaf — ignore
        const activate = (node: PanelNode): PanelNode => node.kind === 'group' && node.children.some(c => c.id === id) ? { ...node, activeId: id } : node.kind === 'split' ? { ...node, children: node.children.map(activate) } : node
        commit(activate(rootRef.current))
        focus(id)
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Keyboard splits. Capture phase + stopPropagation so a page-global binding on
  // the same chord does not also fire while we're here.
  const shortcutKey = splitShortcut === false ? null : (splitShortcut.key ?? 'd')
  useEffect(() => {
    if (!shortcutKey) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key.toLowerCase() !== shortcutKey.toLowerCase()) return
      e.preventDefault()
      e.stopPropagation()
      doSplit(focusRef.current, e.shiftKey ? 'column' : 'row')
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcutKey])

  // Drag-to-dock via the header grab handle. Driven with pointer events rather
  // than native DnD so a floating surrogate can follow the cursor and morph into
  // the target's half-rect — the target panels themselves stay unmarked.
  const onHandleDown = (leaf: LeafNode, e: ReactPointerEvent, thresholdPx = 0) => {
    e.preventDefault()
    e.stopPropagation()
    // Two things start a drag, and they sit in different places in the DOM: a
    // panel header's handle (inside the leaf) and a TAB (in the group's tab bar,
    // which is a sibling ABOVE the leaf — so `closest('[data-leaf-id]')` walks
    // straight past it and finds nothing). Fall back to the group region, which
    // is also the only correct source rect for an inactive tab, whose leaf is
    // not mounted at all.
    const from = e.currentTarget as HTMLElement
    const panelEl = (from.closest('[data-leaf-id]') ??
      from.closest('[data-panel-region]')) as HTMLElement | null
    if (!panelEl) return
    const r = panelEl.getBoundingClientRect()
    focus(leaf.id)
    setDrag({
      armed: thresholdPx <= 0,
      srcId: leaf.id,
      label: leaf.title ?? `Panel ${leaf.n}`,
      tint: tintFor(leaf.n, palette),
      grabDX: e.clientX - r.left,
      grabDY: e.clientY - r.top,
      srcW: r.width,
      srcH: r.height,
      x: e.clientX,
      y: e.clientY,
      target: null,
    })
  }

  // While a drag is live, track the cursor on the window: move the surrogate,
  // hit-test the panel underneath (never the source), and commit on release.
  const isDragging = drag !== null
  useEffect(() => {
    if (!isDragging) return

    const onMove = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      const x = e.clientX
      const y = e.clientY
      if (!d.armed) {
        // Still deciding whether this is a click or a drag. Paint nothing and
        // pick no target until the pointer has actually travelled.
        if (Math.hypot(x - d.x, y - d.y) < TAB_DRAG_THRESHOLD_PX) return
        setDrag((prev) => (prev ? { ...prev, armed: true } : prev))
      }
      const el = document.elementFromPoint(x, y) as HTMLElement | null
      const hit = el?.closest('[data-leaf-id]') as HTMLElement | null
      // Ignore a panel belonging to another layout on the same page.
      const panelEl = hit && containerRef.current?.contains(hit) ? hit : null
      let tid = panelEl?.getAttribute('data-leaf-id') || null
      const ownRegion = tid === d.srcId
      if (ownRegion) {
        // A tab may split away from its OWN group. The visible source occupies
        // the group's box; target a remaining sibling after extraction.
        const sibling = (node: PanelNode): string | null => node.kind === 'group'
          ? node.children.some(child => child.id === d.srcId) ? node.children.find(child => child.id !== d.srcId)?.id ?? null : null
          : node.kind === 'split' ? node.children.map(sibling).find(Boolean) ?? null : null
        tid = sibling(rootRef.current)
      }
      let target: DragState['target'] = null
      if (panelEl && tid && tid !== d.srcId) {
        const r = panelEl.getBoundingClientRect()
        // Only offer a centre/tab merge when BOTH the dragged view and the target
        // view are tabbable — else a singleton could be grouped. Gating it here
        // keeps the live preview and the drop resolving to the same side.
        const canTab = isTabbableRef.current
        const tree = rootRef.current
        const srcLeaf = findLeaf(tree, d.srcId)
        const tgtLeaf = findLeaf(tree, tid)
        const allowCenter = !ownRegion && (!canTab || (canTab(srcLeaf?.view) && canTab(tgtLeaf?.view)))
        if (!ownRegion || dockSideFromPoint(r, x, y, true) !== 'center') {
          target = {
            id: tid,
            side: dockSideFromPoint(r, x, y, allowCenter),
            rect: { left: r.left, top: r.top, width: r.width, height: r.height },
          }
        }
      }
      setDrag((prev) => (prev ? { ...prev, x, y, target } : prev))
    }

    const finish = () => {
      const d = dragRef.current
      // Never armed ⇒ the pointer went down and up without travelling: a click.
      // Let it through to the tab's own onClick instead of docking anything.
      if (d?.armed && d.target) {
        // Belt-and-suspenders: even though the side was already gated during the
        // drag, pass the predicate so a `center` can never group a singleton.
        const next = applyDock(
          rootRef.current,
          d.srcId,
          d.target.id,
          d.target.side,
          isTabbableRef.current
        )
        // `applyDock` hands back the identical reference when it declines the
        // move (a vanished source, or a drop onto itself) — don't report that.
        if (next !== rootRef.current) commit(next)
        focus(d.srcId)
      }
      setDrag(null)
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setDrag(null)
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      window.removeEventListener('keydown', onKey, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging])

  // Grab cursor + selection lock, keyed on ARMED rather than on the pointer
  // merely being down — otherwise a plain tab click would flick the cursor to
  // `grabbing` for as long as the button was held.
  const dragArmed = drag?.armed ?? false
  useEffect(() => {
    if (!dragArmed) return
    const prevSelect = document.body.style.userSelect
    const prevCursor = document.body.style.cursor
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'grabbing'
    return () => {
      document.body.style.userSelect = prevSelect
      document.body.style.cursor = prevCursor
    }
  }, [dragArmed])

  const config: PanelConfig = {
    tabbed,
    showSingleTab,
    renderTab,
    renderBody,
    renderHeader,
    leafClassName,
    headerClassName,
    headerContentClassName,
    contentColumnHeaderClass,
    closable,
    palette,
  }

  const withToolbar = showToolbar || toolbar !== undefined

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col h-full min-h-0',
        withToolbar ? 'gap-[10px]' : 'gap-0',
        className
      )}
    >
      {withToolbar && (
        <div className="flex items-center gap-3 shrink-0">
          {toolbar ?? (
            <>
              <span className="text-uikit-ink font-uikit-ui text-[15px] font-bold tracking-[-0.01em]">
                Panels
              </span>
              <span className="text-uikit-muted font-uikit-mono text-[10.5px] opacity-80 tracking-[0.02em]">
                ⌘D split → · ⌘⇧D split ↓ · drag the handle to dock
              </span>
              <span className="flex-1" />
              <button
                type="button"
                onClick={doReset}
                className="text-uikit-muted font-uikit-ui text-[12px] font-semibold px-[11px] py-[5px] rounded-[8px] border border-uikit-rail-stroke bg-uikit-panel cursor-pointer"
              >
                Reset
              </button>
            </>
          )}
        </div>
      )}

      {/* Panel tree */}
      <PanelConfigContext.Provider value={config}>
        <div className="flex-1 min-h-0 min-w-0 flex relative">
          <RenderNode
            node={root}
            box={rootBox}
            draggingId={drag?.armed ? drag.srcId : null}
            onFocus={focus}
            onClose={requestClose}
            onResize={doResize}
            onActivateTab={doActivateTab}
            onHandleDown={onHandleDown}
          />
          {tabbed && <PersistentPanels root={root} rootBox={rootBox} draggingId={drag?.armed ? drag.srcId : null} onFocus={focus} onClose={requestClose} onHandleDown={onHandleDown} />}
        </div>
      </PanelConfigContext.Provider>

      {/* Floating surrogate — follows the cursor at the panel's own size, and
          morphs to the target's half-rect when hovering another panel. */}
      {drag?.armed &&
        (() => {
          const box = drag.target
            ? dockRect(drag.target.rect, drag.target.side)
            : {
                left: drag.x - drag.grabDX,
                top: drag.y - drag.grabDY,
                width: drag.srcW,
                height: drag.srcH,
              }
          return (
            <div
              className={cn(
                'fixed z-[9999] pointer-events-none rounded-[12px] opacity-[0.94] flex items-center justify-center gap-2',
                'bg-[color-mix(in_srgb,var(--uikit-accent)_10%,var(--panel-bg))]',
                'border-[1.5px] border-[color-mix(in_srgb,var(--uikit-accent)_35%,transparent)]'
              )}
              // left/top/width/height are runtime (dockRect or cursor coords);
              // the transition is runtime-conditional on drag.target — both inline.
              style={{
                left: box.left,
                top: box.top,
                width: box.width,
                height: box.height,
                // Morph smoothly when snapping to a target; track instantly when free.
                transition: drag.target
                  ? 'left 130ms ease, top 130ms ease, width 130ms ease, height 130ms ease'
                  : 'none',
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: drag.tint }} />
              <span className="text-uikit-ink font-uikit-ui text-[13px] font-semibold">
                {drag.label}
              </span>
            </div>
          )
        })()}
    </div>
  )
})

export default PanelLayout
