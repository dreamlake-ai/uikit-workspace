import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Segment, Track } from "./types";
import { clamp, fmt, normalizeSegments } from "./segments";

const MAJORS = [5, 10, 15, 30, 60, 120, 300, 600];

/**
 * The timeline strip: stacked track lanes over a graduated ruler, drag handles
 * on the active lane, a portaled hover-time bubble, and the playhead.
 * Presentational for edits — scrub / boundary-drag are delegated to the host —
 * but owns its own hover state, which is purely a timeline concern.
 */
export function Timeline({
  trackList,
  active,
  activeSegs,
  sel,
  D,
  zoom,
  multi,
  allowAddTracks,
  currentTime,
  onScrubDown,
  onBoundaryDown,
  onAddTrack,
}: {
  trackList: Track[];
  active: number;
  activeSegs: Segment[];
  sel: number;
  D: number;
  /** Horizontal magnification (1/2/4/8/16). The canvas is widened to
   *  `zoom*100%` inside a scrolling parent; all position math stays `t/D`. */
  zoom: number;
  multi: boolean;
  allowAddTracks: boolean;
  currentTime: number;
  onScrubDown: (e: React.MouseEvent) => void;
  onBoundaryDown: (e: React.MouseEvent, i: number) => void;
  onAddTrack: () => void;
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoverFrac, setHoverFrac] = useState<number | null>(null);
  // Viewport position of the hover-time bubble, so it can be portaled to <body>
  // and never clipped by a scrolling/split parent's overflow.
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Graduated ruler: a coarse "major" step (labeled `Ns`, bold, tall mark)
  // subdivided into 5 finer "minor" ticks. The major is picked so there are at
  // most ~6 labels across the VISIBLE window (`D/zoom`), so zooming in shows a
  // finer ruler. Ticks still span the full [0,D] at `t/D` positions (the canvas
  // is the one that's widened). Memoized on [D, zoom]. A guard drops the minor
  // ticks past ~300 total so a long clip at 16× can't flood the DOM.
  const { majorStep, minorStep, ticks } = useMemo(() => {
    const visible = D && zoom ? D / zoom : D;
    const major = visible ? MAJORS.find((m) => visible / m <= 6) ?? MAJORS[MAJORS.length - 1] : 0;
    const minorsFit = major ? (D / (major / 5)) <= 300 : false;
    const step = major ? (minorsFit ? major / 5 : major) : 0;
    const out: { t: number; major: boolean }[] = [];
    if (D && step)
      for (let t = 0; t <= D + 1e-6; t += step) {
        const tt = Math.min(t, D);
        out.push({ t: tt, major: Math.abs(tt % major) < 1e-6 });
      }
    return { majorStep: major, minorStep: major / 5, ticks: out };
  }, [D, zoom]);

  // Normalized segments per track. The active track reuses the already-normalized
  // `activeSegs`; inactive tracks are normalized here — memoized so hover
  // re-renders don't re-run normalizeSegments for every inactive lane.
  const normTracks = useMemo(
    () => trackList.map((tr, ti) => (ti === active ? activeSegs : normalizeSegments(tr.segments, D))),
    [trackList, active, activeSegs, D],
  );

  return (
    <div
      className="va-timeline"
      ref={timelineRef}
      style={{ width: `${zoom * 100}%` }}
      onMouseDown={onScrubDown}
      onMouseMove={(e) => {
        const tl = timelineRef.current;
        if (!tl) return;
        const rect = tl.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const frac = clamp(px / rect.width, 0, 1);
        setHoverFrac(frac);
        setHoverPos({ x: rect.left + frac * rect.width, y: rect.top });
      }}
      onMouseLeave={() => {
        setHoverFrac(null);
        setHoverPos(null);
      }}
    >
      <div className="va-tracks">
        {trackList.map((tr, ti) => {
          const isActive = ti === active;
          const tsegs = normTracks[ti];
          return (
            <div key={tr.id || ti} className={cn("va-track", !isActive && "inactive")} data-track={ti}>
              {tsegs.map((p, i) => (
                <div
                  key={p.id ?? i}
                  className={cn("va-seg", isActive && i === sel && "sel", p.edited && "edited", p.resegmented && "reseg")}
                  style={{ left: `${(p.start / (D || 1)) * 100}%`, width: `${((p.end - p.start) / (D || 1)) * 100}%` }}
                >
                  <span className="va-seglabel">
                    {i + 1}
                    {p.description ? " · " + p.description : ""}
                  </span>
                </div>
              ))}
              {isActive &&
                tsegs.map((p, i) =>
                  i > 0 ? (
                    <div
                      key={`h${p.id ?? i}`}
                      className="va-handle"
                      style={{ left: `${(p.start / (D || 1)) * 100}%` }}
                      title="Drag to move"
                      onMouseDown={(e) => onBoundaryDown(e, i)}
                    />
                  ) : null
                )}
            </div>
          );
        })}
        {multi && allowAddTracks && (
          <div
            className="va-addrow"
            role="button"
            aria-label="Add track"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onAddTrack();
            }}
          >
            <span className="va-addrow-line" />
            <span className="va-addrow-btn">
              <Plus />
            </span>
          </div>
        )}
      </div>
      <div className="va-ticks">
        {ticks.map((rt, i) => (
          <div
            key={i}
            className={cn("va-tick", rt.major && "major", i === 0 && "start", i === ticks.length - 1 && "end")}
            style={{ left: `${(rt.t / (D || 1)) * 100}%` }}
          >
            <span className="va-ticklabel">
              {rt.major ? `${Math.round(rt.t)}s` : Math.round((rt.t % majorStep) / minorStep)}
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
              document.body
            )}
        </>
      )}
      {activeSegs.length > 0 && currentTime > 0.001 && (
        <div className="va-playhead" style={{ left: `${(clamp(currentTime, 0, D) / (D || 1)) * 100}%` }} />
      )}
    </div>
  );
}
