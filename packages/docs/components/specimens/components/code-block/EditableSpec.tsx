import { useState } from 'react'
import { CodeBlock } from '@dreamlake/uikit'

const initial = `{
  "workspace": "demo",
  "episodes": 12,
  "tracks": ["video", "joints", "actions"]
}
`

export const EditableSpec = () => {
  const [value, setValue] = useState(initial)
  return (
    <CodeBlock
      value={value}
      onChange={setValue}
      editable="toggle"
      lang="json"
      filename="dataset.json"
      lineNumbers
    />
  )
}
