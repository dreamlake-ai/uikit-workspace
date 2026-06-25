import { Skeleton } from '@dreamlake/uikit'

export const CardSpec = () => (
  <div
    style={{
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      width: 280,
      padding: 12,
      border: '1px solid var(--faint)',
      borderRadius: 10,
    }}
  >
    {/* Avatar placeholder */}
    <Skeleton style={{ height: 40, width: 40, borderRadius: 999, flexShrink: 0 }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
      <Skeleton style={{ height: 12, width: '60%' }} />
      <Skeleton style={{ height: 10, width: '90%' }} />
    </div>
  </div>
)
