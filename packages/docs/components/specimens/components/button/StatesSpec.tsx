import { Button } from '@dreamlake/uikit'

export const StatesSpec = () => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button loading>Loading</Button>
    <Button disabled>Disabled</Button>
  </div>
)
