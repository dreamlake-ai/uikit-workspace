import { useState } from 'react'
import { Button, MediaViewerDialog } from '@dreamlake/uikit'

export function MediaViewerSpec() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Expand plot</Button>
      <MediaViewerDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Example plot"
        caption="One shared viewer for editor media, attachments and visualizations"
      >
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            width: '100%',
            height: '100%',
            minHeight: 0,
            background: 'var(--bg)',
            borderRadius: 8,
            padding: 24,
          }}
        >
          <svg
            viewBox="0 0 600 300"
            role="img"
            aria-label="Example line chart"
            style={{ width: '100%', height: '100%' }}
          >
            <path
              d="M20 260L80 210L140 230L200 140L260 180L320 60L380 90L440 30L500 80L580 20"
              fill="none"
              stroke="var(--accent, #5577ee)"
              strokeWidth="3"
            />
          </svg>
        </div>
      </MediaViewerDialog>
    </>
  )
}
