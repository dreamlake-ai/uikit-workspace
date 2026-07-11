import { PipelineGraph } from '@dreamlake/uikit'
import type { PipelineGraphData } from '@dreamlake/uikit'

// A hand-built graph whose nodes span 0–4 input ports (and 0–1 output ports),
// so the port labels and connector tags read across every port count. The
// `blend → zip.right` edge points *backward* (zip sits left of blend), which
// forces the centered inverted-S bend.
export const PORT_SHOWCASE = {
  id: 'port_showcase',
  title: 'port_showcase',
  subtitle: 'Nodes with 0–4 ports.',
  nodes: {
    ingest: {
      id: 'ingest',
      title: 'ingest',
      kind: 'source',
      inputs: [],
      outputs: ['out'],
      columns: ['rows'],
      status: 'idle',
      code: 'def ingest() -> Tuple["rows"]:\n    """Pull the batch of rows to process."""\n    ...',
      config: { kind: 'source' },
      pos: { x: 40, y: 150 },
    },
    map1: {
      id: 'map1',
      title: 'map1',
      kind: 'transform',
      inputs: ['rows'],
      outputs: ['out'],
      columns: ['rows'],
      status: 'idle',
      code: 'def map1(rows) -> Tuple["rows"]:\n    """Map each row to a transformed row."""\n    ...',
      config: {},
      pos: { x: 248, y: 150 },
    },
    zip: {
      id: 'zip',
      title: 'zip',
      kind: 'transform',
      inputs: ['left', 'right'],
      outputs: ['out'],
      columns: ['pairs'],
      status: 'idle',
      code: 'def zip(left, right) -> Tuple["pairs"]:\n    """Pair up the two input streams row-for-row."""\n    ...',
      config: {},
      pos: { x: 456, y: 120 },
    },
    blend: {
      id: 'blend',
      title: 'blend',
      kind: 'merge',
      inputs: ['a', 'b', 'c'],
      outputs: ['out'],
      columns: ['mix'],
      status: 'idle',
      code: 'def blend(a, b, c) -> Tuple["mix"]:\n    """Reconcile the three inputs into one blended stream."""\n    ...',
      config: { kind: 'merge' },
      pos: { x: 664, y: 120 },
    },
    collate: {
      id: 'collate',
      title: 'collate',
      kind: 'merge',
      inputs: ['w', 'x', 'y', 'z'],
      outputs: ['out'],
      columns: ['rows'],
      status: 'idle',
      code: 'def collate(w, x, y, z) -> Tuple["rows"]:\n    """Gather the four inputs into a single row set."""\n    ...',
      config: { kind: 'merge' },
      pos: { x: 872, y: 96 },
    },
    sink: {
      id: 'sink',
      title: 'sink',
      kind: 'sink',
      inputs: ['rows'],
      outputs: [],
      columns: [],
      status: 'idle',
      code: 'def sink(rows):\n    """Write the accepted rows to the dataset (wraps dreamlake.to_dataset)."""\n    to_dataset(rows)',
      config: { kind: 'sink' },
      pos: { x: 1080, y: 150 },
    },
  },
  edges: [
    { from: 'ingest', fromPort: 'out', to: 'map1', toPort: 'rows', kind: 'data' },
    { from: 'map1', fromPort: 'out', to: 'zip', toPort: 'left', kind: 'data' },
    { from: 'zip', fromPort: 'out', to: 'blend', toPort: 'a', kind: 'data' },
    { from: 'blend', fromPort: 'out', to: 'collate', toPort: 'w', kind: 'data' },
    { from: 'collate', fromPort: 'out', to: 'sink', toPort: 'rows', kind: 'data' },
    // Backward edge: blend's output loops back to zip.right (zip is to the LEFT
    // of blend), forcing the centered inverted-S bend.
    { from: 'blend', fromPort: 'out', to: 'zip', toPort: 'right', kind: 'data' },
  ],
  code: '"""Nodes with 0–4 ports.\n\nA hand-built showcase graph: each stage\'s parameters become input ports\nand its result is the single output port, spanning 0–4 inputs. One edge\nloops backward to exercise the centered S-bend.\n"""\n',
  nodeCount: 6,
} satisfies PipelineGraphData

// A freshly-traced graph is entirely `idle`. Drag nodes, scroll to pan,
// ⌘/ctrl-scroll (or pinch) to zoom.
export const PortCountsSpec = () => (
  <div style={{ position: 'relative', height: 420, width: '100%' }}>
    <PipelineGraph graph={PORT_SHOWCASE} />
  </div>
)
