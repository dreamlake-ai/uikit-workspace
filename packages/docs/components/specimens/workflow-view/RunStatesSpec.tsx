import { ComputeNodeCard } from '@dreamlake/uikit'
import { COMPUTE, RUN_STATES } from './specs'

// The run overlay tints the same card by state — idle · queued · progress
// (pulses) · done · error · skipped. Here one compute card is shown in each.
export const RunStatesSpec = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
    {RUN_STATES.map((state) => (
      <ComputeNodeCard key={state} node={{ ...COMPUTE, id: state, title: state }} state={state} />
    ))}
  </div>
)
