import { useState } from 'react'
import { PipelineGraph, PipelineSource } from '@dreamlake/uikit'
import { PORT_SHOWCASE } from './PortCountsSpec'

// The same 0–4 port showcase, wired into the design layout: canvas on the left,
// source inspector as a right rail. Click a node and its source shows on the
// right — the two share one selection.
export const PortLabelsSpec = () => {
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: 440, width: '100%' }}>
      <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0 }}>
        <PipelineGraph graph={PORT_SHOWCASE} selectedNodeId={selected} onSelectNode={setSelected} />
      </div>
      <div style={{ width: 320, flexShrink: 0, borderLeft: '1px solid var(--color-uikit-faint)' }}>
        <PipelineSource graph={PORT_SHOWCASE} selectedNodeId={selected} onSelectNode={setSelected} />
      </div>
    </div>
  )
}
