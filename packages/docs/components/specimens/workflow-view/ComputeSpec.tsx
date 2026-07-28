import { ComputeNodeCard } from '@dreamlake/uikit'
import { COMPUTE, COMPUTE_2 } from './specs'

// compute (UDF) nodes — the provider summary (launcher · machine) and the
// dispatch mode (direct / daemon) chip read straight off the compute config.
export const ComputeSpec = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
    <ComputeNodeCard node={COMPUTE} />
    <ComputeNodeCard node={COMPUTE_2} />
  </div>
)
