import { useState } from 'react'
import { Toggle } from '@dreamlake/uikit'

export const BasicSpec = () => {
  const [bold, setBold] = useState(false)
  const [italic, setItalic] = useState(true)
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Toggle pressed={bold} onPressedChange={setBold}>
        Bold
      </Toggle>
      <Toggle variant="secondary" pressed={italic} onPressedChange={setItalic}>
        Italic
      </Toggle>
      <Toggle disabled>Disabled</Toggle>
    </div>
  )
}
