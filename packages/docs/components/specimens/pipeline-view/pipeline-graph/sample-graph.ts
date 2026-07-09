// Real `dl_trace` output for three example pipelines (from the
// dreamlake-pipeline-examples repo). Used by the PipelineGraph doc demos.
// Regenerate with:  python -m dl_trace <file>
import type { PipelineGraphData } from '@dreamlake/uikit'

const SAMPLES = {
  "image_object_annotation": {
    "id": "image_object_annotation",
    "title": "image_object_annotation",
    "subtitle": "Annotate the objects in this image.",
    "nodes": {
      "load_images": {
        "id": "load_images",
        "title": "load_images",
        "kind": "source",
        "inputs": [],
        "outputs": [
          "out"
        ],
        "columns": [
          "images"
        ],
        "status": "idle",
        "code": "def load_images() -> Tuple[\"images\"]:\n    \"\"\"Pull the batch of images to annotate.\"\"\"\n    ...",
        "config": {
          "kind": "source"
        },
        "pos": {
          "x": 40,
          "y": 36
        }
      },
      "detect_objects": {
        "id": "detect_objects",
        "title": "detect_objects",
        "kind": "transform",
        "inputs": [
          "images"
        ],
        "outputs": [
          "out"
        ],
        "columns": [
          "boxes",
          "classes",
          "confidence"
        ],
        "status": "idle",
        "code": "def detect_objects(images: Tensor[\"N\", \"H\", \"W\", 3]) -> Tuple[\"boxes\", \"classes\", \"confidence\"]:\n    \"\"\"Detect objects in each image; one row per box, confidence in [0, 1].\"\"\"\n    ...",
        "config": {},
        "pos": {
          "x": 248,
          "y": 36
        }
      },
      "review_boxes": {
        "id": "review_boxes",
        "title": "review_boxes",
        "kind": "review",
        "inputs": [
          "labels"
        ],
        "outputs": [
          "out"
        ],
        "columns": [
          "mask"
        ],
        "status": "idle",
        "code": "def review_boxes(labels) -> Mask[\"R\", \"N\"]:\n    \"\"\"R reviewers pass/fail each box (e.g. IoU against a spot-check set).\"\"\"\n    ...",
        "config": {
          "kind": "review"
        },
        "pos": {
          "x": 456,
          "y": 36
        }
      },
      "save_dataset": {
        "id": "save_dataset",
        "title": "save_dataset",
        "kind": "sink",
        "inputs": [
          "rows"
        ],
        "outputs": [],
        "columns": [],
        "status": "idle",
        "code": "def save_dataset(rows):\n    \"\"\"Write the accepted rows to the dataset (wraps dreamlake.to_dataset).\"\"\"\n    to_dataset(rows)",
        "config": {
          "kind": "sink"
        },
        "pos": {
          "x": 664,
          "y": 36
        }
      },
      "rework": {
        "id": "rework",
        "title": "rework",
        "kind": "sink",
        "inputs": [
          "rows"
        ],
        "outputs": [],
        "columns": [],
        "status": "idle",
        "code": "def rework(rows):\n    \"\"\"Send the disagreed rows back for rework (wraps dreamlake.requeue).\"\"\"\n    requeue(rows)",
        "config": {
          "kind": "sink"
        },
        "pos": {
          "x": 664,
          "y": 144
        }
      }
    },
    "edges": [
      {
        "from": "load_images",
        "fromPort": "out",
        "to": "detect_objects",
        "toPort": "images",
        "kind": "data"
      },
      {
        "from": "detect_objects",
        "fromPort": "out",
        "to": "review_boxes",
        "toPort": "labels",
        "kind": "data"
      },
      {
        "from": "detect_objects",
        "fromPort": "out",
        "to": "save_dataset",
        "toPort": "rows",
        "kind": "data"
      },
      {
        "from": "review_boxes",
        "fromPort": "out",
        "to": "save_dataset",
        "toPort": "rows",
        "kind": "mask"
      },
      {
        "from": "detect_objects",
        "fromPort": "out",
        "to": "rework",
        "toPort": "rows",
        "kind": "data"
      },
      {
        "from": "review_boxes",
        "fromPort": "out",
        "to": "rework",
        "toPort": "rows",
        "kind": "mask"
      }
    ],
    "code": "\"\"\"Annotate the objects in this image.\n\ndetect → review → consensus filter → sink, with a rework loop for the\nlabels the reviewers disagree on. EVERY function the pipeline calls is a\n`@ls.udf`: the data source is a `kind=\"source\"` udf, and the framework\nsinks (`to_dataset` / `requeue`) are wrapped in `kind=\"sink\"` udfs. So\nthe tracer only ever sees decorated calls. UDF bodies are placeholders.\n\"\"\"\n\nimport dreamlake as dl\nimport lakeshore as ls\nfrom dreamlake import batch, requeue, to_dataset\nfrom lakeshore.types import Mask, Tensor, Tuple\n\n\n@ls.udf(kind=\"source\")\ndef load_images() -> Tuple[\"images\"]:\n    \"\"\"Pull the batch of images to annotate.\"\"\"\n    ...\n\n\n@ls.udf\ndef detect_objects(images: Tensor[\"N\", \"H\", \"W\", 3]) -> Tuple[\"boxes\", \"classes\", \"confidence\"]:\n    \"\"\"Detect objects in each image; one row per box, confidence in [0, 1].\"\"\"\n    ...\n\n\n@ls.udf(kind=\"review\")\ndef review_boxes(labels) -> Mask[\"R\", \"N\"]:\n    \"\"\"R reviewers pass/fail each box (e.g. IoU against a spot-check set).\"\"\"\n    ...\n\n\n@ls.udf(kind=\"sink\")\ndef save_dataset(rows):\n    \"\"\"Write the accepted rows to the dataset (wraps dreamlake.to_dataset).\"\"\"\n    to_dataset(rows)\n\n\n@ls.udf(kind=\"sink\")\ndef rework(rows):\n    \"\"\"Send the disagreed rows back for rework (wraps dreamlake.requeue).\"\"\"\n    requeue(rows)\n\n\n@dl.pipeline\ndef image_object_annotation():\n    src = load_images()\n    for items in batch(src, n=64):              # batch = chunked/streamed run\n        labels    = detect_objects(items.images)    # Items  -> Labels\n        review    = review_boxes(labels)            # Labels -> Mask[R, N]\n\n        consensus = review.all(axis=0)              # ∩ over reviewers\n        save_dataset(labels[consensus])             # sink: agreed boxes\n        rework(labels[~consensus])                  # disagreements → rework\n",
    "nodeCount": 5
  },
  "video_task_annotation": {
    "id": "video_task_annotation",
    "title": "video_task_annotation",
    "subtitle": "Text-annotate tasks in videos.",
    "nodes": {
      "load_clips": {
        "id": "load_clips",
        "title": "load_clips",
        "kind": "source",
        "inputs": [],
        "outputs": [
          "out"
        ],
        "columns": [
          "clips",
          "prompts"
        ],
        "status": "idle",
        "code": "def load_clips() -> Tuple[\"clips\", \"prompts\"]:\n    \"\"\"Pull the batch of clips (with their task prompts) to annotate.\"\"\"\n    ...",
        "config": {
          "kind": "source"
        },
        "pos": {
          "x": 40,
          "y": 36
        }
      },
      "caption_model_a": {
        "id": "caption_model_a",
        "title": "caption_model_a",
        "kind": "transform",
        "inputs": [
          "clips",
          "prompts"
        ],
        "outputs": [
          "out"
        ],
        "columns": [
          "caption",
          "confidence"
        ],
        "status": "idle",
        "code": "def caption_model_a(clips, prompts: String[\"N\"]) -> Tuple[\"caption\", \"confidence\"]:\n    \"\"\"Caption each clip with a task description; confidence in [0, 1].\"\"\"\n    ...",
        "config": {},
        "pos": {
          "x": 248,
          "y": 36
        }
      },
      "caption_model_b": {
        "id": "caption_model_b",
        "title": "caption_model_b",
        "kind": "transform",
        "inputs": [
          "clips",
          "prompts"
        ],
        "outputs": [
          "out"
        ],
        "columns": [
          "caption",
          "confidence"
        ],
        "status": "idle",
        "code": "def caption_model_b(clips, prompts: String[\"N\"]) -> Tuple[\"caption\", \"confidence\"]:\n    \"\"\"Same signature as model A — a different captioner.\"\"\"\n    ...",
        "config": {},
        "pos": {
          "x": 248,
          "y": 144
        }
      },
      "caption_model_c": {
        "id": "caption_model_c",
        "title": "caption_model_c",
        "kind": "transform",
        "inputs": [
          "clips",
          "prompts"
        ],
        "outputs": [
          "out"
        ],
        "columns": [
          "caption",
          "confidence"
        ],
        "status": "idle",
        "code": "def caption_model_c(clips, prompts: String[\"N\"]) -> Tuple[\"caption\", \"confidence\"]:\n    \"\"\"Same signature as model A — a third captioner.\"\"\"\n    ...",
        "config": {},
        "pos": {
          "x": 248,
          "y": 252
        }
      },
      "merge_captions": {
        "id": "merge_captions",
        "title": "merge_captions",
        "kind": "merge",
        "inputs": [
          "a",
          "b",
          "c"
        ],
        "outputs": [
          "out"
        ],
        "columns": [
          "caption",
          "confidence"
        ],
        "status": "idle",
        "code": "def merge_captions(a, b, c) -> Tuple[\"caption\", \"confidence\"]:\n    \"\"\"Reconcile the three candidate sets into one (the quotient op).\"\"\"\n    ...",
        "config": {},
        "pos": {
          "x": 456,
          "y": 36
        }
      },
      "semantic_match": {
        "id": "semantic_match",
        "title": "semantic_match",
        "kind": "review",
        "inputs": [
          "labels",
          "reference"
        ],
        "outputs": [
          "out"
        ],
        "columns": [
          "mask"
        ],
        "status": "idle",
        "code": "def semantic_match(labels, reference) -> Mask[\"N\"]:\n    \"\"\"Match predicate: does each model caption agree with the merged one?\"\"\"\n    ...",
        "config": {
          "kind": "review"
        },
        "pos": {
          "x": 664,
          "y": 36
        }
      },
      "semantic_match_2": {
        "id": "semantic_match_2",
        "title": "semantic_match",
        "kind": "review",
        "inputs": [
          "labels",
          "reference"
        ],
        "outputs": [
          "out"
        ],
        "columns": [
          "mask"
        ],
        "status": "idle",
        "code": "def semantic_match(labels, reference) -> Mask[\"N\"]:\n    \"\"\"Match predicate: does each model caption agree with the merged one?\"\"\"\n    ...",
        "config": {
          "kind": "review"
        },
        "pos": {
          "x": 664,
          "y": 144
        }
      },
      "semantic_match_3": {
        "id": "semantic_match_3",
        "title": "semantic_match",
        "kind": "review",
        "inputs": [
          "labels",
          "reference"
        ],
        "outputs": [
          "out"
        ],
        "columns": [
          "mask"
        ],
        "status": "idle",
        "code": "def semantic_match(labels, reference) -> Mask[\"N\"]:\n    \"\"\"Match predicate: does each model caption agree with the merged one?\"\"\"\n    ...",
        "config": {
          "kind": "review"
        },
        "pos": {
          "x": 664,
          "y": 252
        }
      },
      "majority_vote": {
        "id": "majority_vote",
        "title": "majority_vote",
        "kind": "review",
        "inputs": [
          "a",
          "b",
          "c"
        ],
        "outputs": [
          "out"
        ],
        "columns": [
          "mask"
        ],
        "status": "idle",
        "code": "def majority_vote(a, b, c) -> Mask[\"N\"]:\n    \"\"\"Stack the three masks and keep rows the majority agree on.\"\"\"\n    ...",
        "config": {
          "kind": "review"
        },
        "pos": {
          "x": 872,
          "y": 36
        }
      },
      "save_dataset": {
        "id": "save_dataset",
        "title": "save_dataset",
        "kind": "sink",
        "inputs": [
          "rows"
        ],
        "outputs": [],
        "columns": [],
        "status": "idle",
        "code": "def save_dataset(rows):\n    \"\"\"Write the accepted captions to the dataset (wraps dreamlake.to_dataset).\"\"\"\n    to_dataset(rows)",
        "config": {
          "kind": "sink"
        },
        "pos": {
          "x": 1080,
          "y": 36
        }
      },
      "rework": {
        "id": "rework",
        "title": "rework",
        "kind": "sink",
        "inputs": [
          "rows"
        ],
        "outputs": [],
        "columns": [],
        "status": "idle",
        "code": "def rework(rows):\n    \"\"\"Send disagreements back for rework (wraps dreamlake.requeue).\"\"\"\n    requeue(rows)",
        "config": {
          "kind": "sink"
        },
        "pos": {
          "x": 1080,
          "y": 144
        }
      }
    },
    "edges": [
      {
        "from": "load_clips",
        "fromPort": "out",
        "to": "caption_model_a",
        "toPort": "clips",
        "kind": "data"
      },
      {
        "from": "load_clips",
        "fromPort": "out",
        "to": "caption_model_a",
        "toPort": "prompts",
        "kind": "data"
      },
      {
        "from": "load_clips",
        "fromPort": "out",
        "to": "caption_model_b",
        "toPort": "clips",
        "kind": "data"
      },
      {
        "from": "load_clips",
        "fromPort": "out",
        "to": "caption_model_b",
        "toPort": "prompts",
        "kind": "data"
      },
      {
        "from": "load_clips",
        "fromPort": "out",
        "to": "caption_model_c",
        "toPort": "clips",
        "kind": "data"
      },
      {
        "from": "load_clips",
        "fromPort": "out",
        "to": "caption_model_c",
        "toPort": "prompts",
        "kind": "data"
      },
      {
        "from": "caption_model_a",
        "fromPort": "out",
        "to": "merge_captions",
        "toPort": "a",
        "kind": "data"
      },
      {
        "from": "caption_model_b",
        "fromPort": "out",
        "to": "merge_captions",
        "toPort": "b",
        "kind": "data"
      },
      {
        "from": "caption_model_c",
        "fromPort": "out",
        "to": "merge_captions",
        "toPort": "c",
        "kind": "data"
      },
      {
        "from": "caption_model_a",
        "fromPort": "out",
        "to": "semantic_match",
        "toPort": "labels",
        "kind": "data"
      },
      {
        "from": "merge_captions",
        "fromPort": "out",
        "to": "semantic_match",
        "toPort": "reference",
        "kind": "data"
      },
      {
        "from": "caption_model_b",
        "fromPort": "out",
        "to": "semantic_match_2",
        "toPort": "labels",
        "kind": "data"
      },
      {
        "from": "merge_captions",
        "fromPort": "out",
        "to": "semantic_match_2",
        "toPort": "reference",
        "kind": "data"
      },
      {
        "from": "caption_model_c",
        "fromPort": "out",
        "to": "semantic_match_3",
        "toPort": "labels",
        "kind": "data"
      },
      {
        "from": "merge_captions",
        "fromPort": "out",
        "to": "semantic_match_3",
        "toPort": "reference",
        "kind": "data"
      },
      {
        "from": "semantic_match",
        "fromPort": "out",
        "to": "majority_vote",
        "toPort": "a",
        "kind": "data"
      },
      {
        "from": "semantic_match_2",
        "fromPort": "out",
        "to": "majority_vote",
        "toPort": "b",
        "kind": "data"
      },
      {
        "from": "semantic_match_3",
        "fromPort": "out",
        "to": "majority_vote",
        "toPort": "c",
        "kind": "data"
      },
      {
        "from": "merge_captions",
        "fromPort": "out",
        "to": "save_dataset",
        "toPort": "rows",
        "kind": "data"
      },
      {
        "from": "majority_vote",
        "fromPort": "out",
        "to": "save_dataset",
        "toPort": "rows",
        "kind": "mask"
      },
      {
        "from": "merge_captions",
        "fromPort": "out",
        "to": "rework",
        "toPort": "rows",
        "kind": "data"
      },
      {
        "from": "majority_vote",
        "fromPort": "out",
        "to": "rework",
        "toPort": "rows",
        "kind": "mask"
      }
    ],
    "code": "\"\"\"Text-annotate tasks in videos.\n\nMulti-agent captioning: three models caption each clip (fan-out), a\nmatch-predicate udf builds each model's agreement mask, and a\n`majority_vote` udf reduces them (fan-in). EVERY function the pipeline\ncalls is a `@ls.udf` — the source and the two sinks included (the\n`stack`/`mean` axis-reduction now lives inside `majority_vote`).\n\"\"\"\n\nimport dreamlake as dl\nimport lakeshore as ls\nfrom dreamlake import batch, requeue, to_dataset\nfrom lakeshore.types import Mask, String, Tensor, Tuple\n\n\n@ls.udf(kind=\"source\")\ndef load_clips() -> Tuple[\"clips\", \"prompts\"]:\n    \"\"\"Pull the batch of clips (with their task prompts) to annotate.\"\"\"\n    ...\n\n\n@ls.udf\ndef caption_model_a(clips, prompts: String[\"N\"]) -> Tuple[\"caption\", \"confidence\"]:\n    \"\"\"Caption each clip with a task description; confidence in [0, 1].\"\"\"\n    ...\n\n\n@ls.udf\ndef caption_model_b(clips, prompts: String[\"N\"]) -> Tuple[\"caption\", \"confidence\"]:\n    \"\"\"Same signature as model A — a different captioner.\"\"\"\n    ...\n\n\n@ls.udf\ndef caption_model_c(clips, prompts: String[\"N\"]) -> Tuple[\"caption\", \"confidence\"]:\n    \"\"\"Same signature as model A — a third captioner.\"\"\"\n    ...\n\n\n@ls.udf\ndef merge_captions(a, b, c) -> Tuple[\"caption\", \"confidence\"]:\n    \"\"\"Reconcile the three candidate sets into one (the quotient op).\"\"\"\n    ...\n\n\n@ls.udf(kind=\"review\")\ndef semantic_match(labels, reference) -> Mask[\"N\"]:\n    \"\"\"Match predicate: does each model caption agree with the merged one?\"\"\"\n    ...\n\n\n@ls.udf(kind=\"review\")\ndef majority_vote(a, b, c) -> Mask[\"N\"]:\n    \"\"\"Stack the three masks and keep rows the majority agree on.\"\"\"\n    ...\n\n\n@ls.udf(kind=\"sink\")\ndef save_dataset(rows):\n    \"\"\"Write the accepted captions to the dataset (wraps dreamlake.to_dataset).\"\"\"\n    to_dataset(rows)\n\n\n@ls.udf(kind=\"sink\")\ndef rework(rows):\n    \"\"\"Send disagreements back for rework (wraps dreamlake.requeue).\"\"\"\n    requeue(rows)\n\n\n@dl.pipeline\ndef video_task_annotation():\n    src = load_clips()\n    for items in batch(src, n=32):                # batch = chunked/streamed run\n        a = caption_model_a(items.clips, items.prompts)   # fan-out:\n        b = caption_model_b(items.clips, items.prompts)   # N UDF calls\n        c = caption_model_c(items.clips, items.prompts)\n\n        labels = merge_captions(a, b, c)              # quotient\n\n        ma = semantic_match(a, labels)                # per-model agreement masks\n        mb = semantic_match(b, labels)\n        mc = semantic_match(c, labels)\n        majority = majority_vote(ma, mb, mc)          # fan-in: axis-reduction\n\n        save_dataset(labels[majority])                # sink\n        rework(labels[~majority])                     # disagreements → rework\n",
    "nodeCount": 11
  },
  "camera_pose_trajectory": {
    "id": "camera_pose_trajectory",
    "title": "camera_pose_trajectory",
    "subtitle": "Recover the camera pose trajectory from a video.",
    "nodes": {
      "load_videos": {
        "id": "load_videos",
        "title": "load_videos",
        "kind": "source",
        "inputs": [],
        "outputs": [
          "out"
        ],
        "columns": [
          "videos"
        ],
        "status": "idle",
        "code": "def load_videos() -> Tuple[\"videos\"]:\n    \"\"\"Pull the batch of videos to process.\"\"\"\n    ...",
        "config": {
          "kind": "source"
        },
        "pos": {
          "x": 40,
          "y": 36
        }
      },
      "extract_frames": {
        "id": "extract_frames",
        "title": "extract_frames",
        "kind": "transform",
        "inputs": [
          "videos"
        ],
        "outputs": [
          "out"
        ],
        "columns": [
          "frames",
          "timestamps"
        ],
        "status": "idle",
        "code": "def extract_frames(videos: Tensor[\"N\"]) -> Tuple[\"frames\", \"timestamps\"]:\n    \"\"\"Decode each video into a frame column plus per-frame timestamps.\"\"\"\n    ...",
        "config": {},
        "pos": {
          "x": 248,
          "y": 36
        }
      },
      "detect_features": {
        "id": "detect_features",
        "title": "detect_features",
        "kind": "transform",
        "inputs": [
          "frames"
        ],
        "outputs": [
          "out"
        ],
        "columns": [
          "keypoints",
          "descriptors"
        ],
        "status": "idle",
        "code": "def detect_features(frames: Tensor[\"N\", \"H\", \"W\", 3]) -> Tuple[\"keypoints\", \"descriptors\"]:\n    \"\"\"Per-frame keypoints and descriptors (e.g. SuperPoint).\"\"\"\n    ...",
        "config": {},
        "pos": {
          "x": 456,
          "y": 36
        }
      },
      "estimate_poses": {
        "id": "estimate_poses",
        "title": "estimate_poses",
        "kind": "transform",
        "inputs": [
          "keypoints",
          "descriptors"
        ],
        "outputs": [
          "out"
        ],
        "columns": [
          "poses",
          "confidence"
        ],
        "status": "idle",
        "code": "def estimate_poses(keypoints, descriptors) -> Tuple[\"poses\", \"confidence\"]:\n    \"\"\"Visual odometry / SfM placeholder; poses are 4x4 world-from-camera.\"\"\"\n    ...",
        "config": {},
        "pos": {
          "x": 664,
          "y": 36
        }
      },
      "bundle_adjust": {
        "id": "bundle_adjust",
        "title": "bundle_adjust",
        "kind": "transform",
        "inputs": [
          "poses"
        ],
        "outputs": [
          "out"
        ],
        "columns": [
          "poses",
          "residual"
        ],
        "status": "idle",
        "code": "def bundle_adjust(poses: Tensor[\"N\", 4, 4]) -> Tuple[\"poses\", \"residual\"]:\n    \"\"\"Global refinement; residual is the reprojection error per frame.\"\"\"\n    ...",
        "config": {},
        "pos": {
          "x": 872,
          "y": 36
        }
      },
      "save_dataset": {
        "id": "save_dataset",
        "title": "save_dataset",
        "kind": "sink",
        "inputs": [
          "rows"
        ],
        "outputs": [],
        "columns": [],
        "status": "idle",
        "code": "def save_dataset(rows):\n    \"\"\"Write the trajectory to the dataset (wraps dreamlake.to_dataset).\"\"\"\n    to_dataset(rows)",
        "config": {
          "kind": "sink"
        },
        "pos": {
          "x": 1080,
          "y": 36
        }
      },
      "rework": {
        "id": "rework",
        "title": "rework",
        "kind": "sink",
        "inputs": [
          "rows"
        ],
        "outputs": [],
        "columns": [],
        "status": "idle",
        "code": "def rework(rows):\n    \"\"\"Send low-confidence frames back (wraps dreamlake.requeue).\"\"\"\n    requeue(rows)",
        "config": {
          "kind": "sink"
        },
        "pos": {
          "x": 1080,
          "y": 144
        }
      }
    },
    "edges": [
      {
        "from": "load_videos",
        "fromPort": "out",
        "to": "extract_frames",
        "toPort": "videos",
        "kind": "data"
      },
      {
        "from": "extract_frames",
        "fromPort": "out",
        "to": "detect_features",
        "toPort": "frames",
        "kind": "data"
      },
      {
        "from": "detect_features",
        "fromPort": "out",
        "to": "estimate_poses",
        "toPort": "keypoints",
        "kind": "data"
      },
      {
        "from": "detect_features",
        "fromPort": "out",
        "to": "estimate_poses",
        "toPort": "descriptors",
        "kind": "data"
      },
      {
        "from": "estimate_poses",
        "fromPort": "out",
        "to": "bundle_adjust",
        "toPort": "poses",
        "kind": "data"
      },
      {
        "from": "bundle_adjust",
        "fromPort": "out",
        "to": "save_dataset",
        "toPort": "rows",
        "kind": "data"
      },
      {
        "from": "estimate_poses",
        "fromPort": "out",
        "to": "save_dataset",
        "toPort": "rows",
        "kind": "mask"
      },
      {
        "from": "bundle_adjust",
        "fromPort": "out",
        "to": "rework",
        "toPort": "rows",
        "kind": "data"
      },
      {
        "from": "estimate_poses",
        "fromPort": "out",
        "to": "rework",
        "toPort": "rows",
        "kind": "mask"
      }
    ],
    "code": "\"\"\"Recover the camera pose trajectory from a video.\n\nframes → features → pose estimation → bundle adjustment; a confidence\nmask (σ-algebra: intersection of two boolean columns) decides what goes\nto the dataset vs. rework. EVERY function the pipeline calls is a\n`@ls.udf` — the source and the two sinks included. UDF bodies are\nplaceholders.\n\"\"\"\n\nimport dreamlake as dl\nimport lakeshore as ls\nfrom dreamlake import batch, requeue, to_dataset\nfrom lakeshore.types import Tensor, Tuple\n\n\n@ls.udf(kind=\"source\")\ndef load_videos() -> Tuple[\"videos\"]:\n    \"\"\"Pull the batch of videos to process.\"\"\"\n    ...\n\n\n@ls.udf\ndef extract_frames(videos: Tensor[\"N\"]) -> Tuple[\"frames\", \"timestamps\"]:\n    \"\"\"Decode each video into a frame column plus per-frame timestamps.\"\"\"\n    ...\n\n\n@ls.udf\ndef detect_features(frames: Tensor[\"N\", \"H\", \"W\", 3]) -> Tuple[\"keypoints\", \"descriptors\"]:\n    \"\"\"Per-frame keypoints and descriptors (e.g. SuperPoint).\"\"\"\n    ...\n\n\n@ls.udf\ndef estimate_poses(keypoints, descriptors) -> Tuple[\"poses\", \"confidence\"]:\n    \"\"\"Visual odometry / SfM placeholder; poses are 4x4 world-from-camera.\"\"\"\n    ...\n\n\n@ls.udf\ndef bundle_adjust(poses: Tensor[\"N\", 4, 4]) -> Tuple[\"poses\", \"residual\"]:\n    \"\"\"Global refinement; residual is the reprojection error per frame.\"\"\"\n    ...\n\n\n@ls.udf(kind=\"sink\")\ndef save_dataset(rows):\n    \"\"\"Write the trajectory to the dataset (wraps dreamlake.to_dataset).\"\"\"\n    to_dataset(rows)\n\n\n@ls.udf(kind=\"sink\")\ndef rework(rows):\n    \"\"\"Send low-confidence frames back (wraps dreamlake.requeue).\"\"\"\n    requeue(rows)\n\n\n@dl.pipeline\ndef camera_pose_trajectory():\n    src = load_videos()\n    for items in batch(src, n=8):               # batch = chunked/streamed run\n        frames = extract_frames(items.videos)\n        feats  = detect_features(frames.frames)\n        poses  = estimate_poses(feats.keypoints, feats.descriptors)\n        traj   = bundle_adjust(poses.poses)\n\n        ok = (poses.confidence > 0.5) & (traj.residual < 1.0)   # A ∩ B\n\n        save_dataset(traj[ok])   # sink: the trajectory\n        rework(traj[~ok])        # low-confidence frames go back\n",
    "nodeCount": 7
  }
} as unknown as Record<string, PipelineGraphData>

export const OBJECT_ANNOTATION = SAMPLES['image_object_annotation']
export const VIDEO_ANNOTATION = SAMPLES['video_task_annotation']
export const CAMERA_POSE = SAMPLES['camera_pose_trajectory']
