import { useState } from 'react'
import { WorkflowCanvas, type WfOrientation } from '@dreamlake/uikit'
import { DRIVING, DRIVING_STATUS, DRIVING_AGENTS } from './specs'

// A real annotation workflow on the live canvas, caught mid-run. Stages are
// hubs: members fan out from their stage node and converge into the next. The
// confidence switch routes clips to auto-accept, sampled review, or expert
// review; the two agent nodes have fanned out live sub-agents while the release
// gate waits. Drag to pan, ⌘/ctrl-scroll to zoom, switch the layout top-right.
export const HeroCanvasSpec = () => {
  const [orientation, setOrientation] = useState<WfOrientation>('vertical')
  return (
    <div style={{ position: 'relative', height: 560, width: '100%' }}>
      <WorkflowCanvas
        spec={DRIVING}
        orientation={orientation}
        onOrientationChange={setOrientation}
        statusByNodeId={DRIVING_STATUS}
        agentsByNodeId={DRIVING_AGENTS}
      />
    </div>
  )
}
