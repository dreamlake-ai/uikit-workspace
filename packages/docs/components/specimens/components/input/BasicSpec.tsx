import { InputRoot, InputSlot } from '@dreamlake/uikit'

export const BasicSpec = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 260 }}>
    <InputRoot placeholder="Search…" />
    <InputRoot placeholder="0.00" side="right">
      <InputSlot side="left">$</InputSlot>
      <InputSlot side="right">USD</InputSlot>
    </InputRoot>
    <InputRoot placeholder="Disabled" disabled />
    <InputRoot placeholder="Error state" state="error" />
  </div>
)
