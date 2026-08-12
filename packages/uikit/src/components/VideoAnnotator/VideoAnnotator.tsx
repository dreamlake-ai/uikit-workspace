import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../../lib/utils";
import type { Segment, Track, VideoAnnotatorHandle, VideoAnnotatorProps } from "./types";
import {
  boundaryTimes,
  clamp,
  fmt,
  mergeInto,
  moveBoundary,
  normalizeSegments,
  segmentIndexAtTime,
  splitAt,
} from "./segments";
import { useAnnotatorStyles } from "./styles";
import { useAnnotatorKeyboard } from "./useAnnotatorKeyboard";
import { useHandposeOverlay } from "./useHandposeOverlay";
import { frameAtMediaTime } from "./handpose";
import { Transport } from "./Transport";
import { ZoomControl } from "./ZoomControl";
import { Timeline } from "./Timeline";
import { TrackHeads } from "./TrackHeads";
import { DescriptionBox } from "./DescriptionBox";

// Match the browser's native playback-rate menu so the custom menu shows the
// same set (and any rate picked in native controls maps to a listed option).
const DEFAULT_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
// Timeline zoom bounds (continuous). The transport's drag/step both clamp here.
const MIN_ZOOM = 1;
const MAX_ZOOM = 16;
// requestVideoFrameCallback support — drives the frame-accurate readout when
// present (falls back to the media clock otherwise).
const HAS_RVFC =
  typeof HTMLVideoElement !== "undefined" &&
  "requestVideoFrameCallback" in HTMLVideoElement.prototype;

/**
 * VideoAnnotator — a video player with an editable, contiguous segment
 * timeline. Ported from the phase-review labeling template: transport
 * (frame-step, boundary jump, play/pause, speed), a percentage-positioned
 * timeline strip with drag-to-move boundaries + click-to-scrub, and the
 * split / merge / boundary-move invariants. Controlled on `segments` +
 * `selectedIndex`; emits new arrays via `onSegmentsChange`.
 *
 * Playback runs continuously across segments: while playing, the selection
 * follows the playhead (no per-segment loop); at the last segment's end the
 * media simply stops. Clicking a not-yet-selected segment (or a prev/next
 * action) selects it and seeks to its start; clicking the already-selected
 * segment seeks to the exact click position within it.
 */
export const VideoAnnotator = forwardRef<VideoAnnotatorHandle, VideoAnnotatorProps>(
  function VideoAnnotator(
    {
      videoUrl,
      attachMedia,
      videoTitle,
      videoSubtitle,
      headerLeading,
      transportExtra,
      stageOverlay,
      showDescription = false,
      onDescriptionChange,
      duration,
      extractFps,
      srcFps,
      segments,
      selectedIndex,
      onSegmentsChange,
      onSelectedChange,
      onApproveToggle,
      tracks,
      activeTrackIndex,
      onTracksChange,
      onActiveTrackChange,
      allowAddTracks = true,
      onAddTrack,
      onRemoveTrack,
      onRenameTrack,
      speeds = DEFAULT_SPEEDS,
      enableKeyboard = true,
      showSeekBar = false,
      handpose,
      handposeAvailable = false,
      handposeLoading = false,
      defaultShowHandpose = false,
      className,
    }: VideoAnnotatorProps,
    ref
  ) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [currentTime, setCurrentTime] = useState(0);
    // Authoritative displayed frame — the frame the decoder is actually
    // presenting (see the rVFC effect), so the readout + frame-stepping match
    // the picture and the hand-pose overlay, not the media clock (which runs
    // ahead of the picture during cold-start buffering). `contentStartRef` is
    // the stream's media-time origin (a CMAF baseMediaDecodeTime can be
    // non-zero), shared with frame-stepping so both agree on frame N's time.
    const [currentFrame, setCurrentFrame] = useState(0);
    const contentStartRef = useRef(Infinity);
    const [playing, setPlaying] = useState(false);
    const [rate, setRate] = useState(1);
    const [metaDuration, setMetaDuration] = useState(0);
    // Buffered seconds for the custom seek bar's buffered fill (from video.buffered).
    const [buffered, setBuffered] = useState(0);
    // Timeline horizontal magnification (1/2/4/8/16). The timeline canvas widens
    // to `zoom*100%` inside `scrollRef`'s overflow-x container; view is kept
    // centered via scrollLeft.
    const [zoom, setZoom] = useState(1);
    // Hand-pose overlay: OFF by default (a "Hands" toggle in the transport
    // flips it). Only relevant when `handpose` data is supplied.
    const [showHands, setShowHands] = useState(defaultShowHandpose);
    const [toast, setToast] = useState("");
    const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    // Buffering overlay: shown while the media is waiting for data (initial
    // load, or seeking into a not-yet-buffered region of a streamed source).
    // Debounced so instant (already-buffered) seeks don't flash the spinner.
    const [buffering, setBuffering] = useState(false);
    const bufTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const showBuffering = useCallback(() => {
      clearTimeout(bufTimer.current);
      bufTimer.current = setTimeout(() => setBuffering(true), 180);
    }, []);
    const hideBuffering = useCallback(() => {
      clearTimeout(bufTimer.current);
      setBuffering(false);
    }, []);

    useAnnotatorStyles();

    // Keep the toggle in sync if the host later flips `defaultShowHandpose`
    // (the initial useState only captures the first value).
    useEffect(() => {
      setShowHands(defaultShowHandpose);
    }, [defaultShowHandpose]);

    // Clear timers on unmount so they can't setState after teardown.
    useEffect(() => () => {
      clearTimeout(toastTimer.current);
      clearTimeout(bufTimer.current);
    }, []);

    // External media takeover: hand the mounted <video> to the caller (e.g. a
    // streaming source). The caller sets the source and may return a cleanup.
    useEffect(() => {
      const v = videoRef.current;
      if (!attachMedia || !v) return;
      const cleanup = attachMedia(v);
      return () => {
        if (typeof cleanup === "function") cleanup();
      };
    }, [attachMedia]);

    // Multi-track (tracks) or single-track (segments): normalize both to one
    // track-list + active-index model so the rest of the component is uniform.
    const multi = tracks != null;
    const trackList: Track[] = multi
      ? tracks
      : [{ id: "__single", name: "", segments: segments ?? [] }];
    const active = clamp(activeTrackIndex ?? 0, 0, Math.max(0, trackList.length - 1));

    const D =
      duration ||
      metaDuration ||
      trackList.reduce(
        (m, t) => Math.max(m, t.segments.reduce((mm, s) => Math.max(mm, s.end || 0), 0)),
        0
      ) ||
      0;

    // Normalized view of the ACTIVE track's segments — the contiguous invariant
    // is enforced here so rendering and edits share one source of truth.
    const activeSegments = trackList[active]?.segments ?? [];
    const segs = useMemo(() => normalizeSegments(activeSegments, D), [activeSegments, D]);
    const sel = clamp(selectedIndex, 0, Math.max(0, segs.length - 1));
    const curSeg: Segment | null = segs[sel] || null;

    // ---- timeline zoom (horizontal magnification) --------------------------
    // Continuous zoom in [MIN_ZOOM, MAX_ZOOM]; the transport's ZoomControl drives
    // it (drag the value to scale, ± to step). The recenter effects below keep
    // the playhead pinned as the value changes.
    const setZoomClamped = useCallback(
      (z: number) => setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z))),
      []
    );

    // Scroll the widened timeline so time `t` sits at the horizontal center.
    // Out-of-range scrollLeft is clamped by the browser (flush at the edges).
    const recenter = useCallback(
      (t: number) => {
        const sc = scrollRef.current;
        if (!sc || !D) return;
        sc.scrollLeft = (t / D) * sc.scrollWidth - sc.clientWidth / 2;
      },
      [D]
    );

    // On zoom change: recenter on the playhead. At 1× reset the scroll to the
    // start. rAF so the new canvas width is laid out before we measure scrollWidth.
    useEffect(() => {
      if (zoom <= 1) {
        if (scrollRef.current) scrollRef.current.scrollLeft = 0;
        return;
      }
      const raf = requestAnimationFrame(() => recenter(currentTime));
      return () => cancelAnimationFrame(raf);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [zoom]);

    // Paused selection change while zoomed → recenter on the playhead (selecting
    // seeks it to the segment's start). During playback the timeupdate handler
    // follows the playhead instead.
    useEffect(() => {
      if (zoom <= 1 || playing) return;
      recenter(currentTime);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sel]);

    // Route a structural edit of the active track back to the host in the shape
    // the current mode expects.
    const commitSegs = useCallback(
      (next: Segment[]) => {
        if (multi) onTracksChange?.(trackList.map((t, i) => (i === active ? { ...t, segments: next } : t)));
        else onSegmentsChange?.(next);
      },
      [multi, onTracksChange, onSegmentsChange, trackList, active]
    );

    const setActiveTrack = useCallback(
      (i: number) => onActiveTrackChange?.(clamp(i, 0, trackList.length - 1)),
      [onActiveTrackChange, trackList.length]
    );

    const addTrack = useCallback(() => {
      if (onAddTrack) return onAddTrack();
      const uid =
        typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `t${trackList.length}`;
      const next: Track = {
        id: uid,
        name: `Track ${trackList.length + 1}`,
        segments: [{ start: 0, end: D, description: "", verified: false }],
      };
      onTracksChange?.([...trackList, next]);
      onActiveTrackChange?.(trackList.length);
    }, [onAddTrack, onTracksChange, onActiveTrackChange, trackList, D]);

    const removeTrack = useCallback(
      (i: number) => {
        if (onRemoveTrack) return onRemoveTrack(i);
        if (trackList.length <= 1) return;
        onTracksChange?.(trackList.filter((_, idx) => idx !== i));
        if (active >= i) onActiveTrackChange?.(Math.max(0, active - (active === i ? 0 : 1)));
      },
      [onRemoveTrack, onTracksChange, onActiveTrackChange, trackList, active]
    );

    const renameTrack = useCallback(
      (i: number, name: string) => {
        if (onRenameTrack) return onRenameTrack(i, name);
        onTracksChange?.(trackList.map((t, idx) => (idx === i ? { ...t, name } : t)));
      },
      [onRenameTrack, onTracksChange, trackList]
    );

    const showToast = useCallback((msg: string) => {
      setToast(msg);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(""), 1600);
    }, []);

    const playSafe = useCallback(() => {
      const v = videoRef.current;
      if (!v) return;
      // If playback has reached the end, restart from the beginning rather than
      // no-op'ing at the final frame.
      const end = v.duration && isFinite(v.duration) ? v.duration : D;
      if (v.ended || (end > 0 && v.currentTime >= end - 0.05)) {
        v.currentTime = 0;
        setCurrentTime(0);
      }
      const pr = v.play();
      if (pr && pr.catch) pr.catch(() => {});
    }, [D]);

    const stepFrame = useCallback(
      (dir: number, big?: boolean) => {
        const v = videoRef.current;
        if (!v) return;
        v.pause();
        // Step by FRAME INDEX and seek to the frame CENTER, not the n/fps
        // boundary: n/fps*fps often lands a hair below n, so the decoder shows
        // frame n-1 while the clock reads n — which makes a ←/→ step move the
        // frame-indexed hand-pose overlay while the picture stays put. +0.5
        // guarantees the decoder paints `next`. `cs` shifts by the stream's
        // content start so N maps to the right absolute media time. `cur` uses
        // floor (the frame interval the playhead sits in) so a prior center-seek
        // doesn't round up a frame.
        const fps = srcFps || extractFps || 30;
        const cs = Number.isFinite(contentStartRef.current)
          ? contentStartRef.current
          : v.buffered.length
            ? v.buffered.start(0)
            : 0;
        const stepN = big ? Math.max(1, Math.round(fps)) : 1;
        const cur = Math.floor((v.currentTime - cs) * fps + 1e-6);
        const maxFrame = Math.max(0, Math.round(D * fps) - 1);
        const next = clamp(cur + dir * stepN, 0, maxFrame);
        v.currentTime = cs + (next + 0.5) / fps;
      },
      [D, extractFps, srcFps]
    );

    const gotoBoundary = useCallback(
      (dir: number) => {
        const v = videoRef.current;
        if (!v) return;
        const bounds = boundaryTimes(segs, D);
        const now = v.currentTime;
        let target = dir > 0 ? D : 0;
        if (dir > 0) {
          for (const b of bounds) if (b > now + 1e-3) { target = b; break; }
        } else {
          for (let k = bounds.length - 1; k >= 0; k--) if (bounds[k] < now - 1e-3) { target = bounds[k]; break; }
        }
        v.currentTime = clamp(target, 0, D);
      },
      [segs, D]
    );

    // Manual selection: select segment `i` in the active track AND seek to its
    // start. Used by j/k, the prev/next-segment buttons and the imperative
    // `goToSegment`. Does NOT auto-play — it preserves the current play/pause
    // state (seeking while playing continues playback; while paused it stays
    // paused). Distinct from the playback-driven selection sync in
    // `onTimeUpdate`, which must NOT seek.
    const goSeg = useCallback(
      (i: number) => {
        const next = clamp(i, 0, segs.length - 1);
        const p = segs[next];
        onSelectedChange(next);
        if (p && videoRef.current) {
          videoRef.current.currentTime = p.start;
          setCurrentTime(p.start);
        }
      },
      [segs, onSelectedChange]
    );

    const doSplit = useCallback(() => {
      const res = splitAt(segs, videoRef.current?.currentTime ?? currentTime, D);
      if ("error" in res) { showToast(res.error); return; }
      commitSegs(res.segments);
      onSelectedChange(res.selected);
    }, [segs, currentTime, D, commitSegs, onSelectedChange, showToast]);

    const doMerge = useCallback(
      (i: number) => {
        const res = mergeInto(segs, i);
        if (!res) return;
        commitSegs(res.segments);
        onSelectedChange(res.selected);
      },
      [segs, commitSegs, onSelectedChange]
    );

    const approveToggle = useCallback(() => {
      if (!curSeg) return;
      const nextVerified = !curSeg.verified;
      onApproveToggle?.(sel, nextVerified);
      if (nextVerified) {
        const nxt = segs.findIndex((s, idx) => idx > sel && !s.verified);
        if (nxt >= 0) goSeg(nxt);
        else showToast("All phases in this video verified ✓");
      }
    }, [curSeg, sel, segs, onApproveToggle, goSeg, showToast]);

    const togglePlay = useCallback(() => {
      const v = videoRef.current;
      if (!v) return;
      v.paused ? playSafe() : v.pause();
    }, [playSafe]);

    const setSpeed = useCallback((val: number) => {
      if (videoRef.current) videoRef.current.playbackRate = val;
      setRate(val);
    }, []);

    // ---- custom seek bar (native-styled progress control) ------------------
    // Track how much is buffered so the seek bar can draw the lighter buffered
    // fill (the range covering the playhead, else the largest end).
    const updateBuffered = useCallback(() => {
      const v = videoRef.current;
      if (!v) return;
      const b = v.buffered;
      let end = 0;
      for (let i = 0; i < b.length; i++) {
        if (v.currentTime >= b.start(i) - 0.25 && v.currentTime <= b.end(i) + 0.25) {
          end = b.end(i);
          break;
        }
        end = Math.max(end, b.end(i));
      }
      setBuffered(end);
    }, []);

    // Click / drag anywhere on the bar to seek. `setPointerCapture` isn't used —
    // a document listener keeps the drag alive even past the bar's edges.
    const onSeekDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        const v = videoRef.current;
        if (!v || !D) return;
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const seek = (clientX: number) => {
          const t = clamp((clientX - rect.left) / rect.width, 0, 1) * D;
          v.currentTime = t;
          setCurrentTime(t);
          // Switch the selected segment immediately — don't wait for the video's
          // `timeupdate` (which is delayed while the seeked frame buffers).
          const idx = segmentIndexAtTime(segs, t);
          if (idx !== sel) onSelectedChange(idx);
        };
        seek(e.clientX);
        const onMove = (ev: PointerEvent) => seek(ev.clientX);
        const onUp = () => {
          document.removeEventListener("pointermove", onMove);
          document.removeEventListener("pointerup", onUp);
        };
        document.addEventListener("pointermove", onMove);
        document.addEventListener("pointerup", onUp);
      },
      [D, segs, sel, onSelectedChange]
    );

    // ---- video element events ---------------------------------------------
    const onLoadedMetadata = useCallback(() => {
      const v = videoRef.current;
      if (!v) return;
      const md = v.duration || 0;
      setMetaDuration(md);
      // If duration was previously unknown, pin the active track's ends now.
      if (!duration && md) {
        const norm = normalizeSegments(activeSegments, md);
        if (JSON.stringify(norm) !== JSON.stringify(activeSegments)) commitSegs(norm);
      }
    }, [duration, activeSegments, commitSegs]);

    const onTimeUpdate = useCallback(() => {
      const v = videoRef.current;
      if (!v) return;
      setCurrentTime(v.currentTime);
      // Continuous playback: while actually playing, keep the selection synced
      // to the segment under the playhead — WITHOUT seeking — so playback
      // crosses boundaries and runs straight through to the end (no loop).
      if (!v.paused) {
        const idx = segmentIndexAtTime(segs, v.currentTime);
        if (idx !== sel) onSelectedChange(idx);
        // When zoomed, follow the playhead with a dead-zone (only re-center once
        // it nears the visible edges) so the scroll doesn't jitter every tick.
        const sc = scrollRef.current;
        if (sc && zoom > 1 && D) {
          const px = (v.currentTime / D) * sc.scrollWidth;
          if (px < sc.scrollLeft + 40 || px > sc.scrollLeft + sc.clientWidth - 80) {
            sc.scrollLeft = px - sc.clientWidth / 2;
          }
        }
      }
    }, [segs, sel, onSelectedChange, zoom, D]);

    // ---- timeline drag (boundary) + scrub / click-select ------------------
    const startBoundaryDrag = useCallback(
      (e: React.MouseEvent, i: number) => {
        e.preventDefault();
        e.stopPropagation();
        const tl = (e.currentTarget as HTMLElement).closest(".va-timeline") as HTMLElement | null;
        if (!tl) return;
        const rect = tl.getBoundingClientRect();
        let latest = segs;
        const onMove = (ev: MouseEvent) => {
          const frac = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
          latest = moveBoundary(latest, i, frac * D);
          commitSegs(latest);
        };
        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      },
      [segs, D, commitSegs]
    );

    const startScrub = useCallback(
      (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).classList.contains("va-handle")) return;
        const v = videoRef.current;
        const tl = e.currentTarget as HTMLElement; // .va-timeline
        if (!v || !tl || !D) return;
        e.preventDefault();
        const rect = tl.getBoundingClientRect();
        const downX = e.clientX;
        const segEl = (e.target as HTMLElement).closest(".va-seg") as HTMLElement | null;
        const onSegment = !!segEl;
        let moved = false;
        const seek = (x: number) => {
          const frac = clamp((x - rect.left) / rect.width, 0, 1);
          v.currentTime = frac * D;
        };
        // Empty ruler (not on a segment): behave like a plain scrubber — seek
        // immediately on press. Seeking does NOT change play/pause state (a
        // click while playing keeps playing from the new position). On a segment
        // we defer to mouseup so a pure click can apply the select-vs-scrub
        // rules without a first jump.
        if (!onSegment) {
          seek(downX);
        }
        const onMove = (ev: MouseEvent) => {
          if (Math.abs(ev.clientX - downX) > 3) moved = true;
          if (moved) {
            seek(ev.clientX);
          }
        };
        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          if (moved) {
            setCurrentTime(v.currentTime);
            // Selection follows the scrub: highlight the segment now under the
            // playhead (same sync as continuous playback, but for manual scrub).
            const idx = segmentIndexAtTime(segs, v.currentTime);
            if (idx !== sel) onSelectedChange(idx);
            return; // was a scrub/drag, not a click
          }
          if (onSegment && segEl) {
            // Resolve the click to (track, segment) using the row it landed in,
            // so the index is relative to that track's own segments.
            const row = segEl.closest(".va-track") as HTMLElement | null;
            const i = row ? [...row.querySelectorAll(".va-seg")].indexOf(segEl) : -1;
            const ti = row ? Number(row.dataset.track) : active;
            if (i >= 0) {
              const sameSeg = (!multi || ti === active) && i === sel;
              if (sameSeg) {
                // Bug 3: click within the already-selected segment → seek to the
                // exact click position (do not jump back to the start).
                seek(downX);
                setCurrentTime(v.currentTime);
              } else {
                // Click a different segment → select it + seek to its start.
                // No auto-play: preserve the current play/pause state.
                if (multi && !Number.isNaN(ti) && ti !== active) setActiveTrack(ti);
                const tsegs = ti === active ? segs : normalizeSegments(trackList[ti]?.segments ?? [], D);
                const p = tsegs[i];
                onSelectedChange(i);
                if (p) {
                  v.currentTime = p.start;
                  setCurrentTime(p.start);
                }
              }
            }
          } else {
            // Plain click on the empty ruler: the seek already happened on
            // press — now move the selection to the segment under the playhead.
            setCurrentTime(v.currentTime);
            const idx = segmentIndexAtTime(segs, v.currentTime);
            if (idx !== sel) onSelectedChange(idx);
          }
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      },
      [D, onSelectedChange, multi, active, sel, segs, trackList, setActiveTrack]
    );

    // ---- imperative handle -------------------------------------------------
    useImperativeHandle(
      ref,
      () => ({
        split: doSplit,
        merge: () => doMerge(sel),
        stepFrame,
        gotoBoundary,
        goToSegment: goSeg,
        play: playSafe,
        pause: () => videoRef.current?.pause(),
        toggleApprove: approveToggle,
        video: videoRef.current,
      }),
      [doSplit, doMerge, sel, stepFrame, gotoBoundary, goSeg, playSafe, approveToggle]
    );

    // ---- effects: keyboard + hand-pose overlay -----------------------------
    useAnnotatorKeyboard(enableKeyboard, {
      togglePlay,
      stepFrame,
      gotoBoundary,
      doSplit,
      approveToggle,
      goSeg,
      doMerge,
      sel,
    });

    const handposeReady = Boolean(handpose && handpose.frames && handpose.frames.length);
    // Show the toggle if data is present OR the host says it's available (loading
    // in the background). While on but not yet loaded, the button spins.
    const hasHandpose = handposeReady || handposeAvailable;
    const handsLoading = showHands && handposeLoading && !handposeReady;
    useHandposeOverlay({ enabled: showHands, playing, handpose, videoRef, canvasRef: overlayRef, stageRef });

    // Authoritative displayed-frame tracker. rVFC fires per PRESENTED frame
    // (playback, and once after a paused seek/step lands) and NOT while the
    // picture is stalled — so `currentFrame` follows the picture, freezing with
    // it during cold-start buffering instead of racing ahead like the clock. It
    // also captures the stream's content start (min buffered.start) into the ref
    // shared with frame-stepping. setState only on change → no-op while idle.
    useEffect(() => {
      const v = videoRef.current;
      if (!v || typeof v.requestVideoFrameCallback !== "function") return;
      const fps = srcFps || extractFps || 30;
      let handle = v.requestVideoFrameCallback(function loop(_now, meta) {
        if (v.buffered.length)
          contentStartRef.current = Math.min(contentStartRef.current, v.buffered.start(0));
        const cs = Number.isFinite(contentStartRef.current) ? contentStartRef.current : 0;
        const f = frameAtMediaTime(meta.mediaTime, cs, fps);
        setCurrentFrame((prev) => (prev === f ? prev : f));
        handle = v.requestVideoFrameCallback(loop);
      });
      return () => v.cancelVideoFrameCallback?.(handle);
    }, [srcFps, extractFps]);

    // ---- derived readout ---------------------------------------------------
    // Frame readout uses srcFps → extractFps → 30, so its frame number matches
    // the granularity of ←/→ frame-stepping instead of silently assuming 30.
    const fps = srcFps || extractFps || 30;
    // Read out the frame the decoder is actually PRESENTING (currentFrame, from
    // the rVFC loop) — not the media clock, which runs ahead of the picture
    // during cold-start buffering. Fall back to the clock where rVFC is absent
    // (floor + content-start shift so a center-seek reads back the right frame).
    // Time is derived FROM that frame so the two never disagree; both clamp to D.
    const rcs = Number.isFinite(contentStartRef.current) ? contentStartRef.current : 0;
    const maxFrame = D > 0 ? Math.max(0, Math.round(D * fps) - 1) : Number.POSITIVE_INFINITY;
    const shownFrame = Math.min(
      HAS_RVFC ? currentFrame : Math.max(0, Math.floor((currentTime - rcs) * fps + 1e-6)),
      maxFrame
    );
    const shownTime = D > 0 ? Math.min(shownFrame / fps, D) : shownFrame / fps;
    const readout = `${fmt(shownTime)} / ${fmt(D)} · f${shownFrame}`;

    const hasHeader = Boolean(videoTitle || videoSubtitle || headerLeading);

    return (
      <div className={cn("va-root", className)}>
        {hasHeader && (
          <div className="va-head">
            {headerLeading}
            {videoTitle && <span className="va-head-title">{videoTitle}</span>}
            {videoSubtitle && <span className="va-head-sub">{videoSubtitle}</span>}
          </div>
        )}
        <div className="va-stage" ref={stageRef}>
          <video
            ref={videoRef}
            className="va-video"
            playsInline
            preload="metadata"
            src={attachMedia ? undefined : videoUrl || undefined}
            // Click the video frame to toggle play/pause (like a normal player).
            onClick={togglePlay}
            style={videoUrl ? { cursor: "pointer" } : undefined}
            onLoadedMetadata={onLoadedMetadata}
            onTimeUpdate={onTimeUpdate}
            onProgress={updateBuffered}
            onSeeked={() => {
              setCurrentTime(videoRef.current?.currentTime ?? 0);
              hideBuffering();
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => {
              // Reflect the end in the UI (show the Play glyph, drop the buffering
              // spinner) — some browsers don't fire `pause` on end.
              setPlaying(false);
              hideBuffering();
            }}
            onLoadStart={showBuffering}
            onWaiting={showBuffering}
            onSeeking={showBuffering}
            onStalled={showBuffering}
            onCanPlay={hideBuffering}
            onPlaying={hideBuffering}
            onLoadedData={hideBuffering}
            // Keep the custom speed readout in sync when playbackRate changes
            // elsewhere — e.g. the native controls' playback-rate menu.
            onRateChange={() => setRate(videoRef.current?.playbackRate ?? 1)}
          />
          {/* Hand-pose overlay: positioned/sized over the video by the rAF loop. */}
          <canvas ref={overlayRef} className="va-overlay" aria-hidden="true" />
          {/* Host overlay (e.g. a 3D picture-in-picture) — layered above the video
              + hand-pose but below the seek bar (which follows in DOM at z-index 4). */}
          {stageOverlay}
          {buffering && (
            <div className="va-buffering" aria-hidden="true">
              <div className="va-buf">
                <div className="va-bufring" />
                <div className="va-buflabel">Loading<b> ···</b></div>
              </div>
            </div>
          )}
          {!videoUrl && !attachMedia && <div className="va-stage-msg">(no video url provided)</div>}
        </div>

        {/* Shared scrub bar — a slim static progress rail BELOW the video stage
            (progress only; the transport holds the controls). Always visible. */}
        {showSeekBar && D > 0 && (
          <div className="va-seek" onPointerDown={onSeekDown}>
            <div className="va-seek-track">
              <div className="va-seek-buf" style={{ width: `${clamp(buffered / D, 0, 1) * 100}%` }} />
              <div className="va-seek-fill" style={{ width: `${clamp(currentTime / D, 0, 1) * 100}%` }} />
            </div>
            <div className="va-seek-thumb" style={{ left: `${clamp(currentTime / D, 0, 1) * 100}%` }} />
          </div>
        )}

        <Transport
          readout={readout}
          rate={rate}
          speeds={speeds}
          onSpeed={setSpeed}
          playing={playing}
          togglePlay={togglePlay}
          stepFrame={stepFrame}
          goSeg={goSeg}
          sel={sel}
          segCount={segs.length}
          doSplit={doSplit}
          doMerge={doMerge}
          hasHandpose={hasHandpose}
          showHands={showHands}
          handsLoading={handsLoading}
          onToggleHands={() => setShowHands((s) => !s)}
          transportExtra={transportExtra}
        />

        <div className={cn("va-tlwrap", multi && "multi")}>
          {/* Zoom capsule floats at the top-center of the timeline (over the
              ruler), matching the viz episode-timeline ZoomBar placement. */}
          <div className="va-zoomfloat">
            <ZoomControl zoom={zoom} minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM} onZoom={setZoomClamped} />
          </div>
          {multi && (
            <TrackHeads
              tracks={trackList}
              active={active}
              onActivate={setActiveTrack}
              onRename={renameTrack}
              onRemove={removeTrack}
            />
          )}
          {/* Horizontal-scroll viewport; the Timeline canvas widens to zoom*100%. */}
          <div className="va-tlscroll" ref={scrollRef}>
            <Timeline
              trackList={trackList}
              active={active}
              activeSegs={segs}
              sel={sel}
              D={D}
              zoom={zoom}
              multi={multi}
              allowAddTracks={allowAddTracks}
              currentTime={currentTime}
              onScrubDown={startScrub}
              onBoundaryDown={startBoundaryDrag}
              onAddTrack={addTrack}
            />
          </div>
        </div>

        {showDescription && (
          <DescriptionBox segment={curSeg} index={sel} extractFps={extractFps} onChange={onDescriptionChange} />
        )}

        {toast && <div className="va-toast">{toast}</div>}
      </div>
    );
  }
);
