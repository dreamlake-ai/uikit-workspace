import { useState } from 'react'
import { ResizableLayout } from '@dreamlake/uikit'

export function CompactSpec() {
  const [compact, setCompact] = useState(true)
  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-uikit-12">
        <input type="checkbox" checked={compact} onChange={event => setCompact(event.target.checked)} />
        Compact layout
      </label>
      <div className="relative h-[280px] w-full" style={{ maxWidth: compact ? 390 : undefined }}>
        <ResizableLayout
          compact={compact}
          compactLabels={{ left: 'Browse', middle: 'Editor', right: 'Preview' }}
          leftFixedPx={140}
          middleFixedPx={240}
          left={<div className="p-3">Project files</div>}
          middle={<textarea aria-label="Draft" className="h-full w-full bg-uikit-panel p-3" defaultValue="Edit this draft, switch panels, then return. Your work stays here." />}
          right={<div className="p-3">Preview and details</div>}
        />
      </div>
    </div>
  )
}
