import { Spinner } from '@dreamlake/uikit'

export const SizesSpec = () => (
  <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
    <Spinner size={16} />
    <Spinner size={24} />
    <Spinner size={36} />
  </div>
)
