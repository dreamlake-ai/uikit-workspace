import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Scissors,
  SkipBack,
  SkipForward,
  ArrowLeftToLine,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { Segment, VideoAnnotatorHandle, VideoAnnotatorProps } from "./types";
import {
  boundaryTimes,
  clamp,
  firstUnverified,
  fmt,
  fmtShort,
  mergeInto,
  moveBoundary,
  normalizeSegments,
  splitAt,
  tickStep,
} from "./segments";

const DEFAULT_SPEEDS = [0.25, 0.5, 1, 1.5, 2];
const STYLE_ID = "uikit-video-annotator-styles";

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
    const step = D ? tickStep(D) : 0;
    const ticks: number[] = [];
    if (step) for (let s = 0; s <= D + 1e-6; s += step) ticks.push(Math.min(s, D));

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
                title="Playback speed"
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
                      {v}×
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="va-tp-center">
            <button className="va-icon" title="Prev boundary (,)" onClick={() => gotoBoundary(-1)}>
              <SkipBack size={18} />
            </button>
            <button className="va-icon" title="Prev frame (←)" onClick={() => stepFrame(-1, false)}>
              <ChevronLeft size={18} />
            </button>
            <button className="va-icon va-play" title="Play/Pause (Space)" onClick={togglePlay}>
              {playing ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button className="va-icon" title="Next frame (→)" onClick={() => stepFrame(1, false)}>
              <ChevronRight size={18} />
            </button>
            <button className="va-icon" title="Next boundary (.)" onClick={() => gotoBoundary(1)}>
              <SkipForward size={18} />
            </button>
          </div>

          <div className="va-tp-right">
            <button title="Split at playhead (S)" onClick={doSplit}>
              <Scissors size={14} /> Split
            </button>
            <button title="Merge into previous (Backspace)" onClick={() => doMerge(sel)} disabled={sel <= 0}>
              <ArrowLeftToLine size={14} /> Merge
            </button>
          </div>
        </div>

        <div className="va-timeline" ref={timelineRef} onMouseDown={startScrub}>
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
            {ticks.map((s, i) => (
              <div key={i} className="va-tick" style={{ left: `${(s / (D || 1)) * 100}%` }}>
                {fmtShort(s)}
              </div>
            ))}
          </div>
          {segs.length > 0 && (
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
  --va-hover: color-mix(in srgb, var(--va-text) 5%, var(--va-panel));
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

.va-transport{display:flex;align-items:center;gap:8px;flex:none}
.va-tp-left,.va-tp-right{flex:1 1 0;display:flex;align-items:center;gap:6px;min-width:0}
.va-tp-right{justify-content:flex-end}
.va-tp-center{display:flex;align-items:center;gap:4px;flex:none}
.va-transport button{height:34px}
.va-icon{width:34px;height:34px;padding:0;justify-content:center;color:var(--va-text)}
.va-play{width:40px;height:40px;background:var(--va-panel2)}
.va-play:hover{background:color-mix(in srgb, var(--va-accent) 16%, var(--va-panel2))}
.va-readout{font:12px var(--f-mono, ui-monospace, Menlo, monospace);color:var(--va-text);
  background:var(--va-panel);border:1px solid var(--va-line);border-radius:8px;
  padding:6px 10px;min-width:150px;text-align:center;flex:none}
.va-speedsel{position:relative;display:inline-flex}
.va-speedbtn{display:inline-flex;align-items:center;gap:3px;height:28px;padding:0 6px 0 9px;
  background:var(--va-panel);color:var(--va-text);border:1px solid transparent;border-radius:8px;cursor:pointer;font-size:12px}
.va-speedbtn .va-caret{color:var(--va-muted)}
.va-speedbtn:hover{background:var(--va-panel2)}
.va-speedsel.open .va-speedbtn{border-color:var(--va-accent)}
.va-speedmenu{position:absolute;bottom:calc(100% + 6px);left:0;z-index:40;min-width:calc(100% + 8px);
  background:var(--va-panel);border:1px solid var(--va-line);border-radius:10px;
  box-shadow:0 8px 24px color-mix(in srgb,var(--va-text) 22%,transparent);padding:4px}
.va-speedmenu button{width:100%;display:flex;align-items:center;gap:6px;white-space:nowrap;height:auto;
  background:transparent;border:none;border-radius:6px;padding:5px 12px 5px 22px;font-size:12px;color:var(--va-text);text-align:left;position:relative}
.va-speedmenu button:hover{background:var(--va-panel2)}
.va-speedmenu button[aria-selected="true"]{color:var(--va-accent)}
.va-speedmenu button[aria-selected="true"]::before{content:"✓";position:absolute;left:8px}

.va-timeline{position:relative;height:56px;background:transparent;cursor:pointer;user-select:none;flex:none}
.va-timeline:not(:has(.va-seg))::before{content:"";position:absolute;top:3px;bottom:18px;left:0;right:0;
  border-radius:6px;background:color-mix(in srgb, var(--va-text) 4%, transparent);box-shadow:inset 0 0 0 1px var(--va-line)}
.va-seg{position:absolute;top:3px;bottom:18px;border-radius:6px;display:flex;align-items:center;
  padding:0 9px;overflow:hidden;background:var(--va-panel2);box-shadow:inset 0 0 0 1px var(--va-line)}
.va-seg:hover{background:color-mix(in srgb, var(--va-accent) 20%, var(--va-bg));box-shadow:inset 0 0 0 1.5px var(--va-accent)}
.va-seg.sel{background:color-mix(in srgb, var(--va-accent) 22%, var(--va-bg));box-shadow:inset 0 0 0 1.5px var(--va-accent);z-index:3}
.va-seglabel{font-size:11px;color:var(--va-text);font-weight:600;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
.va-handle{position:absolute;top:0;bottom:18px;width:9px;margin-left:-5px;cursor:ew-resize;z-index:5}
.va-handle::after{content:"";position:absolute;left:4px;top:0;bottom:0;width:1.5px;background:var(--va-accent);opacity:0}
.va-handle:hover::after{opacity:1}
.va-playhead{position:absolute;top:0;bottom:18px;width:1.5px;background:var(--va-accent);pointer-events:none;z-index:6}
.va-ticks{position:absolute;left:0;right:0;bottom:0;height:14px;pointer-events:none;z-index:4}
.va-tick{position:absolute;bottom:0;font:9px var(--f-mono, ui-monospace, Menlo, monospace);
  color:var(--va-muted);transform:translateX(3px);pointer-events:none}

.va-desc{display:flex;flex-direction:column;gap:4px;flex:none}
.va-desc-box{width:100%;min-height:60px;resize:vertical;background:var(--va-field);color:var(--va-text);
  border:1px solid var(--va-line);border-radius:8px;padding:9px;font:13px/1.45 inherit}
.va-desc-box:focus{outline:none;border-color:var(--va-accent)}
.va-desc-meta{display:flex;gap:12px;color:var(--va-muted);font-size:12px}

.va-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:var(--va-panel);
  border:1px solid var(--va-line);border-radius:8px;padding:8px 14px;color:var(--va-text);
  box-shadow:0 8px 24px color-mix(in srgb, var(--va-text) 18%, transparent);z-index:50}
`;
