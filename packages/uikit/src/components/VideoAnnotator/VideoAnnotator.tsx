import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Scissors,
  SkipBack,
  SkipForward,
  ArrowLeftToLine,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "../Tooltip";
import type { Segment, VideoAnnotatorHandle, VideoAnnotatorProps } from "./types";
import {
  boundaryTimes,
  clamp,
  firstUnverified,
  fmt,
  mergeInto,
  moveBoundary,
  normalizeSegments,
  splitAt,
} from "./segments";

const DEFAULT_SPEEDS = [0.25, 0.5, 1, 1.5, 2];
const STYLE_ID = "uikit-video-annotator-styles";

/** Transport icon button with a portaled tooltip (uikit Tooltip → escapes any
 *  container overflow, unlike the old CSS `::after` tip which got clipped by a
 *  scrolling/split layout). The label doubles as the a11y name. */
function TipButton({
  label,
  onClick,
  className,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className={className} aria-label={label} onClick={onClick} disabled={disabled}>
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent className="!bg-uikit-panel !text-uikit-ink border border-uikit-faint">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * VideoAnnotator — a video player with an editable, contiguous segment
 * timeline. Ported from the phase-review labeling template: transport
 * (frame-step, boundary jump, play/pause, speed), a percentage-positioned
 * timeline strip with drag-to-move boundaries + click-to-scrub, and the
 * split / merge / boundary-move invariants. Controlled on `segments` +
 * `selectedIndex`; emits new arrays via `onSegmentsChange`.
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
      loop = true,
      speeds = DEFAULT_SPEEDS,
      enableKeyboard = true,
      className,
    }: VideoAnnotatorProps,
    ref
  ) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);

    const [currentTime, setCurrentTime] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [rate, setRate] = useState(1);
    const [speedOpen, setSpeedOpen] = useState(false);
    const [metaDuration, setMetaDuration] = useState(0);
    const [hoverFrac, setHoverFrac] = useState<number | null>(null);
    // Viewport position of the hover-time bubble, so it can be portaled to <body>
    // and never clipped by a scrolling/split parent's overflow.
    const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
    // Merge affordance: the X button appears over an internal boundary (a cut
    // between two phases) after the cursor lingers ~0.5s near that boundary.
    // `mergeReady` gates the reveal; `mergeIdx` is the segment index whose start
    // is the boundary (doMerge(i) merges phases i-1 and i). A ref mirrors the
    // near-boundary so the mousemove handler only resets the timer on change.
    const [mergeReady, setMergeReady] = useState(false);
    const [mergeIdx, setMergeIdx] = useState<number | null>(null);
    const mergeIdxRef = useRef<number | null>(null);
    const delTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const [toast, setToast] = useState("");
    const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Inject the component's scoped stylesheet once. Kept as an injected
    // <style> (rather than a Tailwind class soup) because the timeline relies
    // on :has(), ::before, color-mix(), and dynamic percentage positioning
    // that don't map to utility classes.
    useEffect(() => {
      if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
      const el = document.createElement("style");
      el.id = STYLE_ID;
      el.textContent = CSS;
      document.head.appendChild(el);
    }, []);

    const D = duration || metaDuration || segments.reduce((m, s) => Math.max(m, s.end || 0), 0) || 0;

    // Normalized view of the controlled segments — the contiguous invariant is
    // enforced here so rendering and edits share one source of truth.
    const segs = useMemo(() => normalizeSegments(segments, D), [segments, D]);
    const sel = clamp(selectedIndex, 0, Math.max(0, segs.length - 1));
    const curSeg: Segment | null = segs[sel] || null;

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

    const goSeg = useCallback(
      (i: number) => {
        const next = clamp(i, 0, segs.length - 1);
        const p = segs[next];
        onSelectedChange(next);
        if (p && videoRef.current) {
          videoRef.current.currentTime = p.start;
          playSafe();
        }
      },
      [segs, onSelectedChange, playSafe]
    );

    const doSplit = useCallback(() => {
      const res = splitAt(segs, videoRef.current?.currentTime ?? currentTime, D);
      if ("error" in res) { showToast(res.error); return; }
      onSegmentsChange(res.segments);
      onSelectedChange(res.selected);
    }, [segs, currentTime, D, onSegmentsChange, onSelectedChange, showToast]);

    const doMerge = useCallback(
      (i: number) => {
        const res = mergeInto(segs, i);
        if (!res) return;
        onSegmentsChange(res.segments);
        onSelectedChange(res.selected);
      },
      [segs, onSegmentsChange, onSelectedChange]
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
      setSpeedOpen(false);
    }, []);

    // ---- imperative handle -------------------------------------------------
    useImperativeHandle(
      ref,
      () => ({
        split: doSplit,
        merge: () => doMerge(sel),
        stepFrame,
        gotoBoundary,
        play: playSafe,
        pause: () => videoRef.current?.pause(),
        toggleApprove: approveToggle,
        video: videoRef.current,
      }),
      [doSplit, doMerge, sel, stepFrame, gotoBoundary, playSafe, approveToggle]
    );

    // ---- video element events ---------------------------------------------
    const onLoadedMetadata = useCallback(() => {
      const v = videoRef.current;
      if (!v) return;
      const md = v.duration || 0;
      setMetaDuration(md);
      // If duration was previously unknown, pin segment ends against it now.
      if (!duration && md) {
        const norm = normalizeSegments(segments, md);
        if (JSON.stringify(norm) !== JSON.stringify(segments)) onSegmentsChange(norm);
      }
    }, [duration, segments, onSegmentsChange]);

    const onTimeUpdate = useCallback(() => {
      const v = videoRef.current;
      if (!v) return;
      // Loop only during actual playback — never while paused/scrubbing.
      if (loop && !v.paused && curSeg && v.currentTime >= curSeg.end - 0.03) v.currentTime = curSeg.start;
      setCurrentTime(v.currentTime);
    }, [loop, curSeg]);

    // ---- timeline drag (boundary) + scrub ---------------------------------
    const startBoundaryDrag = useCallback(
      (e: React.MouseEvent, i: number) => {
        e.preventDefault();
        e.stopPropagation();
        const tl = timelineRef.current;
        if (!tl) return;
        const rect = tl.getBoundingClientRect();
        let latest = segs;
        const onMove = (ev: MouseEvent) => {
          const frac = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
          latest = moveBoundary(latest, i, frac * D);
          onSegmentsChange(latest);
        };
        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      },
      [segs, D, onSegmentsChange]
    );

    const startScrub = useCallback(
      (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).classList.contains("va-handle")) return;
        const v = videoRef.current;
        const tl = timelineRef.current;
        if (!v || !tl || !D) return;
        e.preventDefault();
        v.pause();
        const rect = tl.getBoundingClientRect();
        const downX = e.clientX;
        const segEl = (e.target as HTMLElement).closest(".va-seg") as HTMLElement | null;
        let moved = false;
        const seek = (x: number) => {
          const frac = clamp((x - rect.left) / rect.width, 0, 1);
          v.currentTime = frac * D;
        };
        seek(downX);
        const onMove = (ev: MouseEvent) => {
          if (Math.abs(ev.clientX - downX) > 3) moved = true;
          seek(ev.clientX);
        };
        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          if (!moved && segEl && tl) {
            const i = [...tl.querySelectorAll(".va-seg")].indexOf(segEl);
            if (i >= 0) onSelectedChange(i);
          }
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      },
      [D, onSelectedChange]
    );

    // ---- keyboard ----------------------------------------------------------
    useEffect(() => {
      if (!enableKeyboard || typeof document === "undefined") return;
      const onKey = (e: KeyboardEvent) => {
        const tag = (document.activeElement as HTMLElement | null)?.tagName || "";
        const typing = /^(TEXTAREA|INPUT|SELECT)$/.test(tag);
        if (typing) {
          if (e.key === "Escape") (document.activeElement as HTMLElement).blur();
          return;
        }
        switch (e.key) {
          case " ":
            e.preventDefault();
            togglePlay();
            break;
          case "ArrowLeft":
            e.preventDefault();
            if (e.shiftKey) stepFrame(-1, true);
            else if (e.altKey) gotoBoundary(-1);
            else stepFrame(-1, false);
            break;
          case "ArrowRight":
            e.preventDefault();
            if (e.shiftKey) stepFrame(1, true);
            else if (e.altKey) gotoBoundary(1);
            else stepFrame(1, false);
            break;
          case ",":
            gotoBoundary(-1);
            break;
          case ".":
            gotoBoundary(1);
            break;
          case "s":
          case "S":
            doSplit();
            break;
          case "a":
          case "A":
            approveToggle();
            break;
          case "j":
            goSeg(sel + 1);
            break;
          case "k":
            goSeg(sel - 1);
            break;
          case "Backspace":
            e.preventDefault();
            doMerge(sel);
            break;
        }
      };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }, [enableKeyboard, togglePlay, stepFrame, gotoBoundary, doSplit, approveToggle, goSeg, doMerge, sel]);

    // ---- derived readout ---------------------------------------------------
    const fps = srcFps || 30;
    const readout = `${fmt(currentTime)} / ${fmt(D)} · f${Math.round(currentTime * fps)}`;
    // Graduated ruler: a coarse "major" step (labeled `Ns`, bold, tall mark)
    // subdivided into 5 finer "minor" ticks. Picks the smallest nice major so
    // there are at most ~6 labels across the track.
    const MAJORS = [5, 10, 15, 30, 60, 120, 300, 600];
    const majorStep = D ? MAJORS.find((m) => D / m <= 6) ?? MAJORS[MAJORS.length - 1] : 0;
    const minorStep = majorStep / 5;
    const ticks: { t: number; major: boolean }[] = [];
    if (D && minorStep)
      for (let t = 0; t <= D + 1e-6; t += minorStep) {
        const tt = Math.min(t, D);
        ticks.push({ t: tt, major: Math.abs(tt % majorStep) < 1e-6 });
      }

    const hasHeader = Boolean(videoTitle || videoSubtitle || headerLeading);
    const descWords = curSeg ? (curSeg.description || "").trim().split(/\s+/).filter(Boolean).length : 0;
    const descRange = curSeg
      ? `phase ${sel + 1} · ${fmt(curSeg.start)}–${fmt(curSeg.end)}` +
        (extractFps
          ? ` · frames ${Math.round(curSeg.start * extractFps) + 1}–${Math.round(curSeg.end * extractFps) + 1}`
          : "")
      : "";

    return (
      <div className={cn("va-root", className)}>
        {hasHeader && (
          <div className="va-head">
            {headerLeading}
            {videoTitle && <span className="va-head-title">{videoTitle}</span>}
            {videoSubtitle && <span className="va-head-sub">{videoSubtitle}</span>}
          </div>
        )}
        <div className="va-stage">
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
          {!videoUrl && <div className="va-stage-msg">(no video url provided)</div>}
        </div>

        <div className="va-transport">
          <div className="va-tp-left">
            <span className="va-readout">{readout}</span>
            <div className={cn("va-speedsel", speedOpen && "open")}>
              <button
                type="button"
                className="va-speedbtn"
                aria-label="Playback speed"
                aria-haspopup="listbox"
                aria-expanded={speedOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  setSpeedOpen((o) => !o);
                }}
              >
                <span>{rate}×</span>
                <ChevronDown size={12} className="va-caret" />
              </button>
              {speedOpen && (
                <div className="va-speedmenu" role="listbox">
                  {speeds.map((v) => (
                    <button
                      key={v}
                      type="button"
                      role="option"
                      aria-selected={v === rate}
                      onClick={() => setSpeed(v)}
                    >
                      {v === rate && <Check size={12} className="va-speedcheck" />}
                      {v}×
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="va-tp-center">
            <TipButton className="va-icon" label="Prev boundary (,)" onClick={() => gotoBoundary(-1)}>
              <SkipBack size={14} />
            </TipButton>
            <TipButton className="va-icon" label="Prev frame (←)" onClick={() => stepFrame(-1, false)}>
              <ChevronLeft size={14} />
            </TipButton>
            <TipButton className="va-icon va-play" label="Play/Pause (Space)" onClick={togglePlay}>
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </TipButton>
            <TipButton className="va-icon" label="Next frame (→)" onClick={() => stepFrame(1, false)}>
              <ChevronRight size={14} />
            </TipButton>
            <TipButton className="va-icon" label="Next boundary (.)" onClick={() => gotoBoundary(1)}>
              <SkipForward size={14} />
            </TipButton>
          </div>

          <div className="va-tp-right">
            <TipButton className="va-icon" label="Split at playhead (S)" onClick={doSplit}>
              <Scissors size={14} />
            </TipButton>
            <TipButton
              className="va-icon"
              label="Merge into previous (Backspace)"
              onClick={() => doMerge(sel)}
              disabled={sel <= 0}
            >
              <ArrowLeftToLine size={14} />
            </TipButton>
          </div>
        </div>

        <div
          className="va-timeline"
          ref={timelineRef}
          onMouseDown={startScrub}
          onMouseMove={(e) => {
            const tl = timelineRef.current;
            if (!tl) return;
            const rect = tl.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const frac = clamp(px / rect.width, 0, 1);
            setHoverFrac(frac);
            setHoverPos({ x: rect.left + frac * rect.width, y: rect.top });
            // Keep the button while the cursor is actually over it (or its tail),
            // so moving up to click never recomputes/hides it. Otherwise it must
            // disappear as soon as the cursor leaves a boundary's vicinity.
            if ((e.target as HTMLElement).closest(".va-merge")) return;
            // Nearest internal boundary within 14px of the cursor (so the button,
            // centred on the boundary, stays reachable straight up from here).
            let near: number | null = null;
            let best = 14;
            for (let i = 1; i < segs.length; i++) {
              const d = Math.abs(px - (segs[i].start / (D || 1)) * rect.width);
              if (d < best) { best = d; near = i; }
            }
            if (near !== mergeIdxRef.current) {
              mergeIdxRef.current = near;
              setMergeIdx(near);
              setMergeReady(false);
              clearTimeout(delTimer.current);
              if (near != null) delTimer.current = setTimeout(() => setMergeReady(true), 500);
            }
          }}
          onMouseLeave={() => {
            setHoverFrac(null);
            setHoverPos(null);
            clearTimeout(delTimer.current);
            mergeIdxRef.current = null;
            setMergeIdx(null);
            setMergeReady(false);
          }}
        >
          {segs.map((p, i) => (
            <div
              key={i}
              className={cn("va-seg", i === sel && "sel")}
              style={{ left: `${(p.start / (D || 1)) * 100}%`, width: `${((p.end - p.start) / (D || 1)) * 100}%` }}
            >
              <span className="va-seglabel">
                {i + 1}
                {p.description ? " · " + p.description : ""}
              </span>
            </div>
          ))}
          {segs.map((p, i) =>
            i > 0 ? (
              <div
                key={`h${i}`}
                className="va-handle"
                style={{ left: `${(p.start / (D || 1)) * 100}%` }}
                title="Drag to move · double-click to merge"
                onMouseDown={(e) => startBoundaryDrag(e, i)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  doMerge(i);
                }}
              />
            ) : null
          )}
          <div className="va-ticks">
            {ticks.map((rt, i) => (
              <div
                key={i}
                className={cn("va-tick", rt.major && "major", i === 0 && "start", i === ticks.length - 1 && "end")}
                style={{ left: `${(rt.t / (D || 1)) * 100}%` }}
              >
                <span className="va-ticklabel">
                  {rt.major
                    ? `${Math.round(rt.t)}s`
                    : Math.round((rt.t % majorStep) / minorStep)}
                </span>
              </div>
            ))}
          </div>
          {hoverFrac != null && (
            <>
              <div className="va-hoverline" style={{ left: `${hoverFrac * 100}%` }} />
              {/* the time bubble is portaled to <body> (fixed-positioned) so it never gets
                  clipped by a scrolling/split parent's overflow */}
              {hoverPos != null &&
                typeof document !== "undefined" &&
                createPortal(
                  <div
                    className="va-hovertime va-hovertime--fixed"
                    style={{ position: "fixed", left: hoverPos.x, top: hoverPos.y + 12 }}
                  >
                    {fmt(hoverFrac * D)}
                  </div>,
                  document.body,
                )}
              {mergeReady && mergeIdx != null && (
                <button
                  className="va-merge"
                  style={{ left: `${(segs[mergeIdx].start / (D || 1)) * 100}%` }}
                  aria-label="Merge these two phases"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Hide the button before merging so it can never render
                    // against the post-merge (shorter) array and jump right.
                    const idx = mergeIdx;
                    mergeIdxRef.current = null;
                    setMergeIdx(null);
                    setMergeReady(false);
                    doMerge(idx);
                  }}
                >
                  <X />
                </button>
              )}
            </>
          )}
          {segs.length > 0 && currentTime > 0.001 && (
            <div className="va-playhead" style={{ left: `${(clamp(currentTime, 0, D) / (D || 1)) * 100}%` }} />
          )}
        </div>

        {showDescription && (
          <div className="va-desc">
            <textarea
              className="va-desc-box"
              placeholder="Phase description — edit to match the clip"
              value={curSeg?.description ?? ""}
              onChange={(e) => onDescriptionChange?.(sel, e.target.value)}
            />
            <div className="va-desc-meta">
              <span>{descWords} words</span>
              <span>{descRange}</span>
            </div>
          </div>
        )}

        {toast && <div className="va-toast">{toast}</div>}
      </div>
    );
  }
);

/* Scoped stylesheet. Local `--va-*` vars alias the uikit design tokens (with
   the reference template's hex values as standalone fallbacks) so the widget
   looks identical to the original AND follows uikit light/dark theming. */
const CSS = `
.va-root{
  --va-bg: var(--bg, #fffefb);
  --va-panel: var(--panel-bg, #fcfbf7);
  --va-panel2: var(--search-bg, #f3f1ea);
  --va-field: var(--panel-bg, #fefefa);
  --va-line: var(--faint, rgba(0,0,0,.08));
  --va-text: var(--ink, #1a1a1a);
  --va-muted: var(--uikit-muted, #6b6b6b);
  --va-accent: var(--uikit-accent, #23aaff);
  --va-good: var(--tone-green, #1f8f4a);
  --va-warn: var(--tone-amber, #c0922e);
  --va-danger: var(--tone-red, #c8513b);
  --va-idle: var(--tone-warm-gray, #9c907a);
  --va-selected: var(--selected-bg, #f5f3ee);
  --va-radius: var(--radius, 10px);
  /* Popover/tooltip drop shadow. Aliases the kit's theme-aware shadow token
     so it stays dark in dark mode — not a white glow off the light ink. */
  --va-shadow: var(--shadow-tint-2, rgba(0,0,0,.1));
  --va-hover: color-mix(in srgb, var(--va-text) 5%, var(--va-panel));
  /* Own stacking context so the timeline/tooltip/menu z-indexes (up to 60) stay
     contained and can't paint over a host's sticky header when scrolled. */
  isolation:isolate;
  display:flex; flex-direction:column; gap:12px; min-width:0; min-height:0; height:100%;
  color:var(--va-text);
  font:14px/1.45 var(--f-ui, "Inter Tight", ui-sans-serif, system-ui, -apple-system, sans-serif);
}
.va-root button{font:inherit;color:var(--va-text);background:transparent;border:1px solid transparent;
  border-radius:8px;padding:6px 10px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.va-root button:hover{background:var(--va-panel2)}
.va-root button:active{transform:translateY(1px)}
.va-root button:disabled{opacity:.35;cursor:default}
.va-root button:disabled:hover{background:transparent}

.va-head{display:flex;align-items:center;gap:10px;flex:none;min-height:28px}
.va-head-title{font-size:16px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.va-head-sub{font:12px var(--f-mono, ui-monospace, Menlo, monospace);color:var(--va-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.va-stage{position:relative;flex:1;min-height:0;background:#000;border-radius:var(--va-radius);
  overflow:hidden;display:flex;align-items:center;justify-content:center}
.va-video{max-width:100%;max-height:100%;background:#000}
.va-stage-msg{position:absolute;color:var(--va-muted);font-size:13px;text-align:center;padding:20px}

/* 3-column grid with equal side tracks keeps the playback cluster on the true
   horizontal center — aligned with the centered video above — regardless of
   how wide the readout/speed (left) vs split/extract (right) groups are. */
.va-transport{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);
  align-items:center;gap:20px;flex:none;margin-top:-2px}
.va-tp-left,.va-tp-right{display:flex;align-items:center;gap:6px;min-width:0}
.va-tp-right{justify-content:flex-end}
.va-tp-center{display:flex;align-items:center;gap:6px;flex:none}
.va-transport button{height:28px}
/* Transport controls read as real buttons: resting panel fill + hairline,
   not bare icons. Scoped under .va-transport so they beat the base
   .va-root button transparent-background rule. */
.va-transport .va-icon{width:28px;height:28px;padding:0;justify-content:center;
  background:transparent;border:1px solid var(--va-line);
  color:color-mix(in srgb, var(--va-text) 75%, var(--va-muted))}
/* Neutral outline + glyph at rest; both turn accent-blue on hover. */
.va-transport .va-icon:hover{background:transparent;border-color:var(--va-accent);color:var(--va-accent)}
.va-icon svg{flex:none}

/* Hover tooltip — matches the component's own floating surfaces (speed menu,
   toast): panel fill, 1px hairline border, ink text, soft popover shadow.
   Reads the button's aria-label so the a11y name and the visible tip stay in
   sync. */
/* Transport button tooltips are now the portaled uikit <Tooltip> (see TipButton),
   which escapes any container overflow — the old CSS ::after tip was clipped by a
   scrolling/split parent. */
.va-readout{font:11px var(--f-mono, ui-monospace, Menlo, monospace);color:var(--va-muted);
  padding:6px 0;text-align:left;flex:none;width:162px;white-space:nowrap}
.va-speedsel{position:relative;display:inline-flex}
.va-speedsel .va-speedbtn{display:inline-flex;align-items:center;gap:3px;height:28px;padding:0 6px 0 9px;
  background:var(--va-panel);color:var(--va-text);border:1px solid transparent;border-radius:8px;cursor:pointer;
  font:11px var(--f-mono, ui-monospace, Menlo, monospace)}
.va-speedbtn .va-caret{color:var(--va-muted)}
.va-speedbtn:hover{background:var(--va-panel2)}
/* No press-shift on the speed button — the base button:active translate reads
   as jitter here next to the readout. */
.va-speedsel .va-speedbtn:active{transform:none}
.va-speedsel.open .va-speedbtn{border-color:var(--va-accent)}
.va-speedmenu{position:absolute;bottom:calc(100% + 6px);left:0;z-index:40;min-width:calc(100% + 8px);
  background:var(--va-panel);border:1px solid var(--va-line);border-radius:10px;
  box-shadow:0 8px 24px var(--va-shadow);padding:4px}
.va-speedmenu button{width:100%;display:flex;align-items:center;gap:6px;white-space:nowrap;height:auto;
  background:transparent;border:none;border-radius:6px;padding:5px 12px 5px 22px;
  font:11px var(--f-mono, ui-monospace, Menlo, monospace);color:var(--va-text);text-align:left;position:relative}
.va-speedmenu button:hover{background:var(--va-panel2)}
.va-speedmenu button[aria-selected="true"]{color:var(--va-accent)}
.va-speedcheck{position:absolute;left:6px}

.va-timeline{position:relative;height:62px;background:transparent;cursor:pointer;user-select:none;flex:none;margin-top:-2px}
.va-timeline:not(:has(.va-seg))::before{content:"";position:absolute;top:30px;bottom:0;left:0;right:0;
  border-radius:6px;background:color-mix(in srgb, var(--va-text) 4%, transparent);box-shadow:inset 0 0 0 1px var(--va-line)}
.va-seg{position:absolute;top:30px;bottom:0;border-radius:6px;display:flex;align-items:center;
  padding:0 9px;overflow:hidden;background:var(--va-panel2);box-shadow:inset 0 0 0 1px var(--va-line)}
.va-seg:hover{background:#edf6fc;box-shadow:inset 0 0 0 1px var(--va-line)}
.va-seg.sel{background:#edf6fc;box-shadow:inset 0 0 0 1.5px #23a9ff;z-index:3}
.va-seg.sel .va-seglabel{color:#1a1a1a}
/* Dark mode swaps the blue selection/hover accent for yellow. The fill is a
   translucent amber tint so the dark surface reads through it; the label
   flips to light ink to stay legible over that dark-tinted fill. */
html[data-theme="dark"] .va-seg:hover{background:rgba(243,230,204,.14)}
html[data-theme="dark"] .va-seg.sel{background:rgba(243,230,204,.2);box-shadow:inset 0 0 0 1.5px var(--va-warn)}
html[data-theme="dark"] .va-seg:hover .va-seglabel,
html[data-theme="dark"] .va-seg.sel .va-seglabel{color:var(--va-text)}
.va-seglabel{font-size:11px;color:var(--va-muted);font-weight:400;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
.va-seg:hover .va-seglabel{color:#1a1a1a}
.va-handle{position:absolute;top:30px;bottom:0;width:9px;margin-left:-5px;cursor:ew-resize;z-index:5}
.va-handle::after{content:"";position:absolute;left:4px;top:0;bottom:0;width:1.5px;background:var(--va-accent);opacity:0}
.va-handle:hover::after{opacity:1}
.va-playhead{position:absolute;top:14px;bottom:0;width:1.5px;background:var(--va-accent);pointer-events:none;z-index:6}
.va-hoverline{position:absolute;top:14px;bottom:0;width:1.5px;
  background:color-mix(in srgb, var(--va-accent) 50%, transparent);pointer-events:none;z-index:5}
.va-hovertime{position:absolute;top:12px;transform:translateX(4px);
  background:var(--va-accent);color:#fff;
  padding:2px 6px;border-radius:4px;white-space:nowrap;pointer-events:none;z-index:7;
  font-family:var(--f-mono, ui-monospace, Menlo, monospace);font-size:11px;line-height:1.3;
  box-shadow:0 8px 24px var(--va-shadow)}
/* Portaled variant (rendered on <body>, outside .va-root) — the va-scoped vars
   don't resolve there, so use the global uikit tokens with hard fallbacks. */
.va-hovertime--fixed{
  background:var(--uikit-accent, #23aaff);color:#fff;z-index:1000;
  box-shadow:0 8px 24px rgba(0,0,0,.18)}
/* Timeline hover: a blue speech bubble sitting over an internal boundary (a cut
   between two phases) holding an X that merges those two phases. It's a child of
   the timeline and its tail bridges down into the boundary, so moving the cursor
   up to click never trips the timeline's mouseleave. Scoped under .va-timeline
   to beat the base .va-root button reset. */
@keyframes va-merge-in{from{opacity:0;transform:translateX(-50%) translateY(4px) scale(.92)}
  to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
.va-timeline .va-merge{position:absolute;bottom:100%;transform:translateX(-50%);z-index:8;
  width:30px;height:24px;display:inline-flex;align-items:center;justify-content:center;padding:0;
  background:var(--va-accent);color:#fff;border:0;border-radius:8px;cursor:pointer;
  box-shadow:0 4px 12px var(--va-shadow);animation:va-merge-in .18s ease-out}
.va-timeline .va-merge::after{content:"";position:absolute;top:100%;left:50%;transform:translateX(-50%);
  width:0;height:0;border:5px solid transparent;border-top-color:var(--va-accent)}
/* Keep the centring transform on press — the base button:active rule would
   otherwise replace it with translateY() alone and shove the button right. */
.va-timeline .va-merge:active{transform:translateX(-50%) translateY(1px)}
.va-timeline .va-merge:hover{background:color-mix(in srgb,#000 14%,var(--va-accent))}
.va-timeline .va-merge:hover::after{border-top-color:color-mix(in srgb,#000 14%,var(--va-accent))}
.va-timeline .va-merge svg{width:14px;height:14px}
.va-ticks{position:absolute;left:0;right:0;top:0;height:24px;pointer-events:none;z-index:4}
.va-ticks::before{content:"";position:absolute;left:0;right:0;top:22px;height:1px;background:var(--va-line)}
.va-tick{position:absolute;top:0;height:24px;pointer-events:none}
.va-tick::before{content:"";position:absolute;top:17px;left:0;width:1px;height:5px;background:var(--va-line)}
.va-tick.major::before{top:14px;height:8px;background:var(--va-muted)}
.va-ticklabel{position:absolute;top:1px;left:0;transform:translateX(-50%);white-space:nowrap;
  font:11px var(--f-mono, ui-monospace, Menlo, monospace);color:var(--va-muted);line-height:1}
.va-tick.major .va-ticklabel{font-weight:600;color:color-mix(in srgb, var(--va-text) 55%, var(--va-muted))}
.va-tick.start .va-ticklabel{transform:translateX(0)}
.va-tick.end .va-ticklabel{left:auto;right:0;transform:translateX(0)}

/* Description + meta framed as one card; the textarea is borderless inside it
   so there's a single frame, and the meta row sits in the same box (separated
   by whitespace, no divider). Focus lifts the whole frame's border. */
.va-desc{display:flex;flex-direction:column;gap:8px;flex:none;
  background:var(--va-field);border:1px solid var(--va-line);border-radius:8px;padding:9px}
.va-desc:focus-within{border-color:var(--va-accent)}
.va-desc-box{width:100%;min-height:60px;resize:vertical;background:transparent;color:var(--va-text);
  border:0;padding:0;font:13px/1.45 inherit}
.va-desc-box:focus{outline:none}
.va-desc-meta{display:flex;gap:12px;color:var(--va-muted);
  font:11px var(--f-mono, ui-monospace, Menlo, monospace)}
.va-desc-meta > span:first-child{width:72px;flex:none}

.va-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:var(--va-panel);
  border:1px solid var(--va-line);border-radius:8px;padding:8px 14px;color:var(--va-text);
  box-shadow:0 8px 24px var(--va-shadow);z-index:50}
`;
