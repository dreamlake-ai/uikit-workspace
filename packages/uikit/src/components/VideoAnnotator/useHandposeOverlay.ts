import { useEffect, type RefObject } from "react";
import type { HandposeEnvelope } from "./types";
import { drawHandposeFrame, frameTolerance, nearestFrame } from "./handpose";

/**
 * Hand-pose overlay driver. A canvas glued to the rendered video box, redrawn
 * each animation frame so the skeleton stays aligned during play, pause, scrub
 * and resize. Runs only while the toggle is on and data is present; otherwise
 * the canvas is cleared.
 *
 * NOTE (v1): kept as a per-frame rAF loop identical to the original. Throttling
 * it to timeupdate + ResizeObserver is a v2 performance item.
 */
export function useHandposeOverlay(opts: {
  enabled: boolean;
  handpose?: HandposeEnvelope | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
}): void {
  const { enabled, handpose, videoRef, canvasRef, stageRef } = opts;
  const hasHandpose = Boolean(handpose && handpose.frames && handpose.frames.length);
  useEffect(() => {
    const clear = () => {
      const cv = canvasRef.current;
      if (!cv) return;
      const c = cv.getContext("2d");
      if (c) c.clearRect(0, 0, cv.width, cv.height);
    };
    if (!enabled || !hasHandpose || !handpose) {
      clear();
      return;
    }
    const tol = frameTolerance(handpose);
    let raf = 0;
    const tick = () => {
      const v = videoRef.current;
      const canvas = canvasRef.current;
      const stage = stageRef.current;
      if (v && canvas && stage) {
        const vr = v.getBoundingClientRect();
        const sr = stage.getBoundingClientRect();
        const cssW = vr.width;
        const cssH = vr.height;
        if (cssW > 0 && cssH > 0) {
          // Position the canvas exactly over the (letterboxed) video content.
          canvas.style.left = `${vr.left - sr.left}px`;
          canvas.style.top = `${vr.top - sr.top}px`;
          canvas.style.width = `${cssW}px`;
          canvas.style.height = `${cssH}px`;
          const dpr = window.devicePixelRatio || 1;
          const pw = Math.round(cssW * dpr);
          const ph = Math.round(cssH * dpr);
          if (canvas.width !== pw) canvas.width = pw;
          if (canvas.height !== ph) canvas.height = ph;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, cssW, cssH);
            // Map image-pixel coords → rendered-video px.
            const imgW = handpose.image?.width || v.videoWidth || cssW;
            const imgH = handpose.image?.height || v.videoHeight || cssH;
            const frame = nearestFrame(handpose, v.currentTime, tol);
            if (frame) {
              drawHandposeFrame(ctx, frame, cssW / imgW, cssH / imgH, {
                dim: Math.min(cssW, cssH),
              });
            }
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, hasHandpose, handpose]);
}
