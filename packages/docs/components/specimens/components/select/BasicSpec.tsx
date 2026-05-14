import { useState } from 'react'
import { Select } from '@dreamlake/uikit'

export const BasicSpec = () => {
  const [value, setValue] = useState('all')
  return (
    <Select
      value={value}
      onChange={setValue}
      options={[
        { value: 'all',     label: 'all' },
        { value: 'public',  label: 'public' },
        { value: 'private', label: 'private' },
      ]}
    />
  )
}
