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
  return <div className="max-w-md">
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
    <p className="mt-3 text-sm text-uikit-muted">
      {sessions.length ? 'Close every session tab to remove the divider.' : 'No sessions open; the divider is gone.'}
    </p>
  </div>
}
