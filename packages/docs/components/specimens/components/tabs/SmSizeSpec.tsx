import { useState } from 'react'
import { Tabs } from '@dreamlake/uikit'

export const SmSizeSpec = () => {
  const [active, setActive] = useState('list')
  return (
    <Tabs
      size="sm"
      value={active}
      onChange={setActive}
      tabs={[
        { value: 'list', label: 'List' },
        { value: 'grid', label: 'Grid' },
        { value: 'tree', label: 'Tree' },
      ]}
    />
  )
}
