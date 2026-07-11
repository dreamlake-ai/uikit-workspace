"""Annotate robot-video subtasks — segment, then label.

Two VLM stages over timestamped contact sheets (Gemini 3.5 Flash):
Part I segments each video into subtask spans from full-video contact
sheets; Part II labels every span from a prev/current/next window of
per-segment sheets (seeded relabeling). A WGO-Bench review gates what
ships; short, low-recall spans go back for rework. EVERY function the
pipeline calls is a `@ls.udf` — the source and the two sinks included.
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
