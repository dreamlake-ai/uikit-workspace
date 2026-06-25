import { toast, Toaster, Button } from '@dreamlake/uikit'

export const BasicSpec = () => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    <Button size="sm" onClick={() => toast('Saved', { description: 'Your changes are live.' })}>
      Default
    </Button>
    <Button size="sm" variant="secondary" onClick={() => toast.success('Dataset published')}>
      Success
    </Button>
    <Button
      size="sm"
      variant="danger"
      onClick={() => toast.error('Upload failed', { description: 'Network error — please retry.' })}
    >
      Error
    </Button>
    <Button
      size="sm"
      variant="ghost"
      onClick={() =>
        toast.promise(new Promise((r) => setTimeout(r, 1500)), {
          loading: 'Uploading…',
          success: 'Uploaded',
          error: 'Failed',
        })
      }
    >
      Promise
    </Button>
    {/* Mount once near the app root in a real app — here for the demo. */}
    <Toaster />
  </div>
)
