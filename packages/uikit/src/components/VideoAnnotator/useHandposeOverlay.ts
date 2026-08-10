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
    // Align by FRAME INDEX (like the offline burn-in renderer), not by a fuzzy
    // nearest-timestamp window: map the presented frame's media time to a frame
    // number and look that pose up directly. `fps` is the pose sampling rate
    // (== the video's native rate), so round(t·fps) recovers the source index.
    // Falls back to nearest-by-time when the exact index is absent (a gap from an
    // undetected frame, or an fps-less envelope).
    const fps = handpose.sampling?.fps || handpose.video?.fps || 0;
    const byIndex = new Map(handpose.frames.map((f) => [f.frameIndex, f] as const));
    // The MSE stream can begin at a non-zero media time (a CMAF fragment's
    // baseMediaDecodeTime), while pose frame indices are 0-based. Rather than
    // 0-base the stream (that corrupts cold-start decode), we shift the query
    // time by the stream's content start. Track it as the MIN buffered start
    // ever seen — it only rises as old buffer is evicted, so the minimum is the
    // true origin, stable for the whole clip.
    let contentStart = Infinity;

    // Position the canvas over the (letterboxed) video content and draw the pose
    // for the given time (defaults to the media clock). Same math as before —
    // just no longer called unconditionally every animation frame.
    const draw = (atTime?: number) => {
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
      // Shift media time → pose (0-based) time by the stream's content start.
      if (v.buffered.length) contentStart = Math.min(contentStart, v.buffered.start(0));
      const cs = Number.isFinite(contentStart) ? contentStart : 0;
      const poseT = (atTime ?? v.currentTime) - cs;
      const frame =
        fps > 0
          ? (byIndex.get(Math.round(poseT * fps)) ?? nearestFrame(handpose, poseT, tol))
          : nearestFrame(handpose, poseT, tol);
      if (frame) {
        drawHandposeFrame(ctx, frame, cssW / imgW, cssH / imgH, { dim: Math.min(cssW, cssH) });
      }
    };

    const v = videoRef.current;

    // Preferred path: drive EVERY redraw off the actually-presented frame via
    // requestVideoFrameCallback — the single source of truth for what's on
    // screen, in all states. It fires on each presented frame: during playback,
    // AND when a seek / frame-step / scrub (even while paused) lands a new frame.
    // Just as important, it does NOT fire while the picture is stalled — a
    // cold-start buffer, or a scrub to a not-yet-fetched region — so the skeleton
    // waits WITH the frozen video instead of racing ahead on the media clock
    // (the "skeleton moved but the video didn't" offset). `meta.mediaTime` is
    // that exact frame's time, so the frame-index lookup lands on the shown frame.
    if (v && typeof v.requestVideoFrameCallback === "function") {
      let handle = v.requestVideoFrameCallback(function loop(_now, meta) {
        draw(meta.mediaTime);
        handle = v.requestVideoFrameCallback(loop);
      });
      // Draw once now (nothing is "presented" when paused + idle), and keep the
      // canvas positioned as the video box re-letterboxes — rVFC won't fire for a
      // resize, only for new frames.
      draw();
      const onResize = () => draw();
      const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
      ro?.observe(v);
      if (typeof window !== "undefined") window.addEventListener("resize", onResize);
      return () => {
        v.cancelVideoFrameCallback?.(handle);
        ro?.disconnect();
        if (typeof window !== "undefined") window.removeEventListener("resize", onResize);
      };
    }

    // Fallback (no rVFC): rAF while playing; redraw on seek/timeupdate/resize
    // while paused. Can transiently show the new pose over a not-yet-updated
    // frame during a scrub, but rVFC is available in every modern browser.
    if (playing) {
      let raf = requestAnimationFrame(function loop() {
        draw();
        raf = requestAnimationFrame(loop);
      });
      return () => cancelAnimationFrame(raf);
    }
    draw();
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
