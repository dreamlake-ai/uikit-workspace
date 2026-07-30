import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Segment, Track } from "./types";
import { clamp, fmt, normalizeSegments } from "./segments";

const MAJORS = [5, 10, 15, 30, 60, 120, 300, 600];

/**
 * The timeline strip: stacked track lanes over a graduated ruler, drag handles
 * on the active lane, a portaled hover-time bubble, the lingering merge (X)
 * affordance over internal boundaries, and the playhead. Presentational for
 * edits — scrub / boundary-drag / merge are delegated to the host — but owns
 * its own hover + merge-affordance state, which is purely a timeline concern.
 */
export function Timeline({
  trackList,
  active,
  activeSegs,
  sel,
  D,
  multi,
  allowAddTracks,
  currentTime,
  onScrubDown,
  onBoundaryDown,
  onMerge,
  onAddTrack,
}: {
  trackList: Track[];
  active: number;
  activeSegs: Segment[];
  sel: number;
  D: number;
  multi: boolean;
  allowAddTracks: boolean;
  currentTime: number;
  onScrubDown: (e: React.MouseEvent) => void;
  onBoundaryDown: (e: React.MouseEvent, i: number) => void;
  onMerge: (i: number) => void;
  onAddTrack: () => void;
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoverFrac, setHoverFrac] = useState<number | null>(null);
  // Viewport position of the hover-time bubble, so it can be portaled to <body>
  // and never clipped by a scrolling/split parent's overflow.
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  // Merge affordance: the X button appears over an internal boundary after the
  // cursor lingers ~0.5s near it. `mergeReady` gates the reveal; `mergeIdx` is
  // the segment index whose start is the boundary (onMerge(i) merges i-1 and i).
  const [mergeReady, setMergeReady] = useState(false);
  const [mergeIdx, setMergeIdx] = useState<number | null>(null);
  const mergeIdxRef = useRef<number | null>(null);
  const delTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Clear the linger timer if the timeline unmounts mid-hover.
  useEffect(() => () => clearTimeout(delTimer.current), []);

  // Graduated ruler: a coarse "major" step (labeled `Ns`, bold, tall mark)
  // subdivided into 5 finer "minor" ticks. Picks the smallest nice major so
  // there are at most ~6 labels across the track. Memoized on D so the
  // high-frequency hover re-renders (setHoverFrac on every mousemove) don't
  // rebuild the tick list.
  const { majorStep, minorStep, ticks } = useMemo(() => {
    const major = D ? MAJORS.find((m) => D / m <= 6) ?? MAJORS[MAJORS.length - 1] : 0;
    const minor = major / 5;
    const out: { t: number; major: boolean }[] = [];
    if (D && minor)
      for (let t = 0; t <= D + 1e-6; t += minor) {
        const tt = Math.min(t, D);
        out.push({ t: tt, major: Math.abs(tt % major) < 1e-6 });
      }
    return { majorStep: major, minorStep: minor, ticks: out };
  }, [D]);

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
      onMouseDown={onScrubDown}
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
        for (let i = 1; i < activeSegs.length; i++) {
          const d = Math.abs(px - (activeSegs[i].start / (D || 1)) * rect.width);
          if (d < best) {
            best = d;
            near = i;
          }
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
      <div className="va-tracks">
        {trackList.map((tr, ti) => {
          const isActive = ti === active;
          const tsegs = normTracks[ti];
          return (
            <div key={tr.id || ti} className={cn("va-track", !isActive && "inactive")} data-track={ti}>
              {tsegs.map((p, i) => (
                <div
                  key={p.id ?? i}
                  className={cn("va-seg", isActive && i === sel && "sel")}
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
                      title="Drag to move · double-click to merge"
                      onMouseDown={(e) => onBoundaryDown(e, i)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        onMerge(i);
                      }}
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
          {mergeReady && mergeIdx != null && activeSegs[mergeIdx] && (
            <button
              className="va-merge"
              style={{ left: `${(activeSegs[mergeIdx].start / (D || 1)) * 100}%` }}
              aria-label="Merge these two phases"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                // Hide the button before merging so it can never render against
                // the post-merge (shorter) array and jump right.
                const idx = mergeIdx;
                mergeIdxRef.current = null;
                setMergeIdx(null);
                setMergeReady(false);
                onMerge(idx);
              }}
            >
              <X />
            </button>
          )}
        </>
      )}
      {activeSegs.length > 0 && currentTime > 0.001 && (
        <div className="va-playhead" style={{ left: `${(clamp(currentTime, 0, D) / (D || 1)) * 100}%` }} />
      )}
    </div>
  );
}
