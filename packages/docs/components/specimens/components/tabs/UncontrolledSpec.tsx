import { Tabs } from '@dreamlake/uikit'

export const UncontrolledSpec = () => (
  <Tabs
    defaultValue="overview"
    tabs={[
      { value: 'overview', label: 'Overview' },
      { value: 'logs', label: 'Logs' },
      { value: 'params', label: 'Parameters' },
    ]}
  />
)
