import {
  useState,
  useEffect,
  useRef,
  useCallback,
  Fragment,
  ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Folder, ChevronRight, ChevronDown, Loader } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useBreadcrumbTree } from './useBreadcrumbTree'
import type {
  BreadcrumbNode,
  FetchChildrenResult,
  BreadcrumbDragAndDrop,
  BreadcrumbDropTarget,
} from './types'

export interface BreadcrumbTreeProps {
  /** Controlled navigation path, root → leaf. Empty array = nothing selected. */
  path: BreadcrumbNode[]
  /**
   * Fires on every row click (panel stays open) and on breadcrumb item
   * click (panel closes). Caller must update `path` accordingly.
   */
  onNavigate: (node: BreadcrumbNode, newPath: BreadcrumbNode[]) => void
  /**
   * Fetch sub-children at `path` for `page` / `limit`.
   * `path` is slash-separated (e.g. `""` for root, `"datasets/droid-2024"`).
   * When `rootPath` is set the root call becomes `rootPath` and sub-calls become
   * `rootPath/folder/subfolder`.
   */
  fetchChildren: (
    path: string,
    page: number,
    limit: number,
  ) => Promise<FetchChildrenResult>
  /**
   * Optional root prefix shown as the first breadcrumb item.
   * Typically the project or workspace name (e.g. `"my-project"`).
   * When set, all `fetchChildren` calls are prefixed with this value.
   */
  rootPath?: string
  /** Custom empty-state renderer per column. Receives the parent node (null = root). */
  renderEmpty?: (parentNode: BreadcrumbNode | null) => ReactNode
  /** Increment to re-fetch the deepest visible column. */
  refreshKey?: number
  /**
   * Increment to drop the whole column cache (e.g. after the host deletes or
   * renames a node). Visible columns refetch immediately when the panel is
   * open; otherwise they refetch fresh on next open. Optional — consumers that
   * don't mutate the tree can ignore it.
   */
  refreshToken?: number
  /** Placeholder shown in the breadcrumb when path is empty and rootPath is not set. */
  placeholder?: string
  /**
   * Opt in to dragging rows between columns. Omit and the tree behaves
   * exactly as before — no drag handles, no drop targets, no listeners.
   * While a drag is held, dwelling on a row springs its column open, so a
   * node can be walked across to a sibling branch that the breadcrumb
   * could never show at the same time.
   */
  dnd?: BreadcrumbDragAndDrop
  className?: string
}

// ── Internal trigger sub-components ──────────────────────────────────────────

function BreadcrumbItem({
  name,
  isLeaf,
  onClick,
}: {
  name: string
  isLeaf: boolean
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-leaf={isLeaf || undefined}
      className={cn(
        'appearance-none border-0 outline-none bg-transparent p-0 mr-1 cursor-pointer',
        'font-normal leading-[1.1]',
        // Inter Tight has heavy hhea metrics (ascent ~1.33em, descent ~0.33em),
        // which push the baseline to the bottom of any line box tighter than
        // ~1.66em. The visible cap-letters then sit visibly below the row's
        // geometric center. A 1px optical shift restores alignment with the
        // adjacent SVG icons (chevron, expand button).
        '-translate-y-px',
        'transition-[color,opacity] duration-[120ms]',
        // Default: inherits parent muted color & opacity. Leaf: ink + full opacity.
        'data-[leaf]:text-uikit-ink data-[leaf]:opacity-100',
        // Hover: accent + full opacity.
        'hover:text-uikit-accent hover:opacity-100',
      )}
    >
      {name}
    </button>
  )
}

function ChevronToggle({
  open,
  onClick,
}: {
  open: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-open={open || undefined}
      className={cn(
        'group/chev appearance-none border-0 outline-none bg-transparent ml-px p-0.5 rounded cursor-pointer',
        'inline-flex items-center transition-colors duration-[120ms]',
        'text-uikit-muted hover:text-uikit-accent data-[open]:text-uikit-accent',
      )}
    >
      <span
        className={cn(
          'inline-flex transition-transform duration-[220ms]',
          'ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          'group-data-[open]/chev:rotate-180',
        )}
      >
        <ChevronDown size={10} strokeWidth={1.5} />
      </span>
    </button>
  )
}

// ── Column row ────────────────────────────────────────────────────────────────

function TreeRow({
  node,
  selected,
  colIdx,
  rowIdx,
  onClick,
  draggable = false,
  isSource = false,
  dropState = 'none',
  dragActive = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  node: BreadcrumbNode
  selected: boolean
  colIdx: number
  rowIdx: number
  onClick: () => void
  draggable?: boolean
  /** This row is the one being dragged — fades so the cursor reads as the item. */
  isSource?: boolean
  /** 'into' marks this row as the destination; 'blocked' refuses it. */
  dropState?: 'none' | 'into' | 'blocked'
  /** A drag is in flight somewhere in the tree. Selection steps back while it
   *  is, so the only loud thing on screen is the row you would drop into. */
  dragActive?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      draggable={draggable || undefined}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      data-selected={selected || undefined}
      data-source={isSource || undefined}
      data-drop={dropState !== 'none' ? dropState : undefined}
      // Spring-loading navigates, so every row walked through turns
      // "selected". At full strength that trail competes with the one row
      // that actually matters, so it steps back while a drag is in flight.
      data-trail={(dragActive && selected && dropState === 'none') || undefined}
      className={cn(
        'group/row appearance-none border-0 outline-none w-full text-left',
        'flex items-center gap-2 px-2 py-[5px] rounded-[var(--radius)]',
        // `leading-[15.5px]` pins the row's text line-box to the design's
        // height. Without it the row inherits `line-height: 1.5` from the
        // preflight reset, which on 13px text balloons to 19.5px and
        // makes the row taller than the design's spec.
        'font-uikit-ui text-uikit-13 leading-[15.5px] tracking-uikit-snug cursor-pointer',
        'transition-[background-color] duration-[120ms]',
        // Default: ink text, transparent bg.
        'text-uikit-ink bg-transparent font-normal',
        // Hover: ink-6 background.
        'hover:bg-uikit-ink-6',
        // Selected (wins over hover): accent-12 background, weight 500 — but the
        // LABEL stays ink. Accent text on an accent ground repeated down every
        // column reads as a wash of blue on blue; the tint and the weight carry
        // the state, and the folder glyph keeps the accent as the colour cue.
        'data-[selected]:!bg-uikit-accent-12 data-[selected]:text-uikit-ink data-[selected]:font-medium',
        // Drop destination is drawn inline below: a hairline accent ring over a
        // barely-there tint. What separates it from a selected row is the RING,
        // not more colour — so the text stays ink and stays readable, and the
        // panel never picks up a second heavy blue block mid-drag.
        // Refused: say so on the row rather than only via the cursor.
        'data-[drop=blocked]:!bg-transparent data-[drop=blocked]:!opacity-40',
        'data-[drop=blocked]:cursor-no-drop',
        // The row being dragged.
        'data-[source]:!opacity-55',
        // A selected row passed through mid-drag.
        'data-[trail]:!opacity-45',
      )}
      style={{
        // Stagger animation depends on column + row index (runtime).
        animation: `uikit-row-in 240ms ${
          colIdx * 45 + rowIdx * 20
        }ms cubic-bezier(0.2, 0.8, 0.2, 1) both`,
        // Inline, not Tailwind: the arbitrary `shadow-[inset_…]` utility
        // resolved to `box-shadow: none` here, and there is no accent tint
        // below 12% in the token set — too heavy for something that follows
        // the cursor across every row it passes.
        ...(dropState === 'into'
          ? {
              background: 'color-mix(in srgb, var(--uikit-accent) 7%, transparent)',
              boxShadow: 'inset 0 0 0 1.5px var(--uikit-accent)',
              color: 'var(--ink)',
            }
          : null),
      }}
    >
      <Folder
        size={14}
        strokeWidth={1.5}
        className={cn(
          'shrink-0 text-uikit-muted',
          // The glyph keeps the accent on a selected row. What made the panel
          // read blue-on-blue was the LABEL — full-width text repeating down
          // every row of every column. A 14px glyph on the one selected row
          // per column is a different quantity of the same colour, and it is
          // the only thing left that marks the row without shouting.
          //
          // It does not fight the drop target: during a drag the selected row
          // dims to 45% as the spring trail, and the target carries a ring the
          // selected row never has.
          'group-data-[selected]/row:text-uikit-accent',
          'group-data-[drop=into]/row:!text-uikit-accent',
        )}
      />
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap tracking-uikit-snug">
        {node.name}
      </span>
      {node.hasChildren !== false && (
        <ChevronRight
          size={11}
          strokeWidth={1.5}
          className={cn(
            'shrink-0 text-uikit-muted opacity-50',
            'group-data-[drop=into]/row:!text-uikit-accent group-data-[drop=into]/row:opacity-70',
          )}
        />
      )}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function BreadcrumbTree({
  path,
  onNavigate,
  fetchChildren,
  rootPath,
  renderEmpty,
  refreshKey = 0,
  refreshToken = 0,
  placeholder = 'Select folder',
  dnd,
  className,
}: BreadcrumbTreeProps) {
  const [open, setOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState<{
    top: number
    left: number
    height: number
  } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const columnsRef = useRef<HTMLDivElement>(null)

  const { fetchPath, loadMore, getColumnData, cache, clearCache } =
    useBreadcrumbTree(fetchChildren)

  const buildKey = useCallback(
    (segments: string[]): string =>
      rootPath ? [rootPath, ...segments].join('/') : segments.join('/'),
    [rootPath],
  )

  const getColumnPathKey = useCallback(
    (depth: number): string =>
      buildKey(path.slice(0, depth).map((n) => n.name)),
    [path, buildKey],
  )

  useEffect(() => {
    if (!open) return
    const update = () => {
      const el = wrapRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setAnchorRect({ top: r.top, left: r.left, height: r.height })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, { capture: true, passive: true })
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, {
        capture: true,
      } as EventListenerOptions)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const key = getColumnPathKey(0)
    const data = getColumnData(key)
    if (!data.loading && data.items.length === 0 && data.page === 0)
      fetchPath(key, 1)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    for (let depth = 1; depth <= path.length; depth++) {
      const key = getColumnPathKey(depth)
      const data = getColumnData(key)
      if (!data.loading && data.items.length === 0 && data.page === 0)
        fetchPath(key, 1)
    }
  }, [open, path.length, getColumnPathKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!refreshKey) return
    fetchPath(getColumnPathKey(path.length), 1)
  }, [refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Drop the whole column cache on host-driven mutations (delete / rename).
  // If the panel is open, refetch all currently-visible columns so the user
  // sees fresh data immediately; otherwise the next open repopulates from
  // empty cache via the "fetch if empty" effects above.
  useEffect(() => {
    if (!refreshToken) return
    clearCache()
    if (open) {
      for (let depth = 0; depth <= path.length; depth++) {
        fetchPath(getColumnPathKey(depth), 1)
      }
    }
  }, [refreshToken]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || !columnsRef.current) return
    columnsRef.current.scrollLeft = columnsRef.current.scrollWidth
  }, [path.length, open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (wrapRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const key = (entry.target as HTMLElement).dataset.pathKey
          if (key !== undefined) loadMore(key)
        }
      },
      { threshold: 0 },
    )
    for (const el of sentinelRefs.current.values())
      observerRef.current.observe(el)
    return () => observerRef.current?.disconnect()
  }, [loadMore, cache])

  const registerSentinel = useCallback(
    (pathKey: string, el: HTMLDivElement | null) => {
      if (el) {
        sentinelRefs.current.set(pathKey, el)
        observerRef.current?.observe(el)
      } else {
        const prev = sentinelRefs.current.get(pathKey)
        if (prev) observerRef.current?.unobserve(prev)
        sentinelRefs.current.delete(pathKey)
      }
    },
    [],
  )

  const handleRowClick = useCallback(
    (node: BreadcrumbNode, depth: number) => {
      const newPath = [...path.slice(0, depth), node]
      onNavigate(node, newPath)
      const childKey = buildKey([
        ...path.slice(0, depth).map((n) => n.name),
        node.name,
      ])
      const data = getColumnData(childKey)
      if (!data.loading && data.items.length === 0 && data.page === 0)
        fetchPath(childKey, 1)
    },
    [path, buildKey, onNavigate, getColumnData, fetchPath],
  )

  const handleBreadcrumbClick = useCallback(
    (node: BreadcrumbNode, idx: number, e: React.MouseEvent) => {
      e.stopPropagation()
      onNavigate(node, path.slice(0, idx + 1))
      setOpen(false)
    },
    [path, onNavigate],
  )

  const handleRootPathClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (path.length === 0) return
      onNavigate({ id: rootPath!, name: rootPath! }, [])
      setOpen(false)
    },
    [path.length, rootPath, onNavigate],
  )

  const handleHeaderClick = useCallback(
    (depth: number) => {
      const node = path[depth - 1]
      if (!node) return
      onNavigate(node, path.slice(0, depth))
      setOpen(false)
    },
    [path, onNavigate],
  )

  // ── Drag to re-parent ──────────────────────────────────────────────────────
  // A breadcrumb encodes exactly ONE root→leaf path, so the source branch and
  // the destination branch can never be on screen together. Spring-loading is
  // what buys that back: hold the drag over a row and its column opens, so the
  // user walks across to the other branch mid-drag and drops there.
  //
  // Column `depth` lists the children of `path[depth - 1]` (root when depth is
  // 0), so a row's parent is always `path[depth - 1] ?? null`. Every target
  // below is derived from that one fact.

  const [dragSource, setDragSource] = useState<{
    node: BreadcrumbNode
    depth: number
    /** The parent it started under, captured at dragstart. Spring-loading
     *  rewrites `path` mid-drag, so this cannot be re-derived at drop time. */
    from: BreadcrumbNode | null
  } | null>(null)
  const [dropAt, setDropAt] = useState<
    { kind: 'into'; depth: number; id: string } | { kind: 'level'; depth: number } | null
  >(null)

  // Kept in a ref too: a spring-open re-renders columns and can unmount the
  // source row, and `dragend` may then never reach it.
  const dragSourceRef = useRef<{
    node: BreadcrumbNode
    depth: number
    from: BreadcrumbNode | null
  } | null>(null)
  const springRef = useRef<{ key: string; timer: ReturnType<typeof setTimeout> } | null>(null)

  const cancelSpring = useCallback(() => {
    if (springRef.current) {
      clearTimeout(springRef.current.timer)
      springRef.current = null
    }
  }, [])

  const endDrag = useCallback(() => {
    cancelSpring()
    dragSourceRef.current = null
    setDragSource(null)
    setDropAt(null)
  }, [cancelSpring])

  const targetFor = useCallback(
    (depth: number, node: BreadcrumbNode | null): BreadcrumbDropTarget =>
      node
        ? { parent: node, parentPath: [...path.slice(0, depth), node], kind: 'into' }
        : {
            parent: path[depth - 1] ?? null,
            parentPath: path.slice(0, depth),
            kind: 'level',
          },
    [path],
  )

  // Self, own-subtree, and no-op moves are refused here so every consumer gets
  // them for free; `canDrop` is the host's extra say on top.
  const dropAllowed = useCallback(
    (depth: number, node: BreadcrumbNode | null): boolean => {
      const src = dragSourceRef.current
      if (!src || !dnd) return false
      const target = targetFor(depth, node)
      if (node) {
        if (node.id === src.node.id) return false
        // Dropping into anything under the dragged node would detach the subtree.
        if (path.slice(0, depth).some((a) => a.id === src.node.id)) return false
      }
      // Already a child of that parent — nothing to do. Uses the captured
      // origin, not `path`, which a spring-open may have moved on from.
      const currentParentId = src.from?.id ?? null
      if ((target.parent?.id ?? null) === currentParentId) return false
      return dnd.canDrop ? dnd.canDrop(src.node, target) : true
    },
    [dnd, path, targetFor],
  )

  const handleRowDragOver = useCallback(
    (e: React.DragEvent, node: BreadcrumbNode, depth: number) => {
      if (!dragSourceRef.current) return
      e.preventDefault()
      e.stopPropagation()
      const ok = dropAllowed(depth, node)
      e.dataTransfer.dropEffect = ok ? 'move' : 'none'
      setDropAt({ kind: 'into', depth, id: node.id })

      // Spring the column open after a dwell — but never for a row that can't
      // be entered, and never re-arm for the row already being dwelt on.
      const key = `${depth}:${node.id}`
      if (springRef.current?.key === key) return
      cancelSpring()
      if (node.hasChildren === false) return
      if (node.id === dragSourceRef.current.node.id) return
      const timer = setTimeout(() => {
        springRef.current = null
        handleRowClick(node, depth)
      }, dnd?.springDelayMs ?? 500)
      springRef.current = { key, timer }
    },
    [dropAllowed, cancelSpring, handleRowClick, dnd],
  )

  const commitMove = useCallback(
    (depth: number, node: BreadcrumbNode | null) => {
      const src = dragSourceRef.current
      const ok = src && dropAllowed(depth, node)
      const target = ok ? targetFor(depth, node) : null
      const from = src ? src.from : null
      endDrag()
      if (src && target && dnd) void dnd.onMove({ source: src.node, from, to: target })
    },
    [dropAllowed, targetFor, endDrag, dnd],
  )

  const columns = Array.from({ length: path.length + 1 }, (_, i) => i)

  return (
    <div ref={wrapRef} className={cn('relative inline-flex items-center font-uikit-ui', className)}>
      {/* ── Breadcrumb trigger ── */}
      <div
        role="navigation"
        aria-label="Folder path"
        className={cn(
          'inline-flex items-center gap-0 h-4 leading-4 whitespace-nowrap',
          'font-uikit-ui text-uikit-12 tracking-uikit-snug',
          'text-uikit-muted opacity-70',
        )}
      >
        {rootPath ? (
          <>
            <BreadcrumbItem
              name={rootPath}
              isLeaf={path.length === 0}
              onClick={handleRootPathClick}
            />
            {path.length > 0 && (
              <span
                aria-hidden="true"
                className="text-uikit-11 opacity-45 pr-1 select-none leading-none"
              >
                ›
              </span>
            )}
          </>
        ) : path.length === 0 ? (
          <span className="mr-1">{placeholder}</span>
        ) : null}

        {path.map((node, i) => {
          const isLeaf = i === path.length - 1
          return (
            <Fragment key={node.id}>
              <BreadcrumbItem
                name={node.name}
                isLeaf={isLeaf}
                onClick={(e) => handleBreadcrumbClick(node, i, e)}
              />
              {!isLeaf && (
                <span
                  aria-hidden="true"
                  className="text-uikit-11 opacity-45 pr-1 select-none leading-none"
                >
                  ›
                </span>
              )}
            </Fragment>
          )
        })}

        <ChevronToggle open={open} onClick={() => setOpen((v) => !v)} />
      </div>

      {/* ── Panel (portaled to body so it floats above any clipping ancestor) ── */}
      {open &&
        anchorRect &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            className={cn(
              'uikit-panel-in fixed z-[1000] flex overflow-hidden origin-top-left',
              'bg-uikit-bg text-uikit-ink font-uikit-ui',
              'rounded-[calc(var(--radius)+2px)]',
            )}
            style={{
              top: anchorRect.top + anchorRect.height + 6,
              left: anchorRect.left - 14,
              height: 360,
              // `--shadow-uikit-soft` WITHOUT its third layer. That token is
              // the kit's floating-panel elevation, but it ends in a
              // `0 0 0 1px var(--faint)` ring meant for menus and dropdowns,
              // and this panel renders borderless by design — so its two drop
              // layers are reproduced here rather than the token taken whole.
              // Theme-aware via `--shadow-tint-*`, as the token is.
              //
              // The negative spread came first: this panel used to cast
              // `0 10px 28px` with no pull-in, a wide undiminished pool that at
              // dark mode's 60%-black tint-2 read as a slab under the panel.
              //
              // What was left after that was the FIRST layer — 45% black at
              // 1px, a tight dark rim hugging the bottom edge. `--shadow-tint-*`
              // is tuned for surfaces that also carry a hairline ring; this
              // panel is borderless by design, so its cast is the only edge it
              // gets, and at that weight the edge reads as a drawn line rather
              // than as lift. `--shadow-panel-*` is the same elevation with the
              // dark values pulled back (16%/28%); light is unchanged.
              boxShadow:
                '0 1px 3px var(--shadow-panel-1), 0 8px 20px -10px var(--shadow-panel-2)',
            }}
          >
            <div ref={columnsRef} className="flex h-full overflow-x-auto">
              {columns.map((depth) => {
                const pathKey = getColumnPathKey(depth)
                const { items, loading, hasMore, error } =
                  getColumnData(pathKey)
                const selectedId = path[depth]?.id
                const headerLabel =
                  depth === 0
                    ? (rootPath ?? null)
                    : (path[depth - 1]?.name ?? null)
                const isLastCol = depth === columns.length - 1

                return (
                  <div
                    key={depth}
                    className={cn(
                      'w-[208px] h-full flex flex-col shrink-0',
                      !isLastCol && 'border-r border-uikit-faint',
                    )}
                  >
                    {/* Column header */}
                    {headerLabel && (
                      <button
                        type="button"
                        onClick={() =>
                          depth === 0
                            ? setOpen(false)
                            : handleHeaderClick(depth)
                        }
                        className={cn(
                          'appearance-none border-0 outline-none bg-transparent text-left w-full shrink-0',
                          'pt-3 px-3.5 pb-2',
                          'font-uikit-mono text-[11px] font-semibold tracking-[.06em] uppercase',
                          'text-uikit-ink-50',
                          depth === 0 ? 'cursor-default' : 'cursor-pointer',
                        )}
                      >
                        {headerLabel}
                      </button>
                    )}

                    {/* Column body */}
                    <div
                      onDragOver={
                        dnd && dragSource
                          ? (e) => {
                              e.preventDefault()
                              const ok = dropAllowed(depth, null)
                              e.dataTransfer.dropEffect = ok ? 'move' : 'none'
                              // Left a row for bare column space: the target is
                              // now this column's own parent, so drop the dwell.
                              cancelSpring()
                              setDropAt({ kind: 'level', depth })
                            }
                          : undefined
                      }
                      onDrop={
                        dnd && dragSource
                          ? (e) => {
                              e.preventDefault()
                              commitMove(depth, null)
                            }
                          : undefined
                      }
                      className={cn(
                        // `scroll-auto-hide` is the app-side opt-in for the
                        // auto-hiding scrollbar (paints `var(--faint)` thumb
                        // only while the container has `.is-scrolling`).
                        // Apps without the rule fall back to default
                        // browser scrollbars — harmless.
                        'scroll-auto-hide flex-1 overflow-auto flex flex-col gap-0.5',
                        headerLabel ? 'pt-0.5 px-1.5 pb-2' : 'py-2 px-1.5',
                      )}
                      style={
                        // "Drop at this level" — a ring around the column body,
                        // not an insertion line between rows: siblings here have
                        // no order to insert into. Inline because the Tailwind
                        // arbitrary-shadow utility resolved to `none`.
                        //
                        // `outline` with a NEGATIVE offset rather than an inset
                        // shadow: the shadow paints on the scroll container's
                        // border box, which runs flush to the column header and
                        // to the first row. Pulling the outline 5px inward gives
                        // it room to read as a frame around the list instead of
                        // a box welded to the header, and costs no layout — so
                        // nothing shifts when it appears under the cursor.
                        dropAt?.kind === 'level' &&
                        dropAt.depth === depth &&
                        dropAllowed(depth, null)
                          ? {
                              borderRadius: 'calc(var(--radius) + 3px)',
                              outline: '1.5px solid var(--uikit-accent)',
                              outlineOffset: '-5px',
                            }
                          : undefined
                      }
                    >
                      {items.map((node, rowIdx) => (
                        <TreeRow
                          key={node.id}
                          node={node}
                          selected={node.id === selectedId}
                          colIdx={depth}
                          rowIdx={rowIdx}
                          onClick={() => handleRowClick(node, depth)}
                          draggable={!!dnd}
                          isSource={dragSource?.node.id === node.id}
                          dragActive={!!dragSource}
                          dropState={
                            dnd &&
                            dragSource &&
                            dropAt?.kind === 'into' &&
                            dropAt.depth === depth &&
                            dropAt.id === node.id
                              ? dropAllowed(depth, node)
                                ? 'into'
                                : 'blocked'
                              : 'none'
                          }
                          onDragStart={
                            dnd
                              ? (e) => {
                                  const origin = path[depth - 1] ?? null
                                  dragSourceRef.current = { node, depth, from: origin }
                                  setDragSource({ node, depth, from: origin })
                                  e.dataTransfer.effectAllowed = 'move'
                                  // Firefox refuses to start a drag without payload.
                                  e.dataTransfer.setData('text/plain', node.id)
                                }
                              : undefined
                          }
                          onDragEnd={dnd ? () => endDrag() : undefined}
                          onDragOver={
                            dnd && dragSource
                              ? (e) => handleRowDragOver(e, node, depth)
                              : undefined
                          }
                          onDrop={
                            dnd && dragSource
                              ? (e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  commitMove(depth, node)
                                }
                              : undefined
                          }
                        />
                      ))}

                      {!loading &&
                        !error &&
                        items.length === 0 &&
                        (renderEmpty ? (
                          renderEmpty(path[depth - 1] ?? null)
                        ) : (
                          <div className="py-6 px-2 text-center text-uikit-11 text-uikit-muted opacity-60">
                            No items
                          </div>
                        ))}

                      {error && items.length === 0 && (
                        <div className="py-6 px-2 text-center text-uikit-11 text-uikit-danger">
                          Failed to load
                        </div>
                      )}

                      {loading && items.length === 0 && (
                        <div className="flex items-center justify-center pt-6">
                          <Loader
                            size={14}
                            className="animate-spin text-uikit-muted opacity-50"
                          />
                        </div>
                      )}

                      {hasMore && items.length > 0 && (
                        <div
                          ref={(el) => registerSentinel(pathKey, el)}
                          data-path-key={pathKey}
                          className="h-px"
                        />
                      )}

                      {loading && items.length > 0 && (
                        <div className="flex items-center justify-center py-2">
                          <Loader
                            size={11}
                            className="animate-spin text-uikit-muted opacity-50"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
