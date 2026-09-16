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
