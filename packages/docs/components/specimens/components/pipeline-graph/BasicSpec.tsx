import { PipelineGraph } from '@dreamlake/uikit'
import { CAMERA_POSE } from './sample-graph'

// A freshly-traced graph is entirely `idle`. Drag nodes, scroll to pan,
// ⌘/ctrl-scroll (or pinch) to zoom.
export const BasicSpec = () => (
  <div style={{ position: 'relative', height: 360, width: '100%' }}>
    <PipelineGraph graph={CAMERA_POSE} />
  </div>
)
