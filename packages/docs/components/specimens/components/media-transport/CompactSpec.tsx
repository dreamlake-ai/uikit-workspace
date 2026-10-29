import { useState } from 'react'
import { MediaTransport, TransportButton } from '@dreamlake/uikit'
import { RotateCcw } from 'lucide-react'

/** Play/pause alone, compact, beside another transport-styled button — the
 *  shape of a simulation or audio toolbar. */
export const CompactSpec = () => {
  const [playing, setPlaying] = useState(false)
  return (
    <div className="flex items-center gap-1">
      <MediaTransport compact playing={playing} onTogglePlay={() => setPlaying((p) => !p)} />
      <TransportButton label="Reset (R)" onClick={() => setPlaying(false)}>
        <RotateCcw size={14} />
      </TransportButton>
    </div>
  )
}
