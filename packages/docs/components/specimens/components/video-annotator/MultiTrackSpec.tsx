import { useState } from 'react'
import { VideoAnnotator, type Track } from '@dreamlake/uikit'

const INITIAL: Track[] = [
  {
    id: 'phase',
    name: 'Phase',
    segments: [
      { start: 0, end: 3.5, description: 'Reaches for and grasps the wine bottle', verified: false },
      { start: 3.5, end: 7.3, description: 'Tilts bottle over the mug, pouring', verified: false },
      { start: 7.3, end: 10, description: 'Rights the bottle and lifts away', verified: false },
    ],
  },
  {
    id: 'gripper',
    name: 'Gripper',
    segments: [
      { start: 0, end: 2.6, description: 'Open', verified: false },
      { start: 2.6, end: 8.2, description: 'Closed', verified: false },
      { start: 8.2, end: 10, description: 'Open', verified: false },
    ],
  },
]

export const MultiTrackSpec = () => {
  const [tracks, setTracks] = useState<Track[]>(INITIAL)
  const [activeTrack, setActiveTrack] = useState(0)
  const [selected, setSelected] = useState(0)
  return (
    <div className="h-[600px]">
      <VideoAnnotator
        videoUrl="https://www.w3schools.com/html/mov_bbb.mp4"
        videoTitle="pour liquid"
        videoSubtitle="videos/pour_liquid.mp4"
        extractFps={5}
        tracks={tracks}
        activeTrackIndex={activeTrack}
        selectedIndex={selected}
        onTracksChange={setTracks}
        onActiveTrackChange={setActiveTrack}
        onSelectedChange={setSelected}
        allowAddTracks
        showDescription
        onDescriptionChange={(i, value) =>
          setTracks((prev) =>
            prev.map((t, ti) =>
              ti === activeTrack
                ? { ...t, segments: t.segments.map((s, si) => (si === i ? { ...s, description: value } : s)) }
                : t,
            ),
          )
        }
      />
    </div>
  )
}
