import { useState } from 'react'
import { TextField } from '@dreamlake/uikit'

export const BasicSpec = () => {
  const [value, setValue] = useState('')
  return <TextField value={value} onChange={setValue} placeholder="Acme Robotics" />
}
