import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Segment, Track } from "./types";
import { clamp, fmt, normalizeSegments } from "./segments";
import { computeVaTicks, cullMinorLabels, formatMajorLabel, formatMinorLabel } from "./ruler-ticks";

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

  // Three-tier ruler (major / minor / micro), ported from the shared
  // episode-timeline DLDetailRuler so it matches the design 1:1. The major step
  // is picked so ~8 land in the VISIBLE window (`D/zoom`); minor + micro
  // subdivide it. Ticks span the full [0,D] at `t/D` (the canvas is the one
  // that's widened); finer tiers drop out past a cap so a long clip at high zoom
  // can't flood the DOM. Memoized on [D, zoom].
  // The ruler redraws the VISIBLE window (like the design's DLDetailRuler)
  // instead of laying the whole widened clip — so dense micro ticks show at ANY
  // zoom. Track the scroll viewport (`.va-tlscroll`, this timeline's parent) for
  // the window, plus the widened strip's pixel width (minor-label culling).
  // scroll/resize are coalesced into one rAF-batched measure.
  const [wrapW, setWrapW] = useState(0);
  const [vis, setVis] = useState({ start: 0, end: 0 });
  useEffect(() => {
    const el = timelineRef.current;
    const sc = el?.parentElement;
    if (!el) return;
    let raf = 0;
    const compute = () => {
      const fullW = el.getBoundingClientRect().width || 1;
      setWrapW(fullW);
      if (sc) {
        const span = D && zoom ? D / zoom : D;
        const pad = span * 0.25;
        setVis({
          start: (sc.scrollLeft / fullW) * D - pad,
          end: ((sc.scrollLeft + sc.clientWidth) / fullW) * D + pad,
        });
      } else {
        setVis({ start: 0, end: D });
      }
    };
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    compute();
    sc?.addEventListener("scroll", update, { passive: true });
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(el);
      if (sc) ro.observe(sc);
    }
    return () => {
      cancelAnimationFrame(raf);
      sc?.removeEventListener("scroll", update);
      ro?.disconnect();
    };
  }, [D, zoom]);

  const { major, minor, ticks } = useMemo(
    () => computeVaTicks(D, zoom, vis.start, vis.end),
    [D, zoom, vis.start, vis.end],
  );
  const keepMinor = useMemo(
    () => cullMinorLabels(ticks, major, minor, D, wrapW),
    [ticks, major, minor, D, wrapW],
  );

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
        {ticks.map((rt, i) => {
          const label =
            rt.tier === "major"
              ? formatMajorLabel(rt.t, major)
              : rt.tier === "minor" && keepMinor.has(i)
                ? formatMinorLabel(rt.t, major, minor)
                : "";
          return (
            <div
              key={rt.t}
              className={cn(
                "va-tick",
                `va-tick--${rt.tier}`,
                i === 0 && "start",
                i === ticks.length - 1 && "end",
              )}
              style={{ left: `${(rt.t / (D || 1)) * 100}%` }}
            >
              <span className="va-tickmark" />
              {label && (
                <span className={cn("va-ticklabel", `va-ticklabel--${rt.tier}`)}>{label}</span>
              )}
            </div>
          );
        })}
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
