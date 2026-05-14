import { VirtualList } from '@dreamlake/uikit'

export const DynamicHeightSpec = () => {
  const items = Array.from({ length: 500 }, (_, i) => ({
    id: i,
    text: i % 5 === 0
      ? `Item ${i + 1} — This item has a longer description that wraps onto multiple lines to demonstrate dynamic height measurement.`
      : `Item ${i + 1}`,
  }))
  return (
    <div className="max-w-sm mx-auto rounded-2xl overflow-hidden py-2 bg-uikit-panel border border-uikit-faint">
      <VirtualList
        items={items}
        itemHeight="dynamic"
        estimatedItemHeight={40}
        height={300}
        getItemKey={(item) => item.id}
      >
        {(item, _index, style) => (
          <div
            style={style}
            className="px-4 py-2.5 text-sm text-uikit-ink border-b border-uikit-faint"
          >
            {item.text}
          </div>
        )}
      </VirtualList>
    </div>
  )
}
