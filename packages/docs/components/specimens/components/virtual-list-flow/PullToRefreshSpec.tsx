import { useState } from 'react'
import { VirtualListFlow } from '@dreamlake/uikit'

export function PullToRefreshSpec() {
  const [revision, setRevision] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  return (
    <VirtualListFlow
      items={Array.from({ length: 100 }, (_, i) => i)}
      itemHeight={36}
      height={240}
      tabIndex={0}
      aria-label="Pull down or press Alt+R to refresh"
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true)
        setTimeout(() => {
          setRevision((value) => value + 1)
          setRefreshing(false)
        }, 600)
      }}
    >
      {(item) => (
        <div className="h-9 px-3 py-2">
          Item {item + 1} · refresh {revision}
        </div>
      )}
    </VirtualListFlow>
  )
}
