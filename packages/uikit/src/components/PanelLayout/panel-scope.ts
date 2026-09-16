/**
 * panel-scope.ts — pruning a layout down to the panels that belong to one owner.
 *
 * WHY A LAYOUT NEEDS SCOPES
 * -------------------------
 * "The layout is per-document, and swaps when you switch documents" is an
 * incoherent rule on its own. Take it literally and the app-wide chrome — a
 * connection panel, a machine list, a settings pane — either duplicates into
 * every document's saved layout or VANISHES the moment you open a document
 * whose layout predates it.
 *
 * The fix is to say who OWNS each panel. A leaf carries an `ownerScope` (or the
 * host derives one from its `view`), persistence saves only the subtree for the
 * scope being saved, and everything else stays where it lives.
 *
 * WHAT'S HERE
 * -----------
 * `pruneLeaves` is the primitive and does the actual work: drop the leaves you
 * don't want and collapse what's left into a still-valid tree. Everything else
 * is a thin scope-flavoured wrapper over it.
 *
 * Pure — no React, no DOM.
 */
import { normalizeGroup, type LeafNode, type PanelNode } from './panel-tree'

/** Derive a leaf's owner scope, for leaves that don't carry an explicit one.
 *  Return `undefined` to leave a leaf unscoped. */
export type ScopeOf = (leaf: LeafNode) => string | undefined

/**
 * Prune a tree to the leaves `keep` accepts, returning a tree that is still
 * VALID — or null when nothing survives.
 *
 * Collapsing is where this earns its keep, and a group is not a split:
 *
 *  • A split that loses children keeps the sizes of the ones that remain,
 *    renormalized to 100. (Filtering `children` while leaving `sizes` at its
 *    original length silently misaligns every panel after the gap.)
 *  • A split down to one child is replaced BY that child.
 *  • A group is collapsed by the group's own rules — a stale `activeId` is
 *    re-clamped, and a group down to one tab becomes a bare leaf. Letting a
 *    group fall through the split rule instead would leave `activeId` pointing
 *    at a tab that is no longer there.
 */
export function pruneLeaves(node: PanelNode, keep: (leaf: LeafNode) => boolean): PanelNode | null {
  if (node.kind === 'leaf') return keep(node) ? node : null

  if (node.kind === 'group') {
    const keptTabs = node.children.filter(keep)
    if (keptTabs.length === node.children.length) return node
    return normalizeGroup({ ...node, children: keptTabs })
  }

  const kept: PanelNode[] = []
  const keptSizes: number[] = []
  node.children.forEach((child, i) => {
    const r = pruneLeaves(child, keep)
    if (r) {
      kept.push(r)
      keptSizes.push(node.sizes[i])
    }
  })
  if (kept.length === 0) return null
  if (kept.length === 1) return kept[0] // a split of one is just its child
  const total = keptSizes.reduce((a, b) => a + b, 0) || 1
  return { ...node, children: kept, sizes: keptSizes.map((s) => (s / total) * 100) }
}

/** A leaf's effective owner scope: an explicit `ownerScope` wins, otherwise the
 *  host derives it from the leaf (usually from its `view`). */
export function leafScope(leaf: LeafNode, scopeOf?: ScopeOf): string | undefined {
  return leaf.ownerScope ?? scopeOf?.(leaf)
}

/**
 * Stamp every leaf with an explicit `ownerScope`, returning a new tree. Do this
 * before persisting so the saved blob carries the scope: a later reader — a
 * different version of the app, with a different derivation rule — then honours
 * what was actually saved instead of re-deriving something else.
 */
export function tagOwnerScopes(node: PanelNode, scopeOf?: ScopeOf): PanelNode {
  if (node.kind === 'leaf') {
    const scope = leafScope(node, scopeOf)
    return scope === undefined ? node : { ...node, ownerScope: scope }
  }
  if (node.kind === 'group') {
    return {
      ...node,
      children: node.children.map((c) => {
        const scope = leafScope(c, scopeOf)
        return scope === undefined ? c : { ...c, ownerScope: scope }
      }),
    }
  }
  return { ...node, children: node.children.map((c) => tagOwnerScopes(c, scopeOf)) }
}

/** Whether the tree holds any leaf in `scope` — i.e. whether there is anything
 *  for that owner to save at all. */
export function hasLeafInScope(node: PanelNode, scope: string, scopeOf?: ScopeOf): boolean {
  if (node.kind === 'leaf') return leafScope(node, scopeOf) === scope
  return node.children.some((c) => hasLeafInScope(c, scope, scopeOf))
}

/** The subtree owned by `scope` — what that owner persists. Null when the
 *  layout holds nothing of theirs. */
export function scopeSubtree(node: PanelNode, scope: string, scopeOf?: ScopeOf): PanelNode | null {
  return pruneLeaves(node, (leaf) => leafScope(leaf, scopeOf) === scope)
}
