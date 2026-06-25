import { UIKitBadge } from '@dreamlake/uikit'

export const BasicSpec = () => (
  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
    {/* version only */}
    <UIKitBadge version prefix />
    {/* name + version */}
    <UIKitBadge package version prefix />
    {/* linkable to npm */}
    <UIKitBadge package version prefix linkable />
  </div>
)
