/**
 * A single contiguous phase/segment of the video. Segments tile the whole
 * timeline with no gaps or overlaps: after normalization `end === next.start`
 * and the first segment starts at 0. `verified` is the human-confirmed flag —
 * any structural edit (split/merge/boundary move) resets it to false on the
 * affected segments.
 */
export interface Segment {
  /**
   * Stable identity for the segment, preserved across structural edits
   * (split keeps the left half's id and mints a new one for the right half;
   * merge keeps the earlier segment's id). Host bookkeeping (review flags,
   * unsaved markers, React keys) should track this id, NOT the array index —
   * indices shift on split/merge. Optional in the public type; the component
   * backfills a stable id for any segment that omits one.
   */
  id?: string;
  start: number;
  end: number;
  description: string;
  verified: boolean;
  /**
   * Purely-presentational hints (host-set; the component only reflects them as
   * timeline-chip borders — it never reads or sets them):
   *  - `edited`: the caption was edited (with no structural change) → amber border.
   *  - `resegmented`: a structural split / merge / retime touched it → purple border.
   * These are meant to be mutually exclusive; a selected chip's accent border
   * takes precedence over both.
   */
  edited?: boolean;
  resegmented?: boolean;
}

/**
 * A labelling lane: a named row of contiguous {@link Segment}s over the shared
 * time axis. Used in multi-track mode (the `tracks` prop). Each track is fully
 * editable — split / merge / boundary-drag / select — but only the active track
 * receives edits at a time.
 */
export interface Track {
  id: string;
  name: string;
  segments: Segment[];
}

import type { ReactNode } from "react";

export interface VideoAnnotatorProps {
  /** Video source URL. When empty, a placeholder message shows in the stage. */
  videoUrl?: string | null;

  /**
   * Take over the `<video>` element's media source instead of `videoUrl`. Called
   * once with the mounted `<video>` (may return a cleanup run on unmount / when
   * the callback identity changes). Use for streaming sources the component
   * can't express as a plain URL — e.g. a MediaSource fed by a seek-aware
   * fragment streamer. When provided, the component does NOT set `src` from
   * `videoUrl` and hides the "no video" placeholder.
   */
  attachMedia?: (video: HTMLVideoElement) => void | (() => void);

  /** Optional title shown in a header row above the video (e.g. the clip name). */
  videoTitle?: string;
  /** Optional monospace subtitle beside the title (e.g. the file path). */
  videoSubtitle?: string;
  /** Optional element at the start of the header row (e.g. a "show list" button). */
  headerLeading?: ReactNode;

  /**
   * Render the boxed description editor for the selected segment below the
   * timeline (matches the reference labeling layout). Requires
   * `onDescriptionChange` to be interactive.
   */
  showDescription?: boolean;
  /** Fired when the description editor changes: `(segmentIndex, nextText)`. */
  onDescriptionChange?: (index: number, value: string) => void;
  /**
   * Authoritative clip duration in seconds. When omitted, the component falls
   * back to the `<video>` element's own `loadedmetadata` duration, then to the
   * largest segment end.
   */
  duration?: number;
  /** Frames-per-second used for frame-stepping granularity (←/→). Falls back to 30. */
  extractFps?: number | null;
  /**
   * Source fps used only for the "· fN" frame readout. Falls back to
   * `extractFps`, then 30 — so the readout's frame number matches the
   * granularity of ←/→ frame-stepping instead of silently assuming 30.
   */
  srcFps?: number | null;

  /**
   * Controlled segment list (single-track mode). Provide EITHER `segments`
   * (one track) OR `tracks` (multiple tracks) — not both. The component
   * enforces the contiguous invariant.
   */
  segments?: Segment[];
  /** Controlled index of the active segment within the active track. */
  selectedIndex: number;
  /** Fired after a structural edit in single-track mode (split / merge / boundary drag). */
  onSegmentsChange?: (next: Segment[]) => void;
  /** Fired when the active segment changes (j/k, click, seek-to-phase). */
  onSelectedChange: (index: number) => void;

  /**
   * Controlled track list (multi-track mode). When present, the component
   * renders one editable lane per track stacked under the shared ruler, with
   * one active track at a time. Takes precedence over `segments`.
   */
  tracks?: Track[];
  /** Controlled index of the active track. Default 0. */
  activeTrackIndex?: number;
  /** Fired after a structural edit in multi-track mode (returns the full track list). */
  onTracksChange?: (next: Track[]) => void;
  /** Fired when the active track changes (click a lane, add/remove). */
  onActiveTrackChange?: (index: number) => void;
  /** Show the "+ Track" control. Default true in multi-track mode. */
  allowAddTracks?: boolean;
  /** Add-track handler. If omitted, the component appends a default full-length track via `onTracksChange`. */
  onAddTrack?: () => void;
  /** Remove-track handler. If omitted, the component drops the track by index via `onTracksChange`. */
  onRemoveTrack?: (index: number) => void;
  /** Rename-track handler (double-click a track name). If omitted, the component updates the name via `onTracksChange`. */
  onRenameTrack?: (index: number, name: string) => void;
  /** Fired when the user toggles verification on the active segment (A key / no-op if absent). */
  onApproveToggle?: (index: number, verified: boolean) => void;

  /** Playback-speed options for the speed dropdown. Default [0.25,0.5,1,1.5,2]. */
  speeds?: number[];
  /**
   * Install the document-level keyboard shortcuts (Space, ←/→, ,/., s, j/k, a,
   * Backspace). Default true. Set false to drive the component only via the
   * imperative ref, e.g. when the host owns a global shortcut scheme.
   */
  enableKeyboard?: boolean;

  /**
   * Optional hand-pose keypoint overlay (the `handpose_keypoints` standard
   * envelope). When present, a "Hands" toggle appears in the transport and a
   * canvas draws the 21-keypoint hand skeletons over the video, synced to the
   * playhead. Self-contained — no viz dependency. The overlay is OFF by default.
   */
  handpose?: HandposeEnvelope | null;
  /**
   * Show the hand-pose toggle even before `handpose` data has arrived — for
   * sources that load the (possibly large) pose blob in the background. The
   * toggle appears; turning it on before the data is ready shows a spinner on
   * the button (see `handposeLoading`).
   */
  handposeAvailable?: boolean;
  /** The hand-pose blob is still downloading. When the toggle is on and data
   *  isn't ready yet, the button shows a loading spinner instead of the icon. */
  handposeLoading?: boolean;
  /** Start with the hand-pose overlay visible. Default false (unchecked). */
  defaultShowHandpose?: boolean;

  className?: string;
}

/** One detected hand in a {@link HandposeFrame}. `keypoints2d` are 21 `[x, y]`
 *  points in the source image's pixel space (see {@link HandposeEnvelope.image});
 *  everything else is optional and may be null depending on the model. */
export interface HandposeHand {
  handedness?: "left" | "right" | null;
  score?: number | null;
  boxXYXY?: [number, number, number, number] | null;
  keypoints2d: [number, number][];
  keypointScores?: number[] | null;
  keypoints3d?: [number, number, number][] | null;
}

/** Hands detected at one sampled video frame. `timestampSec` is the alignment
 *  key used to look the frame up against the playhead. */
export interface HandposeFrame {
  frameIndex: number;
  timestampSec: number;
  hands: HandposeHand[];
}

/** The `handpose_keypoints` standard envelope (one per video). Mirrors the
 *  backend schema; only the fields the overlay needs are typed strictly. */
export interface HandposeEnvelope {
  schemaVersion?: string;
  kind?: string;
  method?: string;
  poseModel?: "mano" | "native2d" | (string & {});
  keypointNames?: string[];
  /** Pixel space the `keypoints2d` live in (annotation-time frame size). */
  image: { width: number; height: number };
  has3d?: boolean;
  coordinateSpaces?: Record<string, string>;
  video?: {
    width?: number;
    height?: number;
    fps?: number;
    durationSec?: number;
    sourceFrames?: number;
  };
  sampling?: {
    fps?: number;
    maxFrames?: number | null;
    startSec?: number | null;
    endSec?: number | null;
  };
  frames: HandposeFrame[];
}

/** Imperative handle exposed via ref for host-driven control. */
export interface VideoAnnotatorHandle {
  split: () => void;
  merge: () => void;
  stepFrame: (dir: number, big?: boolean) => void;
  gotoBoundary: (dir: number) => void;
  /**
   * Select the segment at `index` AND seek the video to its start (the same
   * action as clicking a not-yet-selected segment on the timeline or pressing
   * j/k). Lets a host list (e.g. a review panel) drive selection so the seek
   * happens inside the component, which owns the media element. No-op if the
   * index is out of range.
   */
  goToSegment: (index: number) => void;
  play: () => void;
  pause: () => void;
  toggleApprove: () => void;
  /** The underlying media element, or null before mount. */
  video: HTMLVideoElement | null;
}
