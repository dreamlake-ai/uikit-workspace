import { useState } from 'react'
import { Tabs } from '@dreamlake/uikit'

export const CountBadgeSpec = () => {
  const [active, setActive] = useState('runs')
  return (
    <Tabs
      value={active}
      onChange={setActive}
      tabs={[
        { value: 'runs', label: 'Runs', count: 24 },
        { value: 'artifacts', label: 'Artifacts', count: 7 },
        { value: 'notes', label: 'Notes' },
      ]}
    />
  )
}
