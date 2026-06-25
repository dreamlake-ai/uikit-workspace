import { useState } from 'react'
import { Field, SelectBox } from '@dreamlake/uikit'

// Inside a Field the wrapper would otherwise stretch full-width; SelectBox stays
// compact (w-fit) and `align="left"` opens the dropdown from the trigger's left
// edge instead of the container's far right.
export const FieldSpec = () => {
  const [value, setValue] = useState('VISIBLE')
  return (
    <Field label="Visibility">
      <SelectBox
        align="left"
        value={value}
        onChange={setValue}
        options={[
          { value: 'VISIBLE', label: 'Visible' },
          { value: 'SECRET', label: 'Secret' },
        ]}
      />
    </Field>
  )
}
