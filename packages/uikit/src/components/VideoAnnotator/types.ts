/**
 * A single contiguous phase/segment of the video. Segments tile the whole
 * timeline with no gaps or overlaps: after normalization `end === next.start`
 * and the first segment starts at 0. `verified` is the human-confirmed flag —
 * any structural edit (split/merge/boundary move) resets it to false on the
 * affected segments.
 */
export interface Segment {
  start: number;
  end: number;
  description: string;
  verified: boolean;
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
  /** Source fps used only for the "· fN" frame readout. Falls back to 30. */
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

  /** Loop playback within the selected segment. Default true. */
  loop?: boolean;
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
  play: () => void;
  pause: () => void;
  toggleApprove: () => void;
  /** The underlying media element, or null before mount. */
  video: HTMLVideoElement | null;
}
