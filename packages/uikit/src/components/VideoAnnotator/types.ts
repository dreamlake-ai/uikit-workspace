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

  /** Controlled segment list. The component enforces the contiguous invariant. */
  segments: Segment[];
  /** Controlled index of the active segment. */
  selectedIndex: number;
  /** Fired after any structural edit (split / merge / boundary drag). */
  onSegmentsChange: (next: Segment[]) => void;
  /** Fired when the active segment changes (j/k, click, seek-to-phase). */
  onSelectedChange: (index: number) => void;
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
  className?: string;
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
