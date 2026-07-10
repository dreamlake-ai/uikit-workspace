import { PipelineGraph } from '@dreamlake/uikit'
import { MASK_EDGE } from './mini-graphs'

// A `mask` edge renders DASHED — a gate, not data flow. The source (a review /
// confidence mask) only decides WHICH rows of the target survive. This is how
// `labels[consensus]` reads as a filter without adding a filter node.
export const TagMaskSpec = () => (
  <div style={{ position: 'relative', height: 150, width: '100%' }}>
    <PipelineGraph graph={MASK_EDGE} showControls={false} />
  </div>
)
