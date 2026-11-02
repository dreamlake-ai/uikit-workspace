import { createContext, useContext } from 'react'
import type { LeafNode } from './panel-tree'
import type { ClosablePredicate, LeafClassName, LeafRenderer } from './types'

/**
 * The STATIC per-layout configuration — everything a leaf needs that does not
 * vary from node to node. It travels by context rather than as props so the
 * recursive renderer threads only what actually changes per node (the node, its
 * box, and the callbacks that close over its id).
 *
 * Internal: not exported from the package.
 */
export interface PanelConfig {
  compact?: boolean
  compactHeaderInTabRow?: (leaf: LeafNode) => boolean
  compactTabs?: boolean
  panelAsAction?: (leaf: LeafNode) => boolean
  compactPanelAsAction?: (leaf: LeafNode) => boolean
  compactPanelLabel?: (leaf: LeafNode) => string
  persistent?: boolean
  tabbed?: boolean
  showSingleTab?: ClosablePredicate
  renderTab?: LeafRenderer
  renderBody?: LeafRenderer
  renderHeader?: LeafRenderer
  leafClassName?: LeafClassName
  headerClassName?: LeafClassName
  headerContentClassName?: LeafClassName
  contentColumnHeaderClass?: string
  closable?: ClosablePredicate
  palette: readonly string[]
  /** Divider thickness in px (PanelLayout's `dividerPx`; DIVIDER_PX when unset). */
  dividerPx?: number
}

/** Distinct, subtle tints so each placeholder panel reads as its own thing. */
export const DEFAULT_PALETTE = [
  '#23aaff',
  '#22c55e',
  '#f59e0b',
  '#a855f7',
  '#14b8a6',
  '#ef4444',
  '#ec4899',
  '#84cc16',
] as const

export const PanelConfigContext = createContext<PanelConfig>({ palette: DEFAULT_PALETTE })

export const usePanelConfig = () => useContext(PanelConfigContext)

export const tintFor = (n: number, palette: readonly string[]) => palette[(n - 1) % palette.length]

/** Movement (px) a TAB must travel before its drag counts as a drag. A dedicated
 *  handle has no ambiguity and starts at once; a tab is ALSO a click target, so
 *  without a threshold every tab switch would flash the floating surrogate.
 *  Lives here rather than in PanelLayout.tsx so the tab bar can read it without
 *  importing its own parent. */
export const TAB_DRAG_THRESHOLD_PX = 6
/** The same activation distance for a finger, which wobbles more than a mouse
 *  on a press meant as a tap. */
export const TAB_DRAG_THRESHOLD_TOUCH_PX = 8

/** The activation distance for a press: a tab, a header, a tab strip. Below it
 *  the press is a click — the tab switches, a button fires — and the panel
 *  neither lifts nor shows any drag affordance. */
export function dragThresholdFor(pointerType: string | undefined): number {
  return pointerType === 'touch' ? TAB_DRAG_THRESHOLD_TOUCH_PX : TAB_DRAG_THRESHOLD_PX
}
