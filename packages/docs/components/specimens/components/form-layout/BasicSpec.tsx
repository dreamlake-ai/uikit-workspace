import { FormLayout, Label, InputRoot } from '@dreamlake/uikit'

export const BasicSpec = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 300 }}>
    <FormLayout>
      <Label>Workspace name</Label>
      <InputRoot placeholder="my-workspace" />
    </FormLayout>
    <FormLayout orientation="label-left" align="center">
      <Label>Region</Label>
      <InputRoot placeholder="us-east-1" />
    </FormLayout>
  </div>
)
