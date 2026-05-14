import { useState } from 'react'
import { Select } from '@dreamlake/uikit'

export const WithIconSpec = () => {
  const [value, setValue] = useState('recent')
  return (
    <Select
      icon="↕"
      value={value}
      onChange={setValue}
      options={[
        { value: 'recent',   label: 'recent' },
        { value: 'oldest',   label: 'oldest' },
        { value: 'active',   label: 'active jobs' },
        { value: 'datasets', label: 'datasets' },
        { value: 'name-az',  label: 'name a–z' },
        { value: 'name-za',  label: 'name z–a' },
      ]}
    />
  )
}
