import { useEffect, type RefObject } from "react";
import type { HandposeEnvelope } from "./types";
import { drawHandposeFrame, frameTolerance, nearestFrame } from "./handpose";

/**
 * Hand-pose overlay driver. A canvas glued to the rendered video box, drawing
 * the 21-keypoint hand skeletons synced to the playhead. Runs only while the
 * toggle is on and data is present; otherwise the canvas is cleared.
 *
 * Redraw strategy (v2 perf): the skeleton only changes when the playhead moves
 * or the video box resizes, so we DON'T spin a 60fps rAF while paused (the
 * common state during labeling). Instead:
 *   • playing → a rAF loop, to track smoothly during playback;
 *   • paused  → redraw only on `seeked`/`timeupdate` (step/scrub) and on a
 *     ResizeObserver / window-resize (the video box re-letterboxing).
 * The draw itself is identical either way, so the overlay looks the same.
 */
export function useHandposeOverlay(opts: {
  enabled: boolean;
  playing: boolean;
  handpose?: HandposeEnvelope | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
}): void {
  const { enabled, playing, handpose, videoRef, canvasRef, stageRef } = opts;
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

    // Position the canvas over the (letterboxed) video content and draw the
    // frame nearest the current playhead. Same math as before — just no longer
    // called unconditionally every animation frame.
    const draw = () => {
      const v = videoRef.current;
      const canvas = canvasRef.current;
      const stage = stageRef.current;
      if (!v || !canvas || !stage) return;
      const vr = v.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      const cssW = vr.width;
      const cssH = vr.height;
      if (cssW <= 0 || cssH <= 0) return;
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
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      // Map image-pixel coords → rendered-video px.
      const imgW = handpose.image?.width || v.videoWidth || cssW;
      const imgH = handpose.image?.height || v.videoHeight || cssH;
      const frame = nearestFrame(handpose, v.currentTime, tol);
      if (frame) {
        drawHandposeFrame(ctx, frame, cssW / imgW, cssH / imgH, { dim: Math.min(cssW, cssH) });
      }
    };

    if (playing) {
      // Smooth tracking during playback.
      let raf = requestAnimationFrame(function loop() {
        draw();
        raf = requestAnimationFrame(loop);
      });
      return () => cancelAnimationFrame(raf);
    }

    // Paused: draw once now, then only on actual changes.
    draw();
    const v = videoRef.current;
    const onDraw = () => draw();
    v?.addEventListener("seeked", onDraw);
    v?.addEventListener("timeupdate", onDraw);
    const ro =
      typeof ResizeObserver !== "undefined" && v ? new ResizeObserver(onDraw) : null;
    if (ro && v) ro.observe(v);
    if (typeof window !== "undefined") window.addEventListener("resize", onDraw);
    return () => {
      v?.removeEventListener("seeked", onDraw);
      v?.removeEventListener("timeupdate", onDraw);
      ro?.disconnect();
      if (typeof window !== "undefined") window.removeEventListener("resize", onDraw);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, hasHandpose, handpose, playing]);
}
