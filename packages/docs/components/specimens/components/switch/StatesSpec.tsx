import { Switch } from '@dreamlake/uikit'

export const StatesSpec = () => (
  <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
    <Switch defaultChecked={false} />
    <Switch defaultChecked />
    <Switch defaultChecked disabled />
    <Switch defaultChecked={false} disabled />
  </div>
)
