import { useState } from 'react'
import { VideoAnnotator, type Segment } from '@dreamlake/uikit'

const SEGMENTS: Segment[] = [
  { id: 'a', start: 0, end: 3.5, description: 'Reaches for and grasps the wine bottle on the table', verified: true },
  { id: 'b', start: 3.5, end: 7.3, description: 'Tilts bottle over red mug, pouring liquid into it', verified: false },
  { id: 'c', start: 7.3, end: 10, description: 'Rights the bottle and lifts it away from the filled mug', verified: false },
]

// A viewer who may watch but not edit: no split / merge, no boundary handles,
// and s / a / Backspace do nothing. Selection and seeking still work.
export const ReadOnlySpec = () => {
  const [selected, setSelected] = useState(0)
  return (
    <div className="h-[520px]">
      <VideoAnnotator
        readOnly
        videoUrl="https://www.w3schools.com/html/mov_bbb.mp4"
        videoTitle="pour liquid"
        videoSubtitle="videos/pour_liquid.mp4"
        extractFps={5}
        showSeekBar
        segments={SEGMENTS}
        selectedIndex={selected}
        onSelectedChange={setSelected}
      />
    </div>
  )
}
