import { useState } from 'react'
import { Tabs } from '@dreamlake/uikit'

const RowIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none"
    stroke="currentColor" strokeWidth="1.25"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4h2M3 8h2M3 12h2M7 4h6M7 8h6M7 12h6" />
  </svg>
)

const GridIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none"
    stroke="currentColor" strokeWidth="1.25"
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="2.5" width="4.5" height="4.5" />
    <rect x="9" y="2.5" width="4.5" height="4.5" />
    <rect x="2.5" y="9" width="4.5" height="4.5" />
    <rect x="9" y="9" width="4.5" height="4.5" />
  </svg>
)

export const SegmentSpec = () => {
  const [active, setActive] = useState('row')
  return (
    <Tabs
      variant="segment"
      size="lg"
      value={active}
      onChange={setActive}
      tabs={[
        { value: 'row', label: <RowIcon />, title: 'Row view' },
        { value: 'grid', label: <GridIcon />, title: 'Grid view' },
      ]}
    />
  )
}
