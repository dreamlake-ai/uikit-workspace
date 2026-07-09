// Tiny hand-built graphs for the Anatomy page. Each isolates ONE thing — a
// single node, a single data edge, a single mask edge — so a doc reader can map
// the visual to the JSON without a whole pipeline in the way. These are the same
// `PipelineGraphData` shape the tracer emits; they're just small enough to read.
import type { PipelineGraphData } from '@dreamlake/uikit'

/** A single transform node — for the "node anatomy" walkthrough. */
export const ONE_NODE: PipelineGraphData = {
  id: 'detect_objects',
  title: 'detect_objects',
  subtitle: null,
  nodeCount: 1,
  code: '@ls.udf\ndef detect_objects(images) -> Tuple["boxes", "classes", "confidence"]: ...',
  nodes: {
    detect_objects: {
      id: 'detect_objects',
      title: 'detect_objects',
      kind: 'transform',
      inputs: ['images'],
      outputs: ['out'],
      columns: ['boxes', 'classes', 'confidence'],
      status: 'idle',
      code: '@ls.udf\ndef detect_objects(images: Tensor["N","H","W",3]) -> Tuple["boxes", "classes", "confidence"]:\n    """Detect objects in each image; one row per box."""\n    ...',
      config: {},
      pos: { x: 40, y: 40 },
    },
  },
  edges: [],
}

/** Two nodes joined by a `data` edge (solid) — the value flows through. */
export const DATA_EDGE: PipelineGraphData = {
  id: 'data_edge',
  title: 'data_edge',
  subtitle: null,
  nodeCount: 2,
  code: 'labels = detect_objects(items.images)\nsave_dataset(labels)',
  nodes: {
    detect_objects: {
      id: 'detect_objects', title: 'detect_objects', kind: 'transform',
      inputs: ['images'], outputs: ['out'], columns: ['boxes', 'classes'],
      status: 'idle', code: null, config: {}, pos: { x: 40, y: 40 },
    },
    save_dataset: {
      id: 'save_dataset', title: 'save_dataset', kind: 'sink',
      inputs: ['rows'], outputs: [], columns: [],
      status: 'idle', code: null, config: { kind: 'sink' }, pos: { x: 248, y: 40 },
    },
  },
  edges: [
    { from: 'detect_objects', fromPort: 'out', to: 'save_dataset', toPort: 'rows', kind: 'data' },
  ],
}

/** Two nodes joined by a `mask` edge (dashed gate) — the source only
 *  filters/gates the target (a review veto / confidence mask). */
export const MASK_EDGE: PipelineGraphData = {
  id: 'mask_edge',
  title: 'mask_edge',
  subtitle: null,
  nodeCount: 2,
  code: 'consensus = review_boxes(labels)   # -> Mask[R, N]\nsave_dataset(labels[consensus])    # the mask GATES what is written',
  nodes: {
    review_boxes: {
      id: 'review_boxes', title: 'review_boxes', kind: 'review',
      inputs: ['labels'], outputs: ['out'], columns: ['mask'],
      status: 'idle', code: null, config: { kind: 'review' }, pos: { x: 40, y: 40 },
    },
    save_dataset: {
      id: 'save_dataset', title: 'save_dataset', kind: 'sink',
      inputs: ['rows'], outputs: [], columns: [],
      status: 'idle', code: null, config: { kind: 'sink' }, pos: { x: 248, y: 40 },
    },
  },
  edges: [
    { from: 'review_boxes', fromPort: 'out', to: 'save_dataset', toPort: 'rows', kind: 'mask' },
  ],
}

/** A generic two-node chain used by the flow-states board. The `statusById`
 *  overlay in the spec drives each pair to a different derived edge flow. */
export const PAIR: PipelineGraphData = {
  id: 'pair',
  title: 'pair',
  subtitle: null,
  nodeCount: 2,
  code: 'b(a())',
  nodes: {
    a: {
      id: 'a', title: 'upstream', kind: 'transform',
      inputs: [], outputs: ['out'], columns: ['rows'],
      status: 'idle', code: null, config: {}, pos: { x: 24, y: 30 },
    },
    b: {
      id: 'b', title: 'downstream', kind: 'transform',
      inputs: ['rows'], outputs: ['out'], columns: ['rows'],
      status: 'idle', code: null, config: {}, pos: { x: 210, y: 30 },
    },
  },
  edges: [{ from: 'a', fromPort: 'out', to: 'b', toPort: 'rows', kind: 'data' }],
}
