// PanelLayout — a recursive tiling panel workspace (split / dock / tab-group).
//
// Three layers, each usable on its own:
//   • `panel-tree.ts`  the pure tree model — nodes, migration, mutators. No React.
//   • `panel-box.ts`   panel geometry as CSS math, published as --panel-x/--panel-w.
//   • `PanelLayout`    the renderer + pointer/keyboard wiring.
//
// The component is deliberately VIEW-AGNOSTIC: a leaf carries a `view` string
// that only the host's `renderBody` / `renderHeader` interpret. Policy that a
// real app needs — which views may be tabbed, which one absorbs freed space,
// which panels stay transparent — is injected through props, never inferred.

export { PanelLayout } from './PanelLayout'
export type { PanelLayoutHandle, PanelLayoutProps, PanelLeafInfo } from './PanelLayout'
export type { LeafClassName, LeafRenderer, TabbablePredicate } from './types'

// ── the tiling tree: node shape, builders, migration, pure mutators ──────────
export {
  // schema + limits
  LAYOUT_SCHEMA_VERSION,
  MIN_PX,
  MAX_NEW_PANEL_PX,
  // construction
  nextId,
  makeLeaf,
  panelLeaf,
  panelSplit,
  panelGroup,
  buildInitial,
  reseedCounters,
  // migration / persistence envelope
  normalizeGroup,
  normalizeTree,
  unwrapLayout,
  wrapLayout,
  // mutators
  applySplit,
  applyClose,
  applyResize,
  applyDock,
  applyAddTab,
  applyActivateTab,
  extractLeaf,
  insertBeside,
  // queries
  findLeaf,
  findLeafByView,
  firstLeafId,
  // drag geometry
  dockSideFromPoint,
  dockRect,
} from './panel-tree'

export type { Dir, DockSide, LeafNode, PanelNode, PanelRect } from './panel-tree'

// ── panel geometry as CSS math (publishes --panel-x / --panel-w) ─────────────
export { DIVIDER_PX, ROOT_PANEL_BOX, resizeSplit, splitChildBox } from './panel-box'
export type { PanelBox } from './panel-box'

// ── optional utilities (opt-in; the component works without them) ────────────

// Prune a layout to one owner's panels — the piece that makes "the layout is
// per-document" coherent when app-wide chrome shares the same tree.
export { pruneLeaves, leafScope, tagOwnerScopes, hasLeafInScope, scopeSubtree } from './panel-scope'
export type { ScopeOf } from './panel-scope'

// Decide where a view should open, with no DOM and no side effects.
export { resolveViewSplit } from './open-view'
export type { ViewPref, ViewSplit, ResolveViewSplitOptions } from './open-view'

// Save/restore a layout with the migration, counter-reseeding and write
// coalescing already handled.
export { usePersistedPanelLayout } from './usePersistedPanelLayout'
export type { PersistedPanelLayout, PersistedPanelLayoutOptions } from './usePersistedPanelLayout'
