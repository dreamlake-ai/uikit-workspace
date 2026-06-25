import { useState } from 'react'
import { ToggleButtons, ToggleButton } from '@dreamlake/uikit'

export const SegmentedSpec = () => {
  const [view, setView] = useState('list')
  return (
    <ToggleButtons value={view} onValueChange={setView}>
      <ToggleButton value="list">List</ToggleButton>
      <ToggleButton value="grid">Grid</ToggleButton>
      <ToggleButton value="board">Board</ToggleButton>
    </ToggleButtons>
  )
}
