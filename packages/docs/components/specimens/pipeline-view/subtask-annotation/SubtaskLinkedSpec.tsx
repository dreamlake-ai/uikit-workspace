import { useState } from 'react'
import { PipelineGraph, PipelineSource } from '@dreamlake/uikit'
import { SUBTASK_ANNOTATION } from './subtask-graph'

// Click any stage to read the exact `@ls.udf` it traced from in the right
// rail — the two `kind="model"` nodes are the Gemini calls, `score_segments`
// is the WGO-Bench review gate. Click the background to clear.
export const SubtaskLinkedSpec = () => {
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: 460, width: '100%' }}>
      <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0 }}>
        <PipelineGraph graph={SUBTASK_ANNOTATION} selectedNodeId={selected} onSelectNode={setSelected} />
      </div>
      <div style={{ width: 320, flexShrink: 0, borderLeft: '1px solid var(--color-uikit-faint)' }}>
        <PipelineSource graph={SUBTASK_ANNOTATION} selectedNodeId={selected} onSelectNode={setSelected} />
      </div>
    </div>
  )
}
