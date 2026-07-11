import { PipelineGraph } from '@dreamlake/uikit'
import { SUBTASK_ANNOTATION } from './subtask-graph'

// The whole robot-video subtask annotation DAG, freshly traced (all `idle`).
// Part I (segment) flows left→right into Part II (label), then a WGO-Bench
// review gates the sink. Drag nodes, scroll to pan, ⌘/ctrl-scroll to zoom.
export const SubtaskGraphSpec = () => (
  <div style={{ position: 'relative', height: 420, width: '100%' }}>
    <PipelineGraph graph={SUBTASK_ANNOTATION} />
  </div>
)
