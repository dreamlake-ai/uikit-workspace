import { usePanelConfig } from './config'
import { useLayoutEffect, useRef, type PointerEvent } from 'react'
import { PanelLeaf } from './PanelLeaf'
import { splitChildBox, type PanelBox } from './panel-box'
import type { LeafNode, PanelNode } from './panel-tree'

/** Stable siblings, never reparented: even iframe browsing contexts survive docking.
 * The recursive tree owns chrome and geometry; these connected surfaces fill its slots.
 */
export function PersistentPanels({
  root,
  rootBox,
  draggingId,
  onFocus,
  onClose,
  onHandleDown,
}: {
  root: PanelNode
  rootBox: PanelBox
  draggingId: string | null
  onFocus: (id: string) => void
  onClose: (id: string) => void
  onHandleDown: (leaf: LeafNode, event: PointerEvent) => void
}) {
  const { showSingleTab } = usePanelConfig()
  const layer = useRef<HTMLDivElement>(null)
  const mountOrder = useRef(new Map<string, number>())
  const sequence = useRef(0)
  const leaves: { leaf: LeafNode; box: PanelBox; inGroup: boolean; multiple: boolean }[] = []
  const walk = (node: PanelNode, box: PanelBox) => {
    if (node.kind === 'leaf') leaves.push({ leaf: node, box, inGroup: !!showSingleTab?.(node), multiple: false })
    else if (node.kind === 'group')
      node.children.forEach((leaf) =>
        leaves.push({ leaf, box, inGroup: node.children.length > 1 || !!showSingleTab?.(leaf), multiple: node.children.length > 1 })
      )
    else
      node.children.forEach((child, i) => walk(child, splitChildBox(box, node.sizes, i, node.dir)))
  }
  walk(root, rootBox)
  // Tree order may change, but moving a connected iframe with insertBefore
  // reloads its document. Keep the physical sibling order fixed as well.
  for (const { leaf } of leaves)
    if (!mountOrder.current.has(leaf.id)) mountOrder.current.set(leaf.id, sequence.current++)
  leaves.sort((a, b) => mountOrder.current.get(a.leaf.id)! - mountOrder.current.get(b.leaf.id)!)
  useLayoutEffect(() => {
    const el = layer.current
    const area = el?.parentElement
    if (!el || !area) return
    const slots = Array.from(area.querySelectorAll<HTMLElement>('[data-panel-slot]'))
    const tabSlots = Array.from(area.querySelectorAll<HTMLElement>('[data-panel-tab-slot]'))
    const toolbars = Array.from(el.querySelectorAll<HTMLElement>('[data-panel-toolbar]'))
    const measure = () => {
      const origin = area.getBoundingClientRect()
      const rects = new Map(
        slots.map((slot) => [slot.dataset.panelSlot, slot.getBoundingClientRect()])
      )
      Array.from(el.children).forEach((child) => {
        const surface = child as HTMLElement
        const rect = rects.get(surface.dataset.surface)
        surface.hidden = !rect
        surface.inert = !rect
        surface.style.display = rect ? 'block' : 'none'
        if (rect)
          Object.assign(surface.style, {
            left: `${rect.left - origin.left}px`,
            top: `${rect.top - origin.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          })
      })
      for (const tabSlot of tabSlots) {
        const toolbar = toolbars.find(node => node.dataset.panelToolbar === tabSlot.dataset.panelTabSlot)
        // The header's trailing gutter plus a gap separates scrollable tabs
        // from the active view's intrinsic-width Share/status controls.
        tabSlot.style.right = `${(toolbar?.getBoundingClientRect().width ?? 0) + 28}px`
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(area)
    slots.forEach((slot) => observer.observe(slot))
    toolbars.forEach((toolbar) => observer.observe(toolbar))
    return () => observer.disconnect()
  }, [root, showSingleTab])
  return (
    <div ref={layer} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {leaves.map(({ leaf, box, inGroup, multiple }) => (
        <div
          key={leaf.id}
          data-surface={leaf.id}
          style={{ position: 'absolute', pointerEvents: 'auto' }}
        >
          <PanelLeaf
            leaf={leaf}
            box={box}
            inGroup={inGroup}
            tabRole={multiple}
            dragging={draggingId === leaf.id}
            onFocus={() => onFocus(leaf.id)}
            onClose={() => onClose(leaf.id)}
            onHandleDown={(event) => onHandleDown(leaf, event)}
          />
        </div>
      ))}
    </div>
  )
}
