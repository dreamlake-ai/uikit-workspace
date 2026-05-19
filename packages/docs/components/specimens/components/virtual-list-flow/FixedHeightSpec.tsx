import { VirtualListFlow } from '@dreamlake/uikit'

export const FixedHeightSpec = () => {
  const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, label: `Item ${i + 1}` }))
  return (
    <div className="max-w-sm mx-auto rounded-2xl overflow-hidden py-2 bg-uikit-panel border border-uikit-faint">
      <VirtualListFlow
        items={items}
        itemHeight={40}
        height={300}
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
      </VirtualListFlow>
    </div>
  )
}
