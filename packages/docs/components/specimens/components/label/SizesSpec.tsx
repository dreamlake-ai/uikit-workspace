import { Label } from '@dreamlake/uikit'

export const SizesSpec = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <Label size="xs">XS label</Label>
    <Label size="sm">SM label (default)</Label>
    <Label size="lg">LG label</Label>
    <Label size="hint">Hint label — muted helper text</Label>
  </div>
)
