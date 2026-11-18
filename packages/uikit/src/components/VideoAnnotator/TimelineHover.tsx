import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { clamp, fmt } from "./segments";
import type { Segment } from "./types";

/** Pointer feedback has its own render boundary, independent of every lane and
 * ruler tick. Delegate caption events so offscreen items need no handlers. */
export function TimelineHover({
  timelineRef,
  tracks,
  D,
  gutterPx,
  zoom,
  windowStart,
  windowEnd,
}: {
  timelineRef: RefObject<HTMLDivElement | null>;
  tracks: Segment[][];
  D: number;
  gutterPx: number;
  zoom: number;
  windowStart: number;
  windowEnd: number;
}) {
  const [hover, setHover] = useState<{
    fraction: number;
    time: number;
    x: number;
    y: number;
  } | null>(null);
  const [tip, setTip] = useState<{
    n: number;
    cap: string;
    was: string | null;
    left: number;
    bottom: number;
  } | null>(null);
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    let frame = 0;
    let pointer: { x: number; y: number } | null = null;
    const clear = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      pointer = null;
      setHover(null);
      setTip(null);
    };
    const move = (e: MouseEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!pointer) return;
        const rect = el.getBoundingClientRect();
        const fraction = clamp((pointer.x - rect.left) / Math.max(1, rect.width), 0, 1);
        const time = ((fraction * rect.width - gutterPx) / Math.max(1, rect.width - gutterPx)) * D;
        setHover(time < 0 ? null : { fraction, time: clamp(time, 0, D), x: pointer.x, y: rect.top });
      });
    };
    const segmentFor = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>(".va-seg") : null;
    const over = (e: MouseEvent) => {
      const cell = segmentFor(e.target);
      if (!cell || cell === segmentFor(e.relatedTarget)) return;
      const index = Number(cell.dataset.segmentIndex);
      const lane = Number(cell.closest<HTMLElement>(".va-track")?.dataset.track);
      const p = tracks[lane]?.[index];
      if (!p) return;
      const was = p.edited && p.original && p.original !== p.description ? p.original : null;
      const label = cell.querySelector<HTMLElement>(".va-seglabel");
      const cut = label
        ? getComputedStyle(label).display === "none" ||
          (label.parentElement != null && getComputedStyle(label.parentElement).display === "none") ||
          label.scrollWidth > label.clientWidth + 1 ||
          label.scrollHeight > label.clientHeight + 1
        : !!p.description;
      if (!cut && was == null) {
        setTip(null);
        return;
      }
      const rect = cell.getBoundingClientRect();
      setTip({
        n: index + 1,
        cap: p.description ?? "",
        was,
        left: rect.left + rect.width / 2,
        bottom: window.innerHeight - Math.min(el.getBoundingClientRect().top, rect.top) + 6,
      });
    };
    const out = (e: MouseEvent) => {
      if (segmentFor(e.target) !== segmentFor(e.relatedTarget)) setTip(null);
    };
    // Geometry or data changes invalidate a portaled tooltip's old anchor.
    clear();
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseover", over);
    el.addEventListener("mouseout", out);
    el.addEventListener("mouseleave", clear);
    el.parentElement?.addEventListener("scroll", clear, { passive: true });
    window.addEventListener("resize", clear);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseover", over);
      el.removeEventListener("mouseout", out);
      el.removeEventListener("mouseleave", clear);
      el.parentElement?.removeEventListener("scroll", clear);
      window.removeEventListener("resize", clear);
    };
  }, [timelineRef, tracks, D, gutterPx, zoom, windowStart, windowEnd]);

  return (
    <>
      {hover && <div className="va-hoverline" style={{ left: `${hover.fraction * 100}%` }} />}
      {hover &&
        createPortal(
          <div
            className="va-hovertime va-hovertime--fixed"
            style={{ position: "fixed", left: hover.x, top: hover.y + 12 }}
          >
            {fmt(hover.time)}
          </div>,
          document.body,
        )}
      {tip &&
        createPortal(
          <div className="va-celltip" role="tooltip" style={{ left: tip.left, bottom: tip.bottom }}>
            <span>
              <b>{tip.n}</b>
              {tip.cap ? " " + tip.cap : ""}
            </span>
            {tip.was != null && <span className="va-celltip-was">was: {tip.was}</span>}
          </div>,
          document.body,
        )}
    </>
  );
}
