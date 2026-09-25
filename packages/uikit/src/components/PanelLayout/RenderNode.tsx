import { Fragment, type PointerEvent as ReactPointerEvent } from 'react'
import { usePanelConfig } from './config'
import { Divider } from './Divider'
import { GroupTabBar } from './GroupTabBar'
import { PanelLeaf } from './PanelLeaf'
import { ROOT_PANEL_BOX, splitChildBox, type PanelBox } from './panel-box'
import type { LeafNode, PanelNode } from './panel-tree'

export interface RenderNodeProps {
  node: PanelNode
  /** This node's box in viewport coordinates, as CSS math. Defaults to the whole
   *  panel area at the root of the tree; each split narrows it. */
  box?: PanelBox
  draggingId: string | null
  onFocus: (id: string) => void
  onClose: (id: string) => void
  onResize: (splitId: string, index: number, a: number, b: number) => void
  onActivateTab: (groupId: string, leafId: string) => void
  onHandleDown: (leaf: LeafNode, e: ReactPointerEvent) => void
}

/** The recursive renderer: leaf → panel, group → tab bar over its active leaf,
 *  split → flex row/column of children separated by dividers. */
export function RenderNode({
  node,
  box = ROOT_PANEL_BOX,
  draggingId,
  onFocus,
  onClose,
  onResize,
  onActivateTab,
  onHandleDown,
}: RenderNodeProps) {
  const { tabbed, showSingleTab } = usePanelConfig()
  if (tabbed && node.kind !== 'split') {
    const group = node.kind === 'group' ? node : { kind: 'group' as const, id: node.id, children: [node], activeId: node.id }
    return <div data-panel-region className="relative flex flex-col w-full h-full min-w-0 min-h-0">
      <div
        data-dock-handle
        data-panel-group-handle
        aria-label="Move panel group"
        title="Drag to move this panel group"
        onPointerDown={event => {
          if (event.button === 0) onHandleDown(group.children.find(child => child.id === group.activeId) ?? group.children[0], event)
        }}
        style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 64, height: 8, zIndex: 3, cursor: 'grab', touchAction: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <span style={{ width: 28, height: 3, borderRadius: 2, background: 'var(--uikit-handle)', opacity: 0.45, pointerEvents: 'none' }} />
      </div>
      {(group.children.length > 1 || showSingleTab?.(group.children[0])) && (
        <div data-panel-tab-slot={group.activeId} style={{ position: 'absolute', left: 10, right: 56, top: 8, zIndex: 2, minWidth: 0 }}>
          <GroupTabBar group={group} onActivate={(id) => { onActivateTab(group.id, id); onFocus(id) }} onCloseTab={onClose} onHandleDown={onHandleDown} />
        </div>
      )}
      <div data-panel-slot={group.activeId} className="flex-1 min-h-0 min-w-0" />
    </div>
  }
  if (node.kind === 'leaf') {
    return (
      <PanelLeaf
        leaf={node}
        box={box}
        dragging={draggingId === node.id}
        onFocus={() => onFocus(node.id)}
        onClose={() => onClose(node.id)}
        onHandleDown={(e) => onHandleDown(node, e)}
      />
    )
  }

  if (node.kind === 'group') {
    // A group renders a tab bar over the active child's leaf. Only the active
    // leaf is mounted (the panel body owns its own lifecycle).
    const active = node.children.find((c) => c.id === node.activeId) ?? node.children[0]
    return (
      // `data-panel-region` marks the box a GROUP occupies. A tab dragged out of
      // the group needs a source rect, and it cannot use a leaf's: the tab bar is
      // a SIBLING above the panel, not a descendant of it, and an inactive tab has
      // no leaf element mounted at all. The region is the honest answer — it is
      // the space that tab would vacate.
      <div data-panel-region className="flex flex-col w-full h-full min-w-0 min-h-0">
        <GroupTabBar
          group={node}
          onActivate={(id) => onActivateTab(node.id, id)}
          onCloseTab={onClose}
          onHandleDown={onHandleDown}
        />
        <div className="flex-1 min-h-0 min-w-0 flex">
          <PanelLeaf
            leaf={active}
            // A group stacks its leaves in the SAME box — only one is mounted.
            box={box}
            inGroup
            dragging={draggingId === active.id}
            onFocus={() => onFocus(active.id)}
            onClose={() => onClose(active.id)}
            onHandleDown={(e) => onHandleDown(active, e)}
          />
        </div>
      </div>
    )
  }

  return (
    // flexDirection is runtime (row/column from the split node) — kept inline.
    <div className="flex w-full h-full min-w-0 min-h-0" style={{ flexDirection: node.dir }}>
      {node.children.map((child, i) => (
        <Fragment key={child.id}>
          {/* flexGrow is the runtime split size — kept inline. */}
          <div className="basis-0 shrink min-w-0 min-h-0 flex" style={{ flexGrow: node.sizes[i] }}>
            <RenderNode
              node={child}
              // The SAME arithmetic as the flex layout above, handed to CSS as an
              // expression so content can position itself against the viewport
              // without ever measuring the DOM.
              box={splitChildBox(box, node.sizes, i, node.dir)}
              draggingId={draggingId}
              onFocus={onFocus}
              onClose={onClose}
              onResize={onResize}
              onActivateTab={onActivateTab}
              onHandleDown={onHandleDown}
            />
          </div>
          {i < node.children.length - 1 && (
            <Divider
              dir={node.dir}
              splitId={node.id}
              index={i}
              sizeA={node.sizes[i]}
              sizeB={node.sizes[i + 1]}
              childCount={node.children.length}
              onResize={onResize}
            />
          )}
        </Fragment>
      ))}
    </div>
  )
}
