import { useState } from 'react'
import { PipelineGraph, PipelineSource } from '@dreamlake/uikit'
import { CAMERA_POSE } from './sample-graph'

// The design layout: the canvas is the main surface, the source inspector is a
// right rail. They share one selection — click a node and its source shows on
// the right. Both are pure; you own the selected-node state.
export const LinkedSourceSpec = () => {
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: 440, width: '100%' }}>
      <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0 }}>
        <PipelineGraph graph={CAMERA_POSE} selectedNodeId={selected} onSelectNode={setSelected} />
      </div>
      <div style={{ width: 320, flexShrink: 0, borderLeft: '1px solid var(--color-uikit-faint)' }}>
        <PipelineSource graph={CAMERA_POSE} selectedNodeId={selected} onSelectNode={setSelected} />
      </div>
    </div>
  )
}
