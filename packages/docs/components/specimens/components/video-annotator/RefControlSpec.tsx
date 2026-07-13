import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { VideoAnnotator, type Segment, type VideoAnnotatorHandle } from '@dreamlake/uikit'
import { Button } from '@dreamlake/uikit'

const INITIAL: Segment[] = [
  { start: 0, end: 4, description: 'Approach', verified: false },
  { start: 4, end: 10, description: 'Pour', verified: false },
]

export const RefControlSpec = () => {
  const ref = useRef<VideoAnnotatorHandle>(null)
  const [segments, setSegments] = useState<Segment[]>(INITIAL)
  const [selected, setSelected] = useState(0)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Button size="sm" onClick={() => ref.current?.split()}>Split at playhead</Button>
        <Button size="sm" variant="secondary" onClick={() => ref.current?.merge()}>Merge current</Button>
        <Button size="sm" variant="ghost" onClick={() => ref.current?.stepFrame(-1)}><ChevronLeft size={14} /> frame</Button>
        <Button size="sm" variant="ghost" onClick={() => ref.current?.stepFrame(1)}>frame <ChevronRight size={14} /></Button>
      </div>
      <div className="h-[420px]">
        <VideoAnnotator
          ref={ref}
          enableKeyboard={false}
          videoUrl="https://www.w3schools.com/html/mov_bbb.mp4"
          extractFps={5}
          segments={segments}
          selectedIndex={selected}
          onSegmentsChange={setSegments}
          onSelectedChange={setSelected}
        />
      </div>
    </div>
  )
}
