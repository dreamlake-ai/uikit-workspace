import { useState } from 'react'
import { TabRow } from '@dreamlake/uikit'

export function TabRowSpec() {
  const [tabs, setTabs] = useState([
    { value: 'plan', label: 'Detailed Implementation Plan' },
    { value: 'hosts', label: 'Enroll hosts through SSH' },
    { value: 'test', label: 'Test host enrollment' },
    { value: 'release', label: 'Release checklist' },
  ])
  const [value, setValue] = useState('plan')
  const [minimum, setMinimum] = useState(80)
  const [preferred, setPreferred] = useState(170)
  const [width, setWidth] = useState(560)
  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <label>Row width: {width}px<br /><input aria-label="Row width" type="range" min="220" max="800" value={width} onChange={e => setWidth(+e.target.value)} /></label>
        <label>Minimum: {minimum}px<br /><input aria-label="Minimum tab width" type="range" min="48" max="140" value={minimum} onChange={e => setMinimum(+e.target.value)} /></label>
        <label>Preferred: {preferred}px<br /><input aria-label="Preferred tab width" type="range" min="140" max="260" value={preferred} onChange={e => setPreferred(+e.target.value)} /></label>
      </div>
      <div style={{ width, maxWidth: '100%' }}>
        <TabRow tabs={tabs} value={value} onValueChange={setValue}
          minTabWidth={minimum} preferredTabWidth={preferred}
          aria-label="Example documents"
          leading={<button type="button" aria-label="New document" onClick={() => {
            const id = crypto.randomUUID()
            setTabs([...tabs, { value: id, label: 'Untitled document' }])
            setValue(id)
          }}>+</button>}
          onClose={id => {
            const remaining = tabs.filter(t => t.value !== id)
            setTabs(remaining)
            if (value === id) setValue(remaining[0]?.value ?? '')
          }} />
        <p style={{ marginTop: 16 }}>Selected: {tabs.find(t => t.value === value)?.label ?? 'No documents'}</p>
      </div>
    </div>
  )
}
