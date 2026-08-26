import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Segment, Track } from "./types";
import { clamp, fmt, normalizeSegments, segmentIndexAtTime } from "./segments";
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
  onScrubDown: (e: React.MouseEvent) => void;
  onBoundaryDown: (e: React.MouseEvent, i: number) => void;
  onAddTrack: () => void;
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoverFrac, setHoverFrac] = useState<number | null>(null);
  // Viewport position of the hover-time bubble, so it can be portaled to <body>
  // and never clipped by a scrolling/split parent's overflow.
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  // Per-segment hover tooltip (design .lab-tip--wide): the segment number, its
  // caption, and — for edited segments — the pre-edit caption. Fixed-positioned
  // (portaled to <body>) so a scrolling lane never clips it.
  const [cellTip, setCellTip] = useState<
    { n: number; cap: string; was: string | null; left: number; bottom: number } | null
  >(null);

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
  const widCss = (dt: number) => `calc(${dt / (D || 1)} * (100% - ${gutterPx}px))`;
  // Hover fraction (of the full width) → time, inverting the same fixed-px gutter.
  // Display-only, so the measured wrapW here is fine (a pixel of slop is invisible).
  const hoverTime = (frac: number) => ((frac * wrapW - gutterPx) / Math.max(1, wrapW - gutterPx)) * D;
  const selSet = useMemo(() => new Set(selectedTracks), [selectedTracks]);

  const { major, minor, ticks } = useMemo(
    () => computeVaTicks(D, zoom, vis.start, vis.end),
    [D, zoom, vis.start, vis.end],
  );
  const keepMinor = useMemo(
    () => cullMinorLabels(ticks, major, minor, D, wrapW, gutterPx),
    [ticks, major, minor, D, wrapW, gutterPx],
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
          // Every lane highlights the segment under the PLAYHEAD, derived from
          // currentTime — so the highlight tracks a scrub / timeline-drag in real
          // time on ALL lanes, the active one included.
          //
          // The active lane used to read the host's `sel` instead. `sel` is
          // committed only on mouse-UP (a drag's per-move `onSelectedChange`
          // would fire the host's expensive review + auto-scroll side-effects and
          // wrongly mark every passed-over segment reviewed), so its highlight
          // lagged a drag until release while the other lanes moved live — the
          // "middle track looks stuck" report. Visual highlight and committed
          // selection are separate concerns: this is the visual one; `sel` still
          // drives selection + review, synced on release. In steady state the two
          // agree (every seek/select keeps the playhead in the selected segment),
          // so this only changes the transient-drag frames.
          // Selected lanes render it in full accent (.sel), unselected in a paler
          // accent (.cur).
          const curIdx = segmentIndexAtTime(tsegs, currentTime);
          return (
            <div key={tr.id || ti} className={cn("va-track", !selSet.has(ti) && "va-unsel")} data-track={ti}>
              {tsegs.map((p, i) => (
                <div
                  key={p.id ?? i}
                  className={cn(
                    "va-seg",
                    isActive && i === curIdx && "sel",
                    !isActive && i === curIdx && "cur",
                    p.edited && "edited",
                    p.resegmented && "reseg",
                  )}
                  style={{ left: posCss(p.start), width: widCss(p.end - p.start) }}
                  onMouseEnter={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setCellTip({
                      n: i + 1,
                      cap: p.description ?? "",
                      was: p.edited && p.original && p.original !== p.description ? p.original : null,
                      left: r.left + r.width / 2,
                      bottom: window.innerHeight - r.top + 8,
                    });
                  }}
                  onMouseLeave={() => setCellTip(null)}
                >
                  <div className="va-seg-line">
                    <span className="va-seg-n">{i + 1}</span>
                    {p.description && <span className="va-seglabel">{p.description}</span>}
                  </div>
                </div>
              ))}
              {isActive &&
                tsegs.map((p, i) =>
                  i > 0 ? (
                    <div
                      key={`h${p.id ?? i}`}
                      className="va-handle"
                      style={{ left: posCss(p.start) }}
                      title="Drag to move"
                      onMouseDown={(e) => onBoundaryDown(e, i)}
                    />
                  ) : null
                )}
            </div>
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
              className={cn(
                "va-tick",
                `va-tick--${rt.tier}`,
                i === 0 && "start",
                i === ticks.length - 1 && "end",
              )}
              style={{ left: posCss(rt.t) }}
            >
              <span className="va-tickmark" />
              {label && (
                <span className={cn("va-ticklabel", `va-ticklabel--${rt.tier}`)}>{label}</span>
              )}
            </div>
          );
        })}
      </div>
      {/* Hover line + time bubble — suppressed while the cursor is over the label
          gutter (where the time would be negative). */}
      {hoverFrac != null && hoverTime(hoverFrac) >= 0 && (
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
                {fmt(clamp(hoverTime(hoverFrac), 0, D))}
              </div>,
              document.body
            )}
        </>
      )}
      {activeSegs.length > 0 && currentTime >= 0 && (
        <div className="va-playhead" style={{ left: posCss(clamp(currentTime, 0, D)) }} />
      )}
      {cellTip != null &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="va-celltip" role="tooltip" style={{ left: cellTip.left, bottom: cellTip.bottom }}>
            <span>
              <b>{cellTip.n}</b>
              {cellTip.cap ? " " + cellTip.cap : ""}
            </span>
            {cellTip.was != null && <span className="va-celltip-was">was: {cellTip.was}</span>}
          </div>,
          document.body,
        )}
    </div>
  );
}
