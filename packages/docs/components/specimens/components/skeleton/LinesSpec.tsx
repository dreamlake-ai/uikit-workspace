import { Skeleton } from '@dreamlake/uikit'

export const LinesSpec = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 260 }}>
    <Skeleton style={{ height: 12, width: '70%' }} />
    <Skeleton style={{ height: 12, width: '100%' }} />
    <Skeleton style={{ height: 12, width: '85%' }} />
  </div>
)
