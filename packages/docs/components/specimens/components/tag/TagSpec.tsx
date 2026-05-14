import { useState } from 'react'
import { Tag } from '@dreamlake/uikit'

export const TagSpec = () => {
  const [tags, setTags] = useState(['vision-model', 'dreamlake', 'q3-curated', 'imagenet-1M'])
  return (
    <div className="flex flex-wrap items-center gap-3">
      {tags.map(name => (
        <Tag
          key={name}
          name={name}
          removable
          onRemove={() => setTags(prev => prev.filter(n => n !== name))}
        />
      ))}
      {tags.length === 0 && (
        <span className="font-uikit-mono text-uikit-11 text-uikit-muted opacity-55">
          (all removed)
        </span>
      )}
    </div>
  )
}
