import { useState } from 'react'
import { Tabs } from '@dreamlake/uikit'

export const ControlledSpec = () => {
  const [active, setActive] = useState('activity')
  return (
    <div className="flex flex-col gap-4 w-full">
      <Tabs
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'activity', label: 'Activity' },
          { value: 'settings', label: 'Settings' },
        ]}
        value={active}
        onChange={setActive}
      />
      <p className="text-sm text-uikit-muted">
        Active: <code className="font-uikit-mono">{active}</code>
      </p>
    </div>
  )
}
