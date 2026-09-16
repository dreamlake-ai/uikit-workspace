import type { ReactNode } from 'react'
import type { LeafNode } from './panel-tree'

/**
 * Render a leaf's content. Dispatch on `leaf.view` — the tag the host put on the
 * panel when it created it — to decide what goes inside. The layout itself never
 * interprets `view`; this callback is the only thing that gives it meaning.
 */
export type LeafRenderer = (leaf: LeafNode) => ReactNode

/**
 * Per-leaf class hook. Return `undefined` to accept the default. Whether the
 * returned classes are APPENDED to the defaults (and resolved by tailwind-merge)
 * or REPLACE them depends on the prop — each one says which.
 */
export type LeafClassName = (leaf: LeafNode) => string | undefined

/**
 * Whether `view` may share a tab group with other views. Return false for a
 * SINGLETON — a view the host wants to keep to one panel, never tab-merged.
 */
export type TabbablePredicate = (view: string | undefined) => boolean

/**
 * Whether a panel may be dismissed. Return false to withhold every close
 * affordance for that leaf — the header's close button and, in a group, its
 * tab's × and Delete on that tab — and to refuse those closes outright.
 *
 * For the panel that is the SUBJECT of a screen rather than an auxiliary view:
 * closing it would leave a window full of satellites with nothing to orbit.
 *
 * Hiding the buttons is not enough on its own, which is why this is a policy
 * and not a class hook: Delete on a focused tab never touches a button. The
 * imperative handle's `closeLeaf` is deliberately NOT gated by it — a host
 * closing a panel itself already knows its own policy.
 */
export type ClosablePredicate = (leaf: LeafNode) => boolean
