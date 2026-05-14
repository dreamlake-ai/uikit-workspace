import { useState, useCallback } from 'react'
import { VirtualList } from '@dreamlake/uikit'

const PAGE_SIZE = 30
const TOTAL = 200

const makeItems = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: i, label: `Item ${i + 1}` }))

export const InfiniteScrollSpec = () => {
  const [items, setItems] = useState(() => makeItems(PAGE_SIZE))
  const [loadingMore, setLoadingMore] = useState(false)
  const hasMore = items.length < TOTAL

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    await new Promise(r => setTimeout(r, 800))
    setItems(prev => makeItems(Math.min(prev.length + PAGE_SIZE, TOTAL)))
    setLoadingMore(false)
  }, [loadingMore, hasMore])

  return (
    <div className="max-w-sm mx-auto">
      <p className="text-xs mb-2 text-uikit-muted">
        Showing {items.length} / {TOTAL}
      </p>
      <div className="rounded-2xl overflow-hidden py-2 bg-uikit-panel border border-uikit-faint">
        <VirtualList
          items={items}
          itemHeight={40}
          height={300}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={handleLoadMore}
          getItemKey={(item) => item.id}
        >
          {(item, _index, style) => (
            <div
              style={style}
              className="flex items-center px-4 text-sm text-uikit-ink border-b border-uikit-faint"
            >
              {item.label}
            </div>
          )}
        </VirtualList>
      </div>
    </div>
  )
}
