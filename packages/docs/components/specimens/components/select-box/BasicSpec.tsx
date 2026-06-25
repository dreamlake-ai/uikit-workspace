import { useState } from 'react'
import { SelectBox } from '@dreamlake/uikit'

export const BasicSpec = () => {
  const [value, setValue] = useState('all')
  return (
    <SelectBox
      value={value}
      onChange={setValue}
      options={[
        { value: 'all', label: 'all' },
        { value: 'public', label: 'public' },
        { value: 'private', label: 'private' },
      ]}
    />
  )
}
