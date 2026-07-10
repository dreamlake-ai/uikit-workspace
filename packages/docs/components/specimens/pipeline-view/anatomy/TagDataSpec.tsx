import { PipelineGraph } from '@dreamlake/uikit'
import { DATA_EDGE } from './mini-graphs'

// A `data` edge renders SOLID: the source's result table flows into the target.
// This is the default — most edges are data.
export const TagDataSpec = () => (
  <div style={{ position: 'relative', height: 150, width: '100%' }}>
    <PipelineGraph graph={DATA_EDGE} showControls={false} />
  </div>
)
