import { useCallback, useMemo, useState } from 'react'
import { type TreeDataItem, type TreeDataItemWithMeta } from './types'

/** Get all descendant node IDs of a node. */
export function getDescendantIds<T extends TreeDataItem>(
  itemId: string,
  data: TreeDataItemWithMeta<T>[],
  childrenMap: Map<string | null, T[]>,
): string[] {
  const descendants: string[] = []
  const children = childrenMap.get(itemId) || []
  children.forEach((child) => {
    descendants.push(child.id)
    descendants.push(...getDescendantIds(child.id, data, childrenMap))
  })
  return descendants
}

/** Get all ancestor node IDs of a node. */
export function getAncestorIds<T extends TreeDataItem>(itemId: string, data: TreeDataItemWithMeta<T>[]): string[] {
  const ancestors: string[] = []
  const dataMap = new Map(data.map((item) => [item.id, item]))
  let current = dataMap.get(itemId)?.parentId
  while (current) {
    ancestors.push(current)
    current = dataMap.get(current)?.parentId
  }
  return ancestors
}

/** True if an ancestor is selected. */
export function isIndirectlySelected<T extends TreeDataItem>(
  itemId: string,
  selectedIds: Set<string>,
  data: TreeDataItemWithMeta<T>[],
): boolean {
  return getAncestorIds(itemId, data).some((ancestorId) => selectedIds.has(ancestorId))
}

/** selected | indirect | unselected. */
export function getMultiSelectState<T extends TreeDataItem>(
  itemId: string,
  selectedIds: Set<string>,
  data: TreeDataItemWithMeta<T>[],
): 'selected' | 'indirect' | 'unselected' {
  if (isIndirectlySelected(itemId, selectedIds, data)) return 'indirect'
  if (selectedIds.has(itemId)) return 'selected'
  return 'unselected'
}

/** IDs spanning a shift-range from lastSelectedId to currentId. */
export function getRangeIds<T extends TreeDataItem>(
  lastSelectedId: string | null,
  currentId: string,
  data: TreeDataItemWithMeta<T>[],
): string[] {
  if (!lastSelectedId) return [currentId]
  const lastIndex = data.findIndex((item) => item.id === lastSelectedId)
  const currentIndex = data.findIndex((item) => item.id === currentId)
  if (lastIndex === -1 || currentIndex === -1) return [currentId]
  const startIndex = Math.min(lastIndex, currentIndex)
  const endIndex = Math.max(lastIndex, currentIndex)
  const rangeIds: string[] = []
  for (let i = startIndex; i <= endIndex; i++) rangeIds.push(data[i].id)
  return rangeIds
}

/** Drop indirectly-selected descendants, keeping only directly selected nodes. */
export function cleanIndirectSelectedNodes<T extends TreeDataItem>(
  selectedIds: Set<string>,
  data: TreeDataItemWithMeta<T>[],
): Set<string> {
  const cleanedIds = new Set<string>()
  for (const id of selectedIds) {
    if (!isIndirectlySelected(id, selectedIds, data)) cleanedIds.add(id)
  }
  return cleanedIds
}

/** Whether the prev/next rows are selected (for grouped-radius styling). */
export function getAdjacentSelectionState<T extends TreeDataItem>(
  itemId: string,
  selectedIds: Set<string>,
  data: TreeDataItemWithMeta<T>[],
): { hasPrevSelected: boolean; hasNextSelected: boolean } {
  const currentIndex = data.findIndex((item) => item.id === itemId)
  if (currentIndex === -1) return { hasPrevSelected: false, hasNextSelected: false }
  const prevIndex = currentIndex - 1
  const hasPrevSelected =
    prevIndex >= 0 && getMultiSelectState(data[prevIndex].id, selectedIds, data) !== 'unselected'
  const nextIndex = currentIndex + 1
  const hasNextSelected =
    nextIndex < data.length && getMultiSelectState(data[nextIndex].id, selectedIds, data) !== 'unselected'
  return { hasPrevSelected, hasNextSelected }
}

/** Tree search with label highlighting + ancestor path inclusion. */
export function useTreeSearch<T extends TreeDataItem>({
  data,
  searchQuery,
  isCaseSensitive = false,
  isRegex = false,
}: {
  data: T[]
  searchQuery: string
  isCaseSensitive?: boolean
  isRegex?: boolean
}) {
  const [isRegexValid, setIsRegexValid] = useState(true)

  const { filteredData, matchingIds, searchResultsCount } = useMemo(() => {
    const dataMap = new Map(data.map((item) => [item.id, item]))
    if (!searchQuery) {
      return { filteredData: data, matchingIds: new Set<string>(), searchResultsCount: 0 }
    }
    const matchingAndAncestorIds = new Set<string>()
    const directMatchIds = new Set<string>()
    let regex: RegExp | null = null
    if (isRegex) {
      try {
        regex = new RegExp(searchQuery, isCaseSensitive ? '' : 'i')
        if (!isRegexValid) setIsRegexValid(true)
      } catch {
        if (isRegexValid) setIsRegexValid(false)
        return { filteredData: [], matchingIds: new Set<string>(), searchResultsCount: 0 }
      }
    }
    data.forEach((item) => {
      let labelMatches = false
      if (regex) {
        labelMatches = regex.test(item.label)
      } else {
        const source = isCaseSensitive ? item.label : item.label.toLowerCase()
        const query = isCaseSensitive ? searchQuery : searchQuery.toLowerCase()
        labelMatches = source.includes(query)
      }
      if (labelMatches) {
        directMatchIds.add(item.id)
        matchingAndAncestorIds.add(item.id)
        let current = item.parentId
        while (current) {
          const parent = dataMap.get(current)
          if (parent) {
            matchingAndAncestorIds.add(parent.id)
            current = parent.parentId
          } else break
        }
      }
    })
    const filtered = data.filter((item) => matchingAndAncestorIds.has(item.id))
    return { filteredData: filtered, matchingIds: directMatchIds, searchResultsCount: directMatchIds.size }
  }, [searchQuery, data, isCaseSensitive, isRegex, isRegexValid])

  const renderLabel = useCallback(
    (label: string, itemId: string) => {
      if (!searchQuery || !isRegexValid || !matchingIds.has(itemId)) return label
      let regex
      try {
        regex = new RegExp(`(${searchQuery})`, isCaseSensitive ? 'g' : 'gi')
      } catch {
        return label
      }
      const parts = label.split(regex)
      return (
        <>
          {parts.map((part, i) =>
            i % 2 === 1 ? (
              <span key={i} className="rounded-[3px] bg-uikit-tone-amber/30">
                {part}
              </span>
            ) : (
              part
            ),
          )}
        </>
      )
    },
    [searchQuery, isCaseSensitive, isRegexValid, matchingIds],
  )

  return { filteredData, searchResultsCount, isRegexValid, renderLabel, hasActiveSearch: !!searchQuery }
}

/** Manage tree expand/collapse + compute visible/flattened data with metadata. */
export function useTreeState<T extends TreeDataItem>({
  data,
  defaultExpanded = true,
  expandedItems: externalExpandedItems,
  onToggleItem: externalOnToggleItem,
}: {
  data: T[]
  defaultExpanded?: boolean
  expandedItems?: Set<string>
  onToggleItem?: (id: string) => void
}) {
  const [internalExpandedItems, setInternalExpandedItems] = useState(() => {
    const initial = new Set<string>()
    if (defaultExpanded) data.forEach((item) => item.isCollapsible && initial.add(item.id))
    return initial
  })

  const expandedItems = externalExpandedItems ?? internalExpandedItems

  const toggleItem = useCallback(
    (id: string) => {
      if (externalOnToggleItem) externalOnToggleItem(id)
      else
        setInternalExpandedItems((prev) => {
          const next = new Set(prev)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return next
        })
    },
    [externalOnToggleItem],
  )

  const expandAll = useCallback(() => {
    const allCollapsible = new Set<string>()
    data.forEach((item) => item.isCollapsible && allCollapsible.add(item.id))
    if (externalExpandedItems) {
      allCollapsible.forEach((id) => {
        if (!expandedItems.has(id) && externalOnToggleItem) externalOnToggleItem(id)
      })
    } else setInternalExpandedItems(allCollapsible)
  }, [data, expandedItems, externalExpandedItems, externalOnToggleItem])

  const collapseAll = useCallback(() => {
    if (externalExpandedItems) {
      expandedItems.forEach((id) => externalOnToggleItem?.(id))
    } else setInternalExpandedItems(new Set())
  }, [expandedItems, externalExpandedItems, externalOnToggleItem])

  const childrenMap = useMemo(() => {
    const map = new Map<string | null, T[]>()
    data.forEach((item) => {
      if (!map.has(item.parentId)) map.set(item.parentId, [])
      map.get(item.parentId)!.push(item)
    })
    return map
  }, [data])

  const hasDescendants = useCallback(
    (itemId: string): boolean => (childrenMap.get(itemId) || []).length > 0,
    [childrenMap],
  )

  const dataWithMeta = useMemo((): TreeDataItemWithMeta<T>[] => {
    const dataMap = new Map(data.map((item) => [item.id, item]))
    const getAncestors = (item: T) => {
      const ancestors: T[] = []
      let current = item.parentId
      while (current) {
        const parent = dataMap.get(current)
        if (parent) {
          ancestors.unshift(parent)
          current = parent.parentId
        } else break
      }
      return ancestors
    }
    const sortedData: T[] = []
    const visited = new Set<string>()
    const traverseNode = (nodeId: string | null) => {
      const children = childrenMap.get(nodeId) || []
      children.forEach((child) => {
        if (!visited.has(child.id)) {
          visited.add(child.id)
          sortedData.push(child)
          traverseNode(child.id)
        }
      })
    }
    traverseNode(null)
    return sortedData.map((item) => {
      const siblings = childrenMap.get(item.parentId) || []
      const isLast = siblings.length > 0 && siblings[siblings.length - 1].id === item.id
      const ancestors = getAncestors(item)
      return { ...item, indent: ancestors.length, isLast, ancestors }
    })
  }, [data, childrenMap])

  const visibleData = useMemo(() => {
    const isVisible = (item: TreeDataItemWithMeta<T>) =>
      item.ancestors.every((ancestor) => !ancestor.isCollapsible || expandedItems.has(ancestor.id))
    return dataWithMeta.filter(isVisible)
  }, [dataWithMeta, expandedItems])

  return { visibleData, expandedItems, toggleItem, expandAll, collapseAll, hasDescendants, dataWithMeta }
}
