import { Field, TextField } from '@dreamlake/uikit'

export const ErrorSpec = () => (
  <Field label="Name" required error="At least 3 characters.">
    <TextField value="ab" onChange={() => {}} invalid />
  </Field>
)
