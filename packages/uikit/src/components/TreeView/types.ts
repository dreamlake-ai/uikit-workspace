import { type ReactNode } from 'react'

/** Minimal tree node shape. */
export type TreeDataItem = {
  id: string
  parentId: string | null
  label: string
  isCollapsible?: boolean
  actions?: ReactNode
  disable?: boolean
  selectable?: boolean
  [key: string]: unknown
}

/** Tree node with computed metadata (indent / isLast / ancestors). */
export type TreeDataItemWithMeta<T extends TreeDataItem> = T & {
  indent: number
  isLast: boolean
  ancestors: T[]
}
