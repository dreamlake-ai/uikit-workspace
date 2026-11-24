import { useState } from 'react'
import { TabRow } from '@dreamlake/uikit'

const FIXED = [
  { value: 'brief', label: 'Brief', closable: false },
  { value: 'agents', label: 'Agents', closable: false },
  { value: 'jobs', label: 'Jobs', closable: false },
]

export function GroupedTabsSpec() {
  const [sessions, setSessions] = useState(['shell · 1', 'training-run-with-a-long-name · 2'])
  const [value, setValue] = useState('brief')
  const close = (closed: string) => {
    setSessions(sessions.filter(session => session !== closed))
    if (value === closed) setValue('brief')
  }
  return <div className="max-w-md bg-uikit-workspace" data-tab-row-example="groups">
    <TabRow
      value={value}
      onValueChange={setValue}
      onClose={close}
      preferredTabWidth={116}
      minTabWidth={64}
      aria-label="Machine tabs"
      tabs={[
        ...FIXED,
        ...sessions.map((session, index) => ({ value: session, label: session, groupStart: index === 0 })),
      ]}
    />
    <div data-tab-row-body="" className="bg-uikit-bg p-4 text-sm text-uikit-muted">
      {sessions.length ? 'Select a session to show its close button. Close both sessions to remove the group divider.' : 'No sessions open; the divider is gone.'}
    </div>
  </div>
}
