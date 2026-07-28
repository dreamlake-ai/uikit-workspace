import { useState } from 'react'
import { WorkflowCanvas, type WfOrientation } from '@dreamlake/uikit'
import { MINI_SPEC, MINI_STATUS, MINI_AGENTS } from './specs'

// A two-stage blueprint with a live run overlay — filter → sample done, the
// vlm agent node in progress with two fanned-out instances. The legend is off
// (small embed); the orientation switcher stays. Toggle vertical/horizontal to
// see the same spec re-laid-out.
export const MiniCanvasSpec = () => {
  const [orientation, setOrientation] = useState<WfOrientation>('vertical')
  return (
    <div style={{ position: 'relative', height: 420, width: '100%' }}>
      <WorkflowCanvas
        spec={MINI_SPEC}
        orientation={orientation}
        onOrientationChange={setOrientation}
        statusByNodeId={MINI_STATUS}
        agentsByNodeId={MINI_AGENTS}
        showLegend={false}
      />
    </div>
  )
}
