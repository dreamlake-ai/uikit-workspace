import { FormLayout, Label, InputRoot } from '@dreamlake/uikit'

// Two orientations, one above the other. Each label names the one it is
// demonstrating — following AlignSpec — because side by side and unlabelled
// they read as a single form that has been laid out inconsistently rather
// than as two examples of the prop.
export const BasicSpec = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 22, width: 320 }}>
    <FormLayout>
      <Label>Workspace name (stacked, default)</Label>
      <InputRoot placeholder="my-workspace" />
    </FormLayout>
    <FormLayout orientation="label-left" align="center">
      <Label>Region (label-left)</Label>
      <InputRoot placeholder="us-east-1" />
    </FormLayout>
  </div>
)
