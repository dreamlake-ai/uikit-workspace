import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "../../lib/utils";

/**
 * Pill-shaped zoom capsule — a direct port of the viz episode-timeline ZoomBar.
 * `‹` / `›` step zoom by `STEP_FACTOR`; the middle value chip is a horizontal
 * DRAG handle that scales zoom by `exp(dx * DRAG_FACTOR)` per pixel of travel.
 * Zoom is continuous within `[minZoom, maxZoom]`.
 *
 * The drag uses element-level `setPointerCapture`: once captured, every move for
 * that pointer routes to the chip regardless of where the cursor travels — so
 * passing over the ‹ / › buttons mid-drag never interrupts the stream.
 * `draggingRef` is the synchronous source of truth (a stale-closure guard);
 * `dragging` state only mirrors the active cursor/highlight.
 */
const STEP_FACTOR = 1.4; // ‹ / › multiplicative step
const DRAG_FACTOR = 0.008; // exp(dx * f) per pixel of horizontal travel

export function ZoomControl({
  zoom,
  minZoom,
  maxZoom,
  onZoom,
}: {
  zoom: number;
  minZoom: number;
  maxZoom: number;
  onZoom: (zoom: number) => void;
}) {
  const clamp = (z: number) => Math.max(minZoom, Math.min(maxZoom, z));

  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: 0, z: 1 });

  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    startRef.current = { x: e.clientX, z: zoom };
    draggingRef.current = true;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (!draggingRef.current) return;
    e.stopPropagation();
    const dx = e.clientX - startRef.current.x;
    onZoom(clamp(startRef.current.z * Math.exp(dx * DRAG_FACTOR)));
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    endDrag();
  };

  return (
    <div className="va-zoom" onWheel={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="va-zoombtn"
        aria-label="Zoom out"
        title="Zoom out"
        onClick={() => onZoom(clamp(zoom / STEP_FACTOR))}
        disabled={zoom <= minZoom}
      >
        <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.2}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <span
        className={cn("va-zoomdrag", dragging && "on")}
        role="slider"
        aria-label="Zoom (drag to adjust)"
        aria-valuemin={minZoom}
        aria-valuemax={maxZoom}
        aria-valuenow={Number(zoom.toFixed(2))}
        title="Drag to zoom"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onLostPointerCapture={endDrag}
      >
        <span className="va-zoomnum">{zoom.toFixed(2)}</span>
        <span className="va-zoomx">×</span>
      </span>

      <button
        type="button"
        className="va-zoombtn"
        aria-label="Zoom in"
        title="Zoom in"
        onClick={() => onZoom(clamp(zoom * STEP_FACTOR))}
        disabled={zoom >= maxZoom}
      >
        <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.2}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
