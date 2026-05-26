import { useState } from 'react'
import { TextField } from '@dreamlake/uikit'

export const VariantsSpec = () => {
  const [slug, setSlug] = useState('acme-robotics')
  const [bio, setBio] = useState('')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* prefix + mono — slugs/handles */}
      <TextField value={slug} onChange={setSlug} prefix="/" mono />
      {/* invalid state */}
      <TextField value="" onChange={() => {}} placeholder="Required field" invalid />
      {/* multiline → textarea */}
      <TextField value={bio} onChange={setBio} multiline rows={3} placeholder="Description…" />
    </div>
  )
}
