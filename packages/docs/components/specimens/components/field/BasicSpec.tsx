import { useState } from 'react'
import { Field, TextField } from '@dreamlake/uikit'

export const BasicSpec = () => {
  const [value, setValue] = useState('')
  return (
    <Field label="Slug" required hint="Lowercase letters, numbers and hyphens.">
      <TextField value={value} onChange={setValue} prefix="/" mono placeholder="acme-robotics" />
    </Field>
  )
}
