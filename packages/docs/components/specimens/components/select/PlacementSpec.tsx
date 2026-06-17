import { useState } from 'react'
import { Select } from '@dreamlake/uikit'

// `placement="top"` opens the panel upward — for triggers that sit near the
// viewport bottom (e.g. a chat composer toolbar). `triggerLabel` keeps the
// collapsed control compact (an abbreviation), while `hint` adds a muted,
// right-aligned code to each dropdown row.
export const PlacementSpec = () => {
  const [value, setValue] = useState('en-US')
  return (
    <Select
      placement="top"
      align="left"
      value={value}
      onChange={setValue}
      options={[
        { value: 'en-US', label: 'English',  triggerLabel: 'EN', hint: 'EN' },
        { value: 'zh-CN', label: '中文',      triggerLabel: '中', hint: '中' },
        { value: 'de-DE', label: 'Deutsch',  triggerLabel: 'DE', hint: 'DE' },
        { value: 'ja-JP', label: '日本語',    triggerLabel: '日', hint: '日' },
      ]}
    />
  )
}
