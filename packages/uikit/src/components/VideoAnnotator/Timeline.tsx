import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "../../lib/utils";
import { TimelineHover } from "./TimelineHover";
import type { Segment, Track } from "./types";
import { clamp, normalizeSegments, segmentIndexAtTime } from "./segments";
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
  selectedTracks,
  gutterPx,
  D,
  zoom,
  currentTime,
  allowAddTracks,
  editable = true,
  onScrubDown,
  onBoundaryDown,
  onAddTrack,
}: {
  trackList: Track[];
  active: number;
  activeSegs: Segment[];
  /** Which lane indices are selected (multi-select). Unselected lanes render
   *  with muted segment borders. */
  selectedTracks: number[];
  /** Left label-gutter width in px. The time axis maps t=0 to x=gutterPx, so the
   *  ruler runs negative to its left. 0 = no gutter (single-track). */
  gutterPx: number;
  D: number;
  /** Horizontal magnification (continuous, ≥1, unbounded). The canvas is widened
   *  to `zoom*100%` inside a scrolling parent; all position math stays `t/D`. */
  zoom: number;
  currentTime: number;
  /** Show the built-in "+ add track" row (host-configurable entry). */
  allowAddTracks: boolean;
  /** Render the active lane's boundary drag handles. False in view-only mode,
   *  where segments can be clicked / scrubbed but never resized. Default true. */
  editable?: boolean;
  onScrubDown: (e: React.MouseEvent) => void;
  onBoundaryDown: (e: React.MouseEvent, i: number) => void;
  onAddTrack: () => void;
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
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
      // Invert the fixed-px gutter: a canvas pixel x maps to time
      // ((x - gutterPx)/(fullW - gutterPx))*D, so at scrollLeft 0 the window
      // starts negative (the gutter's worth of time) and the ruler shows negative
      // graduations. This only bounds WHICH ticks are generated — exact positions
      // are CSS calc (posCss), so no wrapW fluctuation reaches the rendered x.
      const innerW = Math.max(1, fullW - gutterPx);
      const invX = (xPx: number) => ((xPx - gutterPx) / innerW) * D;
      if (sc) {
        const span = D && zoom ? D / zoom : D;
        const pad = span * 0.25;
        setVis({
          start: invX(sc.scrollLeft) - pad,
          end: invX(sc.scrollLeft + sc.clientWidth) + pad,
        });
      } else {
        setVis({ start: invX(0), end: D });
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
  }, [D, zoom, gutterPx]);

  // Fixed-pixel gutter: t=0 lands at x=gutterPx, t=D at the right edge, and the
  // ruler runs negative to the left. Positions are pure CSS calc against the
  // LIVE width — no JS measurement in the position, so it never jitters as the
  // strip zooms, and the seek math (VideoAnnotator, same fixed gutterPx) shares
  // this exact mapping so a click lands where it's drawn. gutterPx=0 (single
  // lane) reduces `calc(0px + f*(100% - 0px))` to `f*100%` — the old behaviour.
  const posCss = (t: number) => `calc(${gutterPx}px + ${t / (D || 1)} * (100% - ${gutterPx}px))`;
  const selSet = useMemo(() => new Set(selectedTracks), [selectedTracks]);

  const { major, minor, ticks } = useMemo(
    () => computeVaTicks(D, zoom, vis.start, vis.end),
    [D, zoom, vis.start, vis.end]
  );
  const keepMinor = useMemo(
    () => cullMinorLabels(ticks, major, minor, D, wrapW, gutterPx),
    [ticks, major, minor, D, wrapW, gutterPx]
  );

  // Normalized segments per track. The active track reuses the already-normalized
  // `activeSegs`; inactive tracks are normalized here — memoized so hover
  // re-renders don't re-run normalizeSegments for every inactive lane.
  const normTracks = useMemo(
    () => trackList.map((tr, ti) => (ti === active ? activeSegs : normalizeSegments(tr.segments, D))),
    [trackList, active, activeSegs, D]
  );

  return (
    <div className="va-timeline" ref={timelineRef} style={{ width: `${zoom * 100}%` }} onMouseDown={onScrubDown}>
      <div className="va-tracks">
        {trackList.map((tr, ti) => {
          const tsegs = normTracks[ti];
          // Include the segments crossing either viewport edge, plus one neighbor
          // for boundary handles. vis already includes a quarter-screen overscan.
          const first = Math.max(0, segmentIndexAtTime(tsegs, vis.start) - 1);
          const end = Math.min(tsegs.length, segmentIndexAtTime(tsegs, vis.end) + 2);
          return (
            <TimelineLane
              key={tr.id || ti}
              segments={tsegs}
              trackIndex={ti}
              active={ti === active}
              selected={selSet.has(ti)}
              currentIndex={segmentIndexAtTime(tsegs, currentTime)}
              first={first}
              end={end}
              D={D}
              gutterPx={gutterPx}
              editable={editable}
              onBoundaryDown={onBoundaryDown}
            />
          );
        })}
        {allowAddTracks && trackList.length >= 1 && (
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
              className={cn("va-tick", `va-tick--${rt.tier}`, i === 0 && "start", i === ticks.length - 1 && "end")}
              style={{ left: posCss(rt.t) }}
            >
              <span className="va-tickmark" />
              {label && <span className={cn("va-ticklabel", `va-ticklabel--${rt.tier}`)}>{label}</span>}
            </div>
          );
        })}
      </div>
      <TimelineHover
        timelineRef={timelineRef}
        tracks={normTracks}
        D={D}
        gutterPx={gutterPx}
        zoom={zoom}
        windowStart={vis.start}
        windowEnd={vis.end}
      />
      {activeSegs.length > 0 && currentTime >= 0 && (
        <div className="va-playhead" style={{ left: posCss(clamp(currentTime, 0, D)) }} />
      )}
    </div>
  );
}

// The heavy lane subtree only changes when its visible indices, data, or
// highlighted segment change. Zoom positions remain CSS percentages; pointer
// movement and playhead ticks within one segment never rebuild these nodes.
const TimelineLane = memo(function TimelineLane({
  segments,
  trackIndex,
  active,
  selected,
  currentIndex,
  first,
  end,
  D,
  gutterPx,
  editable,
  onBoundaryDown,
}: {
  segments: Segment[];
  trackIndex: number;
  active: boolean;
  selected: boolean;
  currentIndex: number;
  first: number;
  end: number;
  D: number;
  gutterPx: number;
  editable: boolean;
  onBoundaryDown: (e: React.MouseEvent, i: number) => void;
}) {
  const visible = segments.slice(first, end);
  const posCss = (t: number) => `calc(${gutterPx}px + ${t / (D || 1)} * (100% - ${gutterPx}px))`;
  const widCss = (dt: number) => `calc(${dt / (D || 1)} * (100% - ${gutterPx}px))`;
  return (
    <div className={cn("va-track", !selected && "va-unsel")} data-track={trackIndex}>
      {visible.map((p, offset) => {
        const i = first + offset;
        return (
          <div
            key={p.id ?? i}
            data-segment-index={i}
            className={cn(
              "va-seg",
              i === currentIndex && (active ? "sel" : "cur"),
              p.edited && "edited",
              p.resegmented && "reseg"
            )}
            style={{ left: posCss(p.start), width: widCss(p.end - p.start) }}
          >
            <div className="va-seg-line">
              <span className="va-seg-n">{i + 1}</span>
              {p.description && <span className="va-seglabel">{p.description}</span>}
            </div>
          </div>
        );
      })}
      {active &&
        editable &&
        visible.map((p, offset) => {
          const i = first + offset;
          return i > 0 ? (
            <div
              key={`h${p.id ?? i}`}
              className="va-handle"
              data-boundary-index={i}
              style={{ left: posCss(p.start) }}
              title="Drag to move"
              onMouseDown={(e) => onBoundaryDown(e, i)}
            />
          ) : null;
        })}
    </div>
  );
});
