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
import { Transport } from "./Transport";
import { Timeline } from "./Timeline";
import { TrackHeads } from "./TrackHeads";
import { DescriptionBox } from "./DescriptionBox";

const DEFAULT_SPEEDS = [0.25, 0.5, 1, 1.5, 2];

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
      videoTitle,
      videoSubtitle,
      headerLeading,
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
      handpose,
      defaultShowHandpose = false,
      className,
    }: VideoAnnotatorProps,
    ref
  ) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);

    const [currentTime, setCurrentTime] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [rate, setRate] = useState(1);
    const [metaDuration, setMetaDuration] = useState(0);
    // Hand-pose overlay: OFF by default (a "Hands" toggle in the transport
    // flips it). Only relevant when `handpose` data is supplied.
    const [showHands, setShowHands] = useState(defaultShowHandpose);
    const [toast, setToast] = useState("");
    const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useAnnotatorStyles();

    // Keep the toggle in sync if the host later flips `defaultShowHandpose`
    // (the initial useState only captures the first value).
    useEffect(() => {
      setShowHands(defaultShowHandpose);
    }, [defaultShowHandpose]);

    // Clear the toast timer on unmount so it can't setState after teardown.
    useEffect(() => () => clearTimeout(toastTimer.current), []);

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
      const pr = videoRef.current?.play();
      if (pr && pr.catch) pr.catch(() => {});
    }, []);

    const stepFrame = useCallback(
      (dir: number, big?: boolean) => {
        const v = videoRef.current;
        if (!v) return;
        v.pause();
        const dt = big ? 1.0 : extractFps ? 1 / extractFps : 1 / 30;
        v.currentTime = clamp(v.currentTime + dir * dt, 0, D);
      },
      [D, extractFps]
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
      }
    }, [segs, sel, onSelectedChange]);

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
        // Empty ruler (not on a segment): behave like a plain scrubber — pause
        // and seek immediately on press. On a segment we defer to mouseup so a
        // pure click can apply the select-vs-scrub rules without a first jump.
        if (!onSegment) {
          v.pause();
          seek(downX);
        }
        const onMove = (ev: MouseEvent) => {
          if (Math.abs(ev.clientX - downX) > 3) moved = true;
          if (moved) {
            v.pause();
            seek(ev.clientX);
          }
        };
        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          if (moved) {
            setCurrentTime(v.currentTime);
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
            setCurrentTime(v.currentTime);
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

    const hasHandpose = Boolean(handpose && handpose.frames && handpose.frames.length);
    useHandposeOverlay({ enabled: showHands, playing, handpose, videoRef, canvasRef: overlayRef, stageRef });

    // ---- derived readout ---------------------------------------------------
    // Frame readout uses srcFps → extractFps → 30, so its frame number matches
    // the granularity of ←/→ frame-stepping instead of silently assuming 30.
    const fps = srcFps || extractFps || 30;
    const readout = `${fmt(currentTime)} / ${fmt(D)} · f${Math.round(currentTime * fps)}`;

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
            src={videoUrl || undefined}
            onLoadedMetadata={onLoadedMetadata}
            onTimeUpdate={onTimeUpdate}
            onSeeked={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          {/* Hand-pose overlay: positioned/sized over the video by the rAF loop. */}
          <canvas ref={overlayRef} className="va-overlay" aria-hidden="true" />
          {!videoUrl && <div className="va-stage-msg">(no video url provided)</div>}
        </div>

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
          onToggleHands={() => setShowHands((s) => !s)}
        />

        <div className={cn("va-tlwrap", multi && "multi")}>
          {multi && (
            <TrackHeads
              tracks={trackList}
              active={active}
              onActivate={setActiveTrack}
              onRename={renameTrack}
              onRemove={removeTrack}
            />
          )}
          <Timeline
            trackList={trackList}
            active={active}
            activeSegs={segs}
            sel={sel}
            D={D}
            multi={multi}
            allowAddTracks={allowAddTracks}
            currentTime={currentTime}
            onScrubDown={startScrub}
            onBoundaryDown={startBoundaryDrag}
            onMerge={doMerge}
            onAddTrack={addTrack}
          />
        </div>

        {showDescription && (
          <DescriptionBox segment={curSeg} index={sel} extractFps={extractFps} onChange={onDescriptionChange} />
        )}

        {toast && <div className="va-toast">{toast}</div>}
      </div>
    );
  }
);
