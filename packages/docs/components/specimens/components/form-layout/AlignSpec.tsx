import { FormLayout, Label, InputRoot } from '@dreamlake/uikit'

// When the control is taller than the label, `align` decides how the label sits
// against it. Each row pairs the label with a two-input column so the start /
// center / end difference is visible.
const Pair = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <InputRoot placeholder="min" />
    <InputRoot placeholder="max" />
  </div>
)

export const AlignSpec = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 320 }}>
    {(['start', 'center', 'end'] as const).map((align) => (
      <FormLayout key={align} orientation="label-left" align={align}>
        <Label>Range ({align})</Label>
        <Pair />
      </FormLayout>
    ))}
  </div>
)
