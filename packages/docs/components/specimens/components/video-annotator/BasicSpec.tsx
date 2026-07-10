import { useState } from 'react'
import { VideoAnnotator, type Segment } from '@dreamlake/uikit'

const INITIAL: Segment[] = [
  { start: 0, end: 3.5, description: 'Reaches for and grasps the wine bottle on the table', verified: false },
  { start: 3.5, end: 7.3, description: 'Tilts bottle over red mug, pouring liquid into it', verified: false },
  { start: 7.3, end: 10, description: 'Rights the bottle and lifts it away from the filled mug', verified: false },
]

export const BasicSpec = () => {
  const [segments, setSegments] = useState<Segment[]>(INITIAL)
  const [selected, setSelected] = useState(0)
  return (
    <div className="h-[560px]">
      <VideoAnnotator
        videoUrl="https://www.w3schools.com/html/mov_bbb.mp4"
        videoTitle="pour liquid"
        videoSubtitle="videos/pour_liquid.mp4"
        extractFps={5}
        segments={segments}
        selectedIndex={selected}
        onSegmentsChange={setSegments}
        onSelectedChange={setSelected}
        onApproveToggle={(i, verified) =>
          setSegments((prev) => prev.map((s, idx) => (idx === i ? { ...s, verified } : s)))
        }
        showDescription
        onDescriptionChange={(i, value) =>
          setSegments((prev) => prev.map((s, idx) => (idx === i ? { ...s, description: value } : s)))
        }
      />
    </div>
  )
}
