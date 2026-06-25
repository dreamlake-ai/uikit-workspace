import { useState } from 'react'
import { SelectBox } from '@dreamlake/uikit'

export const WithIconSpec = () => {
  const [value, setValue] = useState('recent')
  return (
    <SelectBox
      icon="↕"
      value={value}
      onChange={setValue}
      options={[
        { value: 'recent', label: 'recent' },
        { value: 'oldest', label: 'oldest' },
        { value: 'active', label: 'active jobs' },
        { value: 'datasets', label: 'datasets' },
        { value: 'name-az', label: 'name a–z' },
        { value: 'name-za', label: 'name z–a' },
      ]}
    />
  )
}
