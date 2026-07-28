import { UdaNodeCard } from '@dreamlake/uikit'
import { UDA, UDA_2 } from './specs'

// uda (user-defined agent) nodes — an instructions preview, the model, a
// permission count, and the run target (a Lakeshore queue or a provider).
export const UdaSpec = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
    <UdaNodeCard node={UDA} />
    <UdaNodeCard node={UDA_2} />
  </div>
)
