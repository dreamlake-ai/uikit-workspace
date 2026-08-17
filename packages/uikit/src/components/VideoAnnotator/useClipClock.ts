import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { clamp, fmt } from "./segments";
import { frameAtMediaTime } from "./handpose";

// requestVideoFrameCallback drives the frame-accurate readout when present
// (falls back to the media clock otherwise).
const HAS_RVFC =
  typeof HTMLVideoElement !== "undefined" &&
  "requestVideoFrameCallback" in HTMLVideoElement.prototype;

/**
 * The clip clock — the single owner of the mapping between the `<video>`
 * element's MEDIA time and the UI's 0-based CLIP time.
 *
 * Why this exists: a streamed clip's media clock does NOT start at 0. Its first
 * frame sits at the first-fragment PTS (`contentStart`, e.g. a CMAF
 * baseMediaDecodeTime), so CLIP time = media − contentStart. If that offset is
 * applied in some places (readout, frame-step) but not others (seek bar,
 * playhead, seeks) the three disagree at t=0. And because frame-stepping seeks
 * to the frame CENTER (so the decoder paints the right frame), the raw media
 * time sits half a frame past the frame's start — so the playhead must be
 * quantized to the frame grid to line up with the frame-indexed readout.
 *
 * Rather than scatter `± contentStart` and `snapToFrame` across a dozen media
 * event handlers and seek sites (where missing ONE reintroduces the drift),
 * this hook owns all of it behind a clip-time API:
 *
 *  - state: `clipTime` (snapped clip seconds) and the derived `readout`.
 *  - reads: `clipNow()` (live, unsnapped) for scrubbing.
 *  - seeks: `seekClip` / `seekMedia` (clip → media, adding contentStart).
 *  - stepping: `stepFrame` (frame-center seek; returns the new clip time).
 *  - media-event sinks: `syncFromMedia` (timeupdate/seeked), `pinToEnd`
 *    (ended), `measure` (loadedmetadata).
 *
 * The component keeps its own event wiring + annotation logic, but never does a
 * raw `± contentStart` or frame-snap itself — so a new call site cannot drift.
 */
export interface ClipClock {
  /** Current CLIP time in seconds, snapped to the frame grid. Drives the
   *  playhead, the seek bar, and everything else the UI positions by time. */
  clipTime: number;
  /** `m:ss.cc / m:ss.cc · fN` — current time / duration · presented frame. */
  readout: string;
  /** Live CLIP time read straight off the media element (unsnapped, clamped to
   *  [0, D]). For scrub feedback that must track the cursor without frame notch. */
  clipNow(): number;
  /** Seek the media to a CLIP position AND optimistically commit it to state. */
  seekClip(clip: number): void;
  /** Seek the media to a CLIP position WITHOUT touching state (state follows via
   *  the seeked event → `syncFromMedia`). For drag-scrub, where the commit is
   *  deferred to mouse-up. */
  seekMedia(clip: number): void;
  /** Step by frame index and seek to the frame CENTER so the decoder paints it.
   *  Returns the new CLIP time (for the caller's selection sync). Pauses first. */
  stepFrame(dir: number, big?: boolean): number;
  /** Read the media clock, map to CLIP, snap to the frame grid, commit to state,
   *  and return it. Wire to the `timeupdate` and `seeked` events. */
  syncFromMedia(): number;
  /** Pin the playhead to the very end (the last frame plays through to D). Wire
   *  to the `ended` event. */
  pinToEnd(): void;
  /** Capture the content-start offset as early as metadata allows. Wire to
   *  `loadedmetadata` (it is also measured lazily on every other read). */
  measure(): void;
}

export function useClipClock({
  videoRef,
  D,
  srcFps,
  extractFps,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Authoritative clip duration in seconds. */
  D: number;
  /** Frame readout fps (→ extractFps → 30). Also the frame-step + snap grid. */
  srcFps?: number | null;
  extractFps?: number | null;
}): ClipClock {
  // The presented frame the decoder is actually showing (rVFC), so the readout
  // matches the picture, not the media clock (which runs ahead during buffering).
  const [currentFrame, setCurrentFrame] = useState(0);
  // The stream's media-time origin (min ever observed; see measureCS). Infinity
  // until first measured.
  const contentStartRef = useRef(Infinity);
  // CLIP time, snapped to the frame grid.
  const [clipTime, setClipTime] = useState(0);

  const fps = srcFps || extractFps || 30;

  // Resolve the content-start offset (the media time of CLIP 0) robustly. A
  // streamed clip's first FRAME sits at its first-fragment PTS — surfaced by
  // `buffered.start(0)` (the fragment's start) and, once frames present, by the
  // rVFC `meta.mediaTime`. NOT `seekable.start`, which is the CONTAINER origin
  // (0 here) and would wrongly cancel the offset. We keep the MINIMUM ever
  // observed, so a later mid-clip seek — whose buffered range starts deep in the
  // clip — can never inflate it (an inflated offset clamps the playhead short of
  // the end).
  const measureCS = useCallback(() => {
    const v = videoRef.current;
    if (v && v.buffered.length) {
      contentStartRef.current = Math.min(contentStartRef.current, v.buffered.start(0));
    }
  }, [videoRef]);
  // Measures on demand so the very first ←/→ (before any event fires) still
  // subtracts the real offset.
  const csNow = useCallback(() => {
    measureCS();
    return Number.isFinite(contentStartRef.current) ? contentStartRef.current : 0;
  }, [measureCS]);

  // Quantize a CLIP time to the START of its frame — the SAME floor the readout
  // uses (`frame index → index/fps`), so the playhead + seek bar sit on the exact
  // frame the readout names. The declared duration usually isn't an exact frame
  // multiple, so the LAST frame starts one frame-period before D yet plays
  // through to D — map it to D so the end is reachable instead of stopping a
  // frame short (which reads as "playback never finished").
  const snapClip = useCallback(
    (clip: number) => {
      const frame = Math.floor(clamp(clip, 0, D) * fps + 1e-6);
      const lastFrame = Math.max(0, Math.round(D * fps) - 1);
      return frame >= lastFrame ? D : frame / fps;
    },
    [D, fps]
  );

  const clipNow = useCallback(() => {
    const v = videoRef.current;
    return v ? clamp(v.currentTime - csNow(), 0, D) : 0;
  }, [videoRef, csNow, D]);

  const seekMedia = useCallback(
    (clip: number) => {
      const v = videoRef.current;
      if (v) v.currentTime = clamp(clip, 0, D) + csNow(); // clip → media
    },
    [videoRef, csNow, D]
  );

  const seekClip = useCallback(
    (clip: number) => {
      const t = clamp(clip, 0, D);
      seekMedia(t);
      setClipTime(t);
    },
    [seekMedia, D]
  );

  const syncFromMedia = useCallback(() => {
    const v = videoRef.current;
    const ct = v ? snapClip(v.currentTime - csNow()) : 0; // media → clip, snapped
    setClipTime(ct);
    return ct;
  }, [videoRef, snapClip, csNow]);

  const pinToEnd = useCallback(() => setClipTime(D), [D]);

  const stepFrame = useCallback(
    (dir: number, big?: boolean) => {
      const v = videoRef.current;
      if (!v) return 0;
      v.pause();
      // Step by FRAME INDEX and seek to the frame CENTER, not the n/fps boundary:
      // n/fps*fps often lands a hair below n, so the decoder shows frame n-1 while
      // the clock reads n. +0.5 guarantees it paints `next`. `cur` floors (the
      // frame interval the playhead sits in) so a prior center-seek doesn't round
      // up a frame. `cs` shifts by the stream's content start.
      const cs = csNow();
      const stepN = big ? Math.max(1, Math.round(fps)) : 1;
      const cur = Math.floor((v.currentTime - cs) * fps + 1e-6);
      const maxFrame = Math.max(0, Math.round(D * fps) - 1);
      const next = clamp(cur + dir * stepN, 0, maxFrame);
      v.currentTime = cs + (next + 0.5) / fps;
      return clamp(v.currentTime - cs, 0, D); // new CLIP time (for selection sync)
    },
    [videoRef, csNow, fps, D]
  );

  // Authoritative displayed-frame tracker. rVFC fires per PRESENTED frame
  // (playback, and once after a paused seek/step lands) and NOT while the picture
  // is stalled — so `currentFrame` follows the picture, freezing with it during
  // cold-start buffering instead of racing ahead like the clock. It also captures
  // the stream's content start (the min PTS) into the shared ref.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || typeof v.requestVideoFrameCallback !== "function") return;
    let handle = v.requestVideoFrameCallback(function loop(_now, meta) {
      measureCS();
      // The presented frame's PTS is ground truth for content-start; the first
      // frame carries the smallest, so the running min converges on the offset.
      contentStartRef.current = Math.min(contentStartRef.current, meta.mediaTime);
      const cs = Number.isFinite(contentStartRef.current) ? contentStartRef.current : 0;
      const f = frameAtMediaTime(meta.mediaTime, cs, fps);
      setCurrentFrame((prev) => (prev === f ? prev : f));
      handle = v.requestVideoFrameCallback(loop);
    });
    return () => v.cancelVideoFrameCallback?.(handle);
  }, [videoRef, measureCS, fps]);

  // Read out the frame the decoder is actually PRESENTING (currentFrame) — not
  // the media clock, which runs ahead of the picture during cold-start
  // buffering. Fall back to the clock where rVFC is absent. Time is derived FROM
  // that frame so the two never disagree; both clamp to D. The last frame plays
  // through to D (duration isn't an exact frame multiple), so report D there —
  // matching snapClip's end-mapping — instead of the last frame's start.
  const readout = useMemo(() => {
    const maxFrame = D > 0 ? Math.max(0, Math.round(D * fps) - 1) : Number.POSITIVE_INFINITY;
    const shownFrame = Math.min(
      HAS_RVFC ? currentFrame : Math.max(0, Math.floor(clipTime * fps + 1e-6)),
      maxFrame
    );
    const shownTime =
      D > 0 ? (shownFrame >= maxFrame ? D : Math.min(shownFrame / fps, D)) : shownFrame / fps;
    return `${fmt(shownTime)} / ${fmt(D)} · f${shownFrame}`;
  }, [D, fps, currentFrame, clipTime]);

  return {
    clipTime,
    readout,
    clipNow,
    seekClip,
    seekMedia,
    stepFrame,
    syncFromMedia,
    pinToEnd,
    measure: measureCS,
  };
}
