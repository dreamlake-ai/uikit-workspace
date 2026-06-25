import { useState } from 'react'
import { Switch } from '@dreamlake/uikit'

export const ControlledSpec = () => {
  const [on, setOn] = useState(true)
  return (
    <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
      <Switch checked={on} onCheckedChange={setOn} />
      <span style={{ font: '12px var(--f-ui, sans-serif)', color: 'var(--ink)' }}>
        Notifications {on ? 'on' : 'off'}
      </span>
    </label>
  )
}
