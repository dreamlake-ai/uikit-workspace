// Self-contained hand-pose overlay helpers for VideoAnnotator. No viz / external
// dependency. Matches the color-per-finger convention used by the hand-pose
// video renderer (fortyfive-ai/macrodata-subtask): every keypoint is colored by
// which finger it belongs to (wrist its own color), bones by their child joint's
// finger, and the palette is identical for left and right hands.
import type { HandposeEnvelope, HandposeFrame } from "./types";

// Per-finger colors (RGB hex; the source uses the same values in BGR for OpenCV).
export const FINGER_COLORS = {
  wrist: "#ffffff", // white
  thumb: "#ff0000", // red
  index: "#ffa500", // orange
  middle: "#ffff00", // yellow
  ring: "#00ff00", // green
  pinky: "#0000ff", // blue
} as const;

type Finger = keyof typeof FINGER_COLORS;

/** Finger group for a keypoint index (0..20); index 0 (wrist) → 'wrist'.
 *  Positional — matches the standard keypointNames order, so left and right
 *  hands are colored identically. */
export function fingerOfIndex(i: number): Finger {
  if (i <= 0) return "wrist";
  if (i <= 4) return "thumb";
  if (i <= 8) return "index";
  if (i <= 12) return "middle";
  if (i <= 16) return "ring";
  return "pinky";
}

/** RGB hex color for a keypoint index, by finger (handedness-independent). */
export function colorForIndex(i: number): string {
  return FINGER_COLORS[fingerOfIndex(i)];
}

// 21-keypoint connectivity: wrist → each finger's 4 joints (fan from the wrist,
// no inter-knuckle palm arcs). Each bone is drawn in its CHILD joint's color.
export const HAND_BONES: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [0, 9], [9, 10], [10, 11], [11, 12], // middle
  [0, 13], [13, 14], [14, 15], [15, 16], // ring
  [0, 17], [17, 18], [18, 19], [19, 20], // pinky
];

/** Nearest frame to time `t` (seconds), or null if the closest one is farther
 *  than `tolSec` away (so the overlay disappears outside the sampled range).
 *  Assumes `env.frames` is sorted ascending by `timestampSec` (the standard). */
export function nearestFrame(
  env: HandposeEnvelope,
  t: number,
  tolSec: number,
): HandposeFrame | null {
  const frames = env.frames;
  const n = frames?.length ?? 0;
  if (!n) return null;
  let lo = 0;
  let hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (frames[mid].timestampSec < t) lo = mid + 1;
    else hi = mid;
  }
  let best = frames[lo];
  if (lo > 0 && Math.abs(frames[lo - 1].timestampSec - t) < Math.abs(best.timestampSec - t)) {
    best = frames[lo - 1];
  }
  return Math.abs(best.timestampSec - t) <= tolSec ? best : null;
}

/** Time tolerance for the nearest-frame lookup: ~1.5 sampling intervals so
 *  consecutive sampled frames tile the timeline without flicker. */
export function frameTolerance(env: HandposeEnvelope): number {
  const fps = env.sampling?.fps || env.video?.fps || 5;
  return Math.max(0.12, 1.5 / fps);
}

/** Frame index of the video frame presented at `mediaTime`, in the 0-based pose
 *  index space. `contentStart` is the stream's media-time origin (a CMAF
 *  fragment's baseMediaDecodeTime can be non-zero); subtracting it lands index 0
 *  on pose frame 0. Shared by the hand-pose overlay and the VideoAnnotator
 *  readout/frame-stepping so all three name the exact same frame. */
export function frameAtMediaTime(mediaTime: number, contentStart: number, fps: number): number {
  return Math.max(0, Math.round((mediaTime - contentStart) * fps));
}

interface DrawOpts {
  /** Rendered short side (px) — auto-scales dot radius / bone width. */
  dim?: number;
  /** Drop keypoints whose score is below this (when scores are present). */
  minScore?: number;
  /** Draw the handedness initial (L/R) at the wrist. Default true. */
  drawLabels?: boolean;
}

/** Draw one frame's hands onto a 2D context. `sx`/`sy` map image-pixel coords →
 *  rendered-video px. Colors per finger; sizes auto-scale to `opts.dim`. */
export function drawHandposeFrame(
  ctx: CanvasRenderingContext2D,
  frame: HandposeFrame,
  sx: number,
  sy: number,
  opts: DrawOpts = {},
): void {
  const dim = opts.dim ?? 512;
  const minScore = opts.minScore ?? 0;
  const drawLabels = opts.drawLabels ?? true;
  const radius = Math.max(2, dim / 300);
  const thick = Math.max(1.5, dim / 500);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = thick;

  for (const hand of frame.hands) {
    const kp = hand.keypoints2d;
    if (!kp || kp.length !== 21) continue;
    const scores = hand.keypointScores;
    const vis = (i: number) => {
      const p = kp[i];
      if (!p) return false;
      const s = scores?.[i];
      return s == null || s >= minScore;
    };

    // Bones — each in its child joint's finger color.
    for (const [a, b] of HAND_BONES) {
      if (!vis(a) || !vis(b)) continue;
      ctx.strokeStyle = colorForIndex(b);
      ctx.beginPath();
      ctx.moveTo(kp[a][0] * sx, kp[a][1] * sy);
      ctx.lineTo(kp[b][0] * sx, kp[b][1] * sy);
      ctx.stroke();
    }

    // Joints — each in its finger color (wrist white).
    for (let i = 0; i < kp.length; i++) {
      if (!vis(i)) continue;
      ctx.beginPath();
      ctx.arc(kp[i][0] * sx, kp[i][1] * sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = colorForIndex(i);
      ctx.fill();
    }

    // Handedness label (L / R) at the wrist.
    if (drawLabels && hand.handedness && vis(0)) {
      const tag = hand.handedness[0].toUpperCase();
      ctx.fillStyle = FINGER_COLORS.wrist;
      ctx.font = `600 ${Math.max(11, dim / 42)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(tag, kp[0][0] * sx + radius * 1.5, kp[0][1] * sy - radius);
    }
  }
}
