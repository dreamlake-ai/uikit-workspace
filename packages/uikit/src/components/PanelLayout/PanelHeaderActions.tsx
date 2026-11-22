import type { ReactNode } from 'react'

/** Contextual controls beside document tabs. Leading controls sit immediately
 * after the tabs; trailing controls stay at the panel's right edge. */
export function PanelHeaderActions({
  leading,
  trailing,
  spread = leading != null,
}: {
  leading?: ReactNode
  trailing?: ReactNode
  spread?: boolean
}) {
  return (
    <div
      data-panel-header-spread={spread || undefined}
      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', minWidth: 0 }}
    >
      <div
        data-panel-header-control="leading"
        style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
      >
        {leading}
      </div>
      <div
        data-panel-header-control="trailing"
        style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', flexShrink: 0 }}
      >
        {trailing}
      </div>
    </div>
  )
}
