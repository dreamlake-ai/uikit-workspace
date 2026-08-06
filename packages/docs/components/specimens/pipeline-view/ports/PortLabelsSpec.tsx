import { useRef, useState } from 'react'
import { PipelineGraph, PipelineSource, ResizeDivider } from '@dreamlake/uikit'
import { PORT_SHOWCASE } from './PortCountsSpec'

const RAIL_DEFAULT = 320
const RAIL_MIN = 180
const CANVAS_MIN = 200

// The same 0–4 port showcase, wired into the design layout: canvas on the left,
// source inspector as a right rail. Click a node and its source shows on the
// right — the two share one selection. The seam is a `ResizeDivider`, so the
// rail is drag-resizable (see LinkedSourceSpec for the same recipe).
export const PortLabelsSpec = () => {
  const [selected, setSelected] = useState<string | null>(null)
  const [railWidth, setRailWidth] = useState(RAIL_DEFAULT)
  const rowRef = useRef<HTMLDivElement>(null)

  const resize = (dx: number) => {
    const row = rowRef.current
    const max = row ? Math.max(RAIL_MIN, row.clientWidth - CANVAS_MIN) : RAIL_MIN
    setRailWidth((w) => Math.min(max, Math.max(RAIL_MIN, w - dx)))
  }

  return (
    <div ref={rowRef} style={{ display: 'flex', flexDirection: 'row', height: 440, width: '100%' }}>
      <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0 }}>
        <PipelineGraph graph={PORT_SHOWCASE} selectedNodeId={selected} onSelectNode={setSelected} />
      </div>
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
        <PipelineSource graph={PORT_SHOWCASE} selectedNodeId={selected} onSelectNode={setSelected} />
      </div>
    </div>
  )
}
