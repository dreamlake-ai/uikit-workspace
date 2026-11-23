import { useState } from 'react'
import { FileDropOverlay, useFileDropTarget, Button } from '@dreamlake/uikit'

export function FileDropOverlaySpec() {
  const [preview, setPreview] = useState(false)
  const [files, setFiles] = useState<string[]>([])
  const { active, ...handlers } = useFileDropTarget({
    onFiles: (files) => setFiles(files.map((file) => file.name)),
  })
  return (
    <div>
      <Button size="sm" variant="secondary" onClick={() => setPreview(!preview)}>
        Preview drop overlay
      </Button>
      <div
        {...handlers}
        style={{
          position: 'relative',
          height: 280,
          marginTop: 16,
          padding: 24,
          borderRadius: 8,
          background: 'var(--panel-bg)',
          overflow: 'hidden',
        }}
      >
        <h3>Research memo</h3>
        <p>Drag files over this panel. Its contents stay mounted.</p>
        {files.map((name) => (
          <p key={name}>{name}</p>
        ))}
        <FileDropOverlay
          active={active || preview}
          title="Drop files into this memo"
          description="Images, videos, documents and other files"
        />
      </div>
    </div>
  )
}
