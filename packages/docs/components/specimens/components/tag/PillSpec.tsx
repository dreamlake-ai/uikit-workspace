import { useState } from 'react'
import { Tag } from '@dreamlake/uikit'

export const PillSpec = () => {
  const [active, setActive] = useState('public')
  const opts = ['all', 'public', 'private', 'mine']
  return (
    <div className="flex flex-wrap items-center gap-2">
      {opts.map(name => (
        <Tag
          key={name}
          name={name}
          variant="pill"
          active={name === active}
          onClick={() => setActive(name)}
        />
      ))}
    </div>
  )
}
