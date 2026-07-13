# Subtask Annotation

A worked example: the [Macrodata Labs subtask-annotation
pipeline](https://macrodata.co/blog/annotating-robot-video-subtasks) — which
turns long robot and egocentric manipulation videos into timestamped subtask
annotations — traced into a `PipelineGraph`. It's a real-world instance of the
**AI auto-label → review → sink** loop the [Pipeline Graph](reference/pipeline-view-pipeline-graph.md)
page describes, and a good stress test for the layout: two VLM stages, a
fan-out of contact sheets, a review gate, and a rework loop.

The whole thing is two VLM passes over **timestamped contact sheets** (frame
grids with the time drawn on each tile) using Gemini 3.5 Flash: **Part I**
segments each video into subtask spans; **Part II** labels every span. Headline
numbers from the post: **0.306** segmentation F1 and **61.0%** labeling accuracy
at **$2.64 per hour** of video on batch pricing — roughly **19× cheaper** than
human annotation.

> **Note:** The reference pipeline ships in Macrodata's <code>Refiner</code> framework. The
> JSON here is authored to match what the <code>dl_trace</code> tracer would emit
> for the equivalent <code>@ls.udf</code> stages — same node/edge shape as the
> other demos — so the <em>structure</em> is faithful even though the tracer
> wasn't run against the original source.

## How to read it

Left to right, the DAG is the pipeline's dataflow. The two `model` nodes
(`sheets_to_segments`, `windows_to_labels`) are the Gemini calls; `score_segments`
is the review gate (its output is a **mask**, drawn as dashed edges); the two
sinks split accepted annotations from spans sent back for rework.

- **`load_videos`** *(source)* — a batch of robot / ego clips, each with its
  high-level task instruction.
- **`videos_to_frames`** — sample every video at 2 fps (a frame every 0.5 s),
  keeping per-frame timestamps.
- **`frames_to_sheets`** — tile 20 frames into a 4×5 contact sheet at 224 px,
  with the timestamp drawn onto each tile.
- **`sheets_to_segments`** *(Part I — Gemini)* — read the sheets and emit
  subtask spans `(start, end)`.
- **`frames_to_windows`** — for each span, build a **previous / current / next**
  window of contact sheets, 5 frames each.
- **`windows_to_labels`** *(Part II — Gemini)* — label each span from its window.
- **`score_segments`** *(review)* — WGO-Bench gate on span F1 + label accuracy.
- **`save_dataset` / `rework`** *(sinks)* — accepted spans ship; short, low-recall
  ones requeue.

Click any stage below to read the exact `@ls.udf` it traced from — the graph and
the source rail share one selection.

## Part I — segmentation

The load-bearing design choice is the **visual input**: a timestamped contact
sheet beats every alternative the post tried. Drawing the timestamp *on the
frame* — rather than mapping frames to times in text — is worth ~6 F1 points,
and per-frame individual images do worse still.

| Visual input | Segmentation F1 |
| --- | ---: |
| Timestamped contact sheet | **0.263** |
| Text-only frame→time mapping | 0.201 |
| Per-frame individual images | 0.193 |
| Fixed-length baseline | 0.070 |

*(224 px tiles, 20 frames per sheet in a 4×5 grid, one frame every 0.5 s. Higher
tile resolutions did not help.)*

Model choice mattered as much as input format: **Gemini 3.5 Flash** led the
board, beating the best non-Gemini model (**GPT-5.5**) by **24.5%**. A round of
[GEPA](https://arxiv.org/abs/2507.19457) prompt search (`completed_events_duration_prior_v1`)
then lifted the best model from **0.290 → 0.306 F1** by teaching it to cut only
on **completed manipulation events** — object grasped, placed, released, a state
transition — and *not* to segment approach, grasp adjustment, small
repositioning, or retreat unless the world state changes.

## Part II — labeling

Labeling runs on the segmentation output as a prior ("seeded relabeling"): the
model is handed the span's first-pass label and the surrounding context, and
mostly verifies or minimally corrects it. Neighboring-segment context is what
moves the needle.

| Context given to the labeler | Accuracy |
| --- | ---: |
| Target segment only (5 frames) | 56.1% |
| **Previous / current / next** segment | **61.0%** |
| Prev / current / next + episode overview | 60.8% |
| Seeded relabeling on predicted spans | 78.1% |

## Where it breaks

The pipeline is bottlenecked by **short subtasks**: segments under 2 seconds are
recalled only **7.4%** of the time, and recall stays under 50% for everything
shorter than 10 seconds. Labeling errors are overwhelmingly *grounding* errors —
wrong target or direction (42.5%) and right-verb-wrong-object (25.0%) dominate.
End-to-end (segment **and** label correct) semantic F1 lands at **0.168**.

Performance is also strongly viewpoint-dependent: robot head-camera video is far
easier than egocentric human video.

| WGO-Bench source | Viewpoint | Episodes | Segments | Seg. F1 |
| --- | --- | ---: | ---: | ---: |
| Galaxea | robot head camera | 25 | 123 | **0.589** |
| DROID | external robot camera | 50 | 150 | 0.292 |
| HomER | egocentric (human) | 25 | 470 | 0.227 |

*100 episodes · 743 segments · 62 unique task instructions. Dataset:
[macrodata/WGO-Bench](https://huggingface.co/datasets/macrodata/WGO-Bench).*

---

**Source:** [*Annotating Robot Video Subtasks*](https://macrodata.co/blog/annotating-robot-video-subtasks),
Macrodata Labs · **See also:** [Pipeline Graph](reference/pipeline-view-pipeline-graph.md)
(the component) · [Anatomy](reference/pipeline-view-anatomy.md) (field-to-pixel map) ·
[Pipeline Graph JSON](reference/pipeline-view-pipeline-graph-json.md) (the data model).
