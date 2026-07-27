import { SamplerNodeCard } from '@dreamlake/uikit'
import { SAMPLERS } from './specs'

// sampler strategies — bernoulli · random_n · stratified · first_n. The meta
// line is a one-line summary of the strategy config (e.g. "bernoulli 10% · ≥50").
export const SamplerSpec = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
    {SAMPLERS.map((n) => <SamplerNodeCard key={n.id} node={n} />)}
  </div>
)
