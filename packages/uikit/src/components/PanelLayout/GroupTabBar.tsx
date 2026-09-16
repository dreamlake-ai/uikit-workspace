import { useRef, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { cn } from '../../lib/utils'
import { TAB_DRAG_THRESHOLD_PX } from './config'
import { CloseIcon } from './PanelLeaf'
import type { LeafNode, PanelNode } from './panel-tree'

/** DOM id of the panel a tab controls. Shared with PanelLeaf so `aria-controls`
 *  and the panel's own `id` cannot drift apart. */
export const tabPanelDomId = (leafId: string) => `panel-${leafId}`
/** DOM id of a tab, for its panel's `aria-labelledby`. */
export const tabDomId = (leafId: string) => `tab-${leafId}`

/**
 * A group's flat TAB BAR: one tab per leaf, the active one lit.
 *
 * Each tab is also a drag handle — drag one out of the group to dock it
 * elsewhere, the same gesture as the panel header's grab handle. Because a tab
 * is BOTH a click target and a drag handle, the drag only becomes real once the
 * pointer has travelled `TAB_DRAG_THRESHOLD_PX`.
 *
 * This is a purely presentational strip: the tree's `activeId` is the single
 * source of truth for which tab shows.
 *
 * ACCESSIBILITY: a real `tablist`. Each tab is a `<button>`, so Enter/Space and
 * screen-reader button semantics come for free; focus roves with ←/→/Home/End,
 * Delete closes, and only the selected tab sits in the page tab order — the
 * standard tablist pattern. Dragging a tab OUT of its group stays pointer-only:
 * a deliberate limit, stated in the docs rather than left to be discovered.
 */
export function GroupTabBar({
  group,
  onActivate,
  onCloseTab,
  onHandleDown,
}: {
  group: Extract<PanelNode, { kind: 'group' }>
  onActivate: (id: string) => void
  onCloseTab: (id: string) => void
  onHandleDown: (leaf: LeafNode, e: ReactPointerEvent, thresholdPx?: number) => void
}) {
  const barRef = useRef<HTMLDivElement>(null)

  const moveFocus = (from: number, to: number) => {
    const tabs = barRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    if (!tabs || tabs.length === 0) return
    const i = ((to % tabs.length) + tabs.length) % tabs.length
    if (i === from) return
    tabs[i].focus()
    // Selection follows focus — the expected behaviour for a tablist whose
    // panels are already there and cheap to switch between.
    onActivate(group.children[i].id)
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        moveFocus(index, index - 1)
        break
      case 'ArrowRight':
        e.preventDefault()
        moveFocus(index, index + 1)
        break
      case 'Home':
        e.preventDefault()
        moveFocus(index, 0)
        break
      case 'End':
        e.preventDefault()
        moveFocus(index, group.children.length - 1)
        break
      case 'Delete':
      case 'Backspace':
        e.preventDefault()
        onCloseTab(group.children[index].id)
        break
    }
  }

  return (
    // `bg-uikit-bg`: occlusion hygiene for the same reason as PanelLeaf's root —
    // the 28px tab-bar band must not composite whatever a host stacked beneath.
    <div
      ref={barRef}
      role="tablist"
      aria-orientation="horizontal"
      className="flex items-stretch gap-[2px] h-[28px] shrink-0 px-1 overflow-x-auto select-none bg-uikit-bg"
    >
      {group.children.map((leaf, index) => {
        const active = leaf.id === group.activeId
        const label = leaf.title ?? `Panel ${leaf.n}`
        return (
          <button
            key={leaf.id}
            type="button"
            role="tab"
            id={tabDomId(leaf.id)}
            aria-selected={active}
            aria-controls={tabPanelDomId(leaf.id)}
            // Roving tabindex: the strip is ONE tab stop, then ←/→ within it.
            tabIndex={active ? 0 : -1}
            data-tab-id={leaf.id}
            onKeyDown={(e) => onKeyDown(e, index)}
            onPointerDown={(e) => {
              // A tab is BOTH a click target and a drag handle, so the drag only
              // becomes real once the pointer travels — otherwise every tab
              // switch would flash the floating surrogate. A plain click falls
              // through to onClick below.
              if (e.button === 0) onHandleDown(leaf, e, TAB_DRAG_THRESHOLD_PX)
            }}
            onClick={() => onActivate(leaf.id)}
            className={cn(
              'group/tab inline-flex items-center gap-1.5 px-2.5 rounded-t-[8px] cursor-pointer border-none',
              'font-uikit-ui text-[12px] whitespace-nowrap [transition:background_120ms_ease,color_120ms_ease]',
              active
                ? 'bg-uikit-chip text-uikit-ink'
                : 'bg-transparent text-uikit-muted hover:text-uikit-ink hover:bg-uikit-chip/60',
            )}
          >
            <span className="truncate max-w-[160px]">{label}</span>
            <span
              role="button"
              tabIndex={-1}
              aria-label={`Close ${label}`}
              onClick={(e) => {
                e.stopPropagation()
                onCloseTab(leaf.id)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              // A <button> inside a <button> is invalid HTML — browsers drop the
              // inner one — so this close affordance carries button semantics on
              // a span. It stays OUT of the tab order on purpose: the keyboard
              // route to closing a tab is Delete on the tab itself.
              className="inline-flex items-center justify-center w-[15px] h-[15px] rounded-[4px] opacity-0 group-hover/tab:opacity-70 hover:opacity-100 hover:bg-uikit-panel"
            >
              <CloseIcon />
            </span>
          </button>
        )
      })}
    </div>
  )
}
