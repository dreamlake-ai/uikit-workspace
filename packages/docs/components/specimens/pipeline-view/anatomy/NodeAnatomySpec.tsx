import { PipelineGraph } from '@dreamlake/uikit'
import { ONE_NODE } from './mini-graphs'

// One node, in isolation. The card you see IS the JSON on the "Data" tab: the
// kind dot ← `kind`, the title ← `title`, the `1→1` meta ← inputs/outputs
// lengths, the left/right dots ← `inputs` / `outputs` ports, and the status
// footer ← `status`. Columns (the result schema) aren't drawn on the card.
export const NodeAnatomySpec = () => (
  <div style={{ position: 'relative', height: 180, width: '100%' }}>
    <PipelineGraph graph={ONE_NODE} />
  </div>
)
