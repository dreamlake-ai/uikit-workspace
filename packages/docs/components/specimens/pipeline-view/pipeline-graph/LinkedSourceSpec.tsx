import { useRef, useState } from 'react'
import { PipelineGraph, PipelineSource, ResizeDivider } from '@dreamlake/uikit'
import { CAMERA_POSE } from './sample-graph'

const RAIL_DEFAULT = 320
const RAIL_MIN = 180
const CANVAS_MIN = 200

// The design layout: the canvas is the main surface, the source inspector is a
// right rail. They share one selection — click a node and its source shows on
// the right. Both are pure; you own the selected-node state.
//
// The seam between them is a `ResizeDivider`, so the rail is drag-resizable.
// The rail owns a pixel width and the canvas takes the rest (`flex: 1 1 0`),
// which keeps the canvas — not the code — absorbing any viewport change.
export const LinkedSourceSpec = () => {
  const [selected, setSelected] = useState<string | null>(null)
  const [railWidth, setRailWidth] = useState(RAIL_DEFAULT)
  const rowRef = useRef<HTMLDivElement>(null)

  // Dragging left (negative dx) widens the rail. Clamp so neither pane can be
  // squeezed out: the rail keeps RAIL_MIN, the canvas keeps CANVAS_MIN.
  const resize = (dx: number) => {
    const row = rowRef.current
    const max = row ? Math.max(RAIL_MIN, row.clientWidth - CANVAS_MIN) : RAIL_MIN
    setRailWidth((w) => Math.min(max, Math.max(RAIL_MIN, w - dx)))
  }

  return (
    <div ref={rowRef} style={{ display: 'flex', flexDirection: 'row', height: 440, width: '100%' }}>
      <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0 }}>
        <PipelineGraph graph={CAMERA_POSE} selectedNodeId={selected} onSelectNode={setSelected} />
      </div>
      {/* Zero-width spacer so the drag strip straddles the seam without
          stealing layout space from either pane. */}
      <div style={{ position: 'relative', width: 0, flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: -5, width: 10, zIndex: 10 }}>
          <ResizeDivider axis="x" size={10} onResize={resize} />
        </div>
      </div>
      <div
        style={{
          width: railWidth,
          flexShrink: 0,
          borderLeft: '1px solid var(--color-uikit-faint)',
        }}
      >
        <PipelineSource graph={CAMERA_POSE} selectedNodeId={selected} onSelectNode={setSelected} />
      </div>
    </div>
  )
}
