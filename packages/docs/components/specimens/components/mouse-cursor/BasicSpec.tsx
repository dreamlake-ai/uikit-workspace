import { MouseCursorIcon, MouseCursorAltIcon } from '@dreamlake/uikit'

export const BasicSpec = () => (
  <div style={{ display: 'flex', gap: 20, alignItems: 'center', color: 'var(--ink)' }}>
    <MouseCursorIcon />
    <MouseCursorAltIcon />
    <span style={{ color: 'var(--tone-blue)' }}>
      <MouseCursorIcon />
    </span>
  </div>
)
