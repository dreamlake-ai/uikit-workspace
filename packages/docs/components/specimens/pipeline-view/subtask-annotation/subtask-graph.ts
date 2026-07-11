// Hand-authored `dl_trace`-shaped output for the robot-video subtask
// annotation pipeline from the Macrodata Labs blog post
// (https://macrodata.co/blog/annotating-robot-video-subtasks).
//
// Two VLM stages over timestamped contact sheets (Gemini 3.5 Flash):
//   Part I  — segment each video into subtask spans from full-video sheets.
//   Part II — label every span from a prev/current/next window of per-segment
//             sheets (seeded relabeling off the segmentation prior).
// A WGO-Bench review gates what ships; short / low-recall spans go to rework.
//
// This mirrors what the Python tracer would emit for `subtask_annotation.py`
// below — same node/edge shape as the other pipeline-graph demos, so it drops
// straight into `PipelineGraph` / `PipelineSource`.
import type { PipelineGraphData } from '@dreamlake/uikit'

const CODE = `"""Annotate robot-video subtasks — segment, then label.

Two VLM stages over timestamped contact sheets (Gemini 3.5 Flash):
Part I segments each video into subtask spans from full-video contact
sheets; Part II labels every span from a prev/current/next window of
per-segment sheets (seeded relabeling). A WGO-Bench review gates what
ships; short, low-recall spans go back for rework. EVERY function the
pipeline calls is a \`@ls.udf\` — the source and the two sinks included.
"""

import dreamlake as dl
import lakeshore as ls
from dreamlake import batch, requeue, to_dataset
from lakeshore.types import Mask, String, Tensor, Tuple


@ls.udf(kind="source")
def load_videos() -> Tuple["videos", "instructions"]:
    """Pull the batch of robot / ego videos with their high-level task instruction."""
    ...


@ls.udf
def videos_to_frames(videos: Tensor["N"]) -> Tuple["frames", "timestamps"]:
    """Sample each video at 2 fps (every 0.5 s); keep the per-frame timestamps."""
    ...


@ls.udf
def frames_to_sheets(frames, timestamps) -> Tuple["sheets"]:
    """Tile frames into timestamped contact sheets — 20 frames, 4x5, 224 px, times drawn on each frame."""
    ...


@ls.udf(kind="model")
def sheets_to_segments(sheets, instructions: String["N"]) -> Tuple["spans"]:
    """Gemini 3.5 Flash reads the sheets and emits subtask spans (start, end). GEPA-tuned prompt."""
    ...


@ls.udf
def frames_to_windows(frames, spans) -> Tuple["windows"]:
    """Per span, build a prev / current / next window of contact sheets — 5 frames each, uniform."""
    ...


@ls.udf(kind="model")
def windows_to_labels(windows, instructions: String["N"]) -> Tuple["label", "confidence"]:
    """Gemini labels each span from its window (seeded relabeling off the segmentation prior)."""
    ...


@ls.udf(kind="review")
def score_segments(labels) -> Mask["N"]:
    """WGO-Bench review: F1 on the spans + label accuracy; pass the ones that clear threshold."""
    ...


@ls.udf(kind="sink")
def save_dataset(rows):
    """Write the accepted subtask annotations to the dataset (wraps dreamlake.to_dataset)."""
    to_dataset(rows)


@ls.udf(kind="sink")
def rework(rows):
    """Send short (<2 s) / low-recall spans back for rework (wraps dreamlake.requeue)."""
    requeue(rows)


@dl.pipeline
def subtask_annotation():
    src = load_videos()
    for items in batch(src, n=16):                                    # batch = chunked/streamed run
        frames  = videos_to_frames(items.videos)                      # Part I —
        sheets  = frames_to_sheets(frames.frames, frames.timestamps)  #   segmentation
        spans   = sheets_to_segments(sheets.sheets, items.instructions)

        windows = frames_to_windows(frames.frames, spans.spans)       # Part II —
        labels  = windows_to_labels(windows.windows, items.instructions)  #   labeling

        ok = score_segments(labels)                                   # WGO-Bench review

        save_dataset(labels[ok])                                      # sink: accepted spans
        rework(labels[~ok])                                           # short / low-recall → rework
`

export const SUBTASK_ANNOTATION = {
  id: 'subtask_annotation',
  title: 'subtask_annotation',
  subtitle: 'Annotate robot-video subtasks — segment, then label.',
  nodeCount: 9,
  code: CODE,
  nodes: {
    load_videos: {
      id: 'load_videos',
      title: 'load_videos',
      kind: 'source',
      inputs: [],
      outputs: ['out'],
      columns: ['videos', 'instructions'],
      status: 'idle',
      code: 'def load_videos() -> Tuple["videos", "instructions"]:\n    """Pull the batch of robot / ego videos with their high-level task instruction."""\n    ...',
      config: { kind: 'source' },
      pos: { x: 40, y: 36 },
    },
    videos_to_frames: {
      id: 'videos_to_frames',
      title: 'videos_to_frames',
      kind: 'transform',
      inputs: ['videos'],
      outputs: ['out'],
      columns: ['frames', 'timestamps'],
      status: 'idle',
      code: 'def videos_to_frames(videos: Tensor["N"]) -> Tuple["frames", "timestamps"]:\n    """Sample each video at 2 fps (every 0.5 s); keep the per-frame timestamps."""\n    ...',
      config: {},
      pos: { x: 248, y: 36 },
    },
    frames_to_sheets: {
      id: 'frames_to_sheets',
      title: 'frames_to_sheets',
      kind: 'transform',
      inputs: ['frames', 'timestamps'],
      outputs: ['out'],
      columns: ['sheets'],
      status: 'idle',
      code: 'def frames_to_sheets(frames, timestamps) -> Tuple["sheets"]:\n    """Tile frames into timestamped contact sheets — 20 frames, 4x5, 224 px, times drawn on each frame."""\n    ...',
      config: {},
      pos: { x: 456, y: 36 },
    },
    sheets_to_segments: {
      id: 'sheets_to_segments',
      title: 'sheets_to_segments',
      kind: 'model',
      inputs: ['sheets', 'instructions'],
      outputs: ['out'],
      columns: ['spans'],
      status: 'idle',
      code: 'def sheets_to_segments(sheets, instructions: String["N"]) -> Tuple["spans"]:\n    """Gemini 3.5 Flash reads the sheets and emits subtask spans (start, end). GEPA-tuned prompt."""\n    ...',
      config: { kind: 'model' },
      pos: { x: 664, y: 36 },
    },
    frames_to_windows: {
      id: 'frames_to_windows',
      title: 'frames_to_windows',
      kind: 'transform',
      inputs: ['frames', 'spans'],
      outputs: ['out'],
      columns: ['windows'],
      status: 'idle',
      code: 'def frames_to_windows(frames, spans) -> Tuple["windows"]:\n    """Per span, build a prev / current / next window of contact sheets — 5 frames each, uniform."""\n    ...',
      config: {},
      pos: { x: 872, y: 36 },
    },
    windows_to_labels: {
      id: 'windows_to_labels',
      title: 'windows_to_labels',
      kind: 'model',
      inputs: ['windows', 'instructions'],
      outputs: ['out'],
      columns: ['label', 'confidence'],
      status: 'idle',
      code: 'def windows_to_labels(windows, instructions: String["N"]) -> Tuple["label", "confidence"]:\n    """Gemini labels each span from its window (seeded relabeling off the segmentation prior)."""\n    ...',
      config: { kind: 'model' },
      pos: { x: 1080, y: 36 },
    },
    score_segments: {
      id: 'score_segments',
      title: 'score_segments',
      kind: 'review',
      inputs: ['labels'],
      outputs: ['out'],
      columns: ['mask'],
      status: 'idle',
      code: 'def score_segments(labels) -> Mask["N"]:\n    """WGO-Bench review: F1 on the spans + label accuracy; pass the ones that clear threshold."""\n    ...',
      config: { kind: 'review' },
      pos: { x: 1288, y: 36 },
    },
    save_dataset: {
      id: 'save_dataset',
      title: 'save_dataset',
      kind: 'sink',
      inputs: ['rows'],
      outputs: [],
      columns: [],
      status: 'idle',
      code: 'def save_dataset(rows):\n    """Write the accepted subtask annotations to the dataset (wraps dreamlake.to_dataset)."""\n    to_dataset(rows)',
      config: { kind: 'sink' },
      pos: { x: 1496, y: 36 },
    },
    rework: {
      id: 'rework',
      title: 'rework',
      kind: 'sink',
      inputs: ['rows'],
      outputs: [],
      columns: [],
      status: 'idle',
      code: 'def rework(rows):\n    """Send short (<2 s) / low-recall spans back for rework (wraps dreamlake.requeue)."""\n    requeue(rows)',
      config: { kind: 'sink' },
      pos: { x: 1496, y: 144 },
    },
  },
  edges: [
    { from: 'load_videos', fromPort: 'out', to: 'videos_to_frames', toPort: 'videos', kind: 'data' },
    { from: 'videos_to_frames', fromPort: 'out', to: 'frames_to_sheets', toPort: 'frames', kind: 'data' },
    { from: 'videos_to_frames', fromPort: 'out', to: 'frames_to_sheets', toPort: 'timestamps', kind: 'data' },
    { from: 'frames_to_sheets', fromPort: 'out', to: 'sheets_to_segments', toPort: 'sheets', kind: 'data' },
    { from: 'load_videos', fromPort: 'out', to: 'sheets_to_segments', toPort: 'instructions', kind: 'data' },
    { from: 'sheets_to_segments', fromPort: 'out', to: 'frames_to_windows', toPort: 'spans', kind: 'data' },
    { from: 'videos_to_frames', fromPort: 'out', to: 'frames_to_windows', toPort: 'frames', kind: 'data' },
    { from: 'frames_to_windows', fromPort: 'out', to: 'windows_to_labels', toPort: 'windows', kind: 'data' },
    { from: 'load_videos', fromPort: 'out', to: 'windows_to_labels', toPort: 'instructions', kind: 'data' },
    { from: 'windows_to_labels', fromPort: 'out', to: 'score_segments', toPort: 'labels', kind: 'data' },
    { from: 'windows_to_labels', fromPort: 'out', to: 'save_dataset', toPort: 'rows', kind: 'data' },
    { from: 'score_segments', fromPort: 'out', to: 'save_dataset', toPort: 'rows', kind: 'mask' },
    { from: 'windows_to_labels', fromPort: 'out', to: 'rework', toPort: 'rows', kind: 'data' },
    { from: 'score_segments', fromPort: 'out', to: 'rework', toPort: 'rows', kind: 'mask' },
  ],
} satisfies PipelineGraphData

export default SUBTASK_ANNOTATION
