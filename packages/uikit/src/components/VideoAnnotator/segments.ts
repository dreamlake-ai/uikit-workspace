import type { Segment } from "./types";

/**
 * Pure segment-model helpers ported 1:1 from the phase-review reference
 * template. Every function returns a NEW array (no mutation) so the component
 * can stay controlled — the host owns the `segments` state and receives the
 * next array via `onSegmentsChange`.
 */

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const round3 = (v: number) => Math.round((v || 0) * 1000) / 1000;

/** `m:ss.SS` */
export function fmt(t: number): string {
  t = Math.max(0, t || 0);
  const m = Math.floor(t / 60);
  const s = t % 60;
  return m + ":" + s.toFixed(2).padStart(5, "0");
}

/** `m:ss` (tick labels) */
export function fmtShort(t: number): string {
  t = Math.max(0, t || 0);
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return m + ":" + String(s).padStart(2, "0");
}

/**
 * Force the segment list into the contiguous, gap-free, zero-based invariant:
 * sorted by start, first segment starts at 0 (a filler is inserted if needed),
 * and each `end` is pinned to the next segment's `start` (last uses duration).
 */
export function normalizeSegments(input: Segment[], duration: number): Segment[] {
  let segs = input.filter((s) => s && isFinite(s.start)).map((s) => ({ ...s }));
  segs.sort((a, b) => a.start - b.start);
  if (!segs.length) segs = [{ start: 0, end: duration || 0, description: "", verified: false }];
  if (segs[0].start > 1e-3) segs.unshift({ start: 0, end: segs[0].start, description: "", verified: false });
  segs[0].start = 0;
  for (let i = 0; i < segs.length; i++) {
    const nextStart = i < segs.length - 1 ? segs[i + 1].start : duration || segs[i].end || 0;
    segs[i].end = nextStart;
  }
  return segs;
}

/** Index of the first unverified segment (0 if all verified). */
export function firstUnverified(segs: Segment[]): number {
  const i = segs.findIndex((s) => !s.verified);
  return i < 0 ? 0 : i;
}

export type SplitResult = { segments: Segment[]; selected: number } | { error: string };

/** Split the segment containing `t` at `t`; both halves become unverified. */
export function splitAt(input: Segment[], t: number, duration: number): SplitResult {
  t = clamp(t, 0, duration);
  if (t <= 1e-3 || t >= duration - 1e-3) return { error: "Can't split at the very edge" };
  const segs = input.map((s) => ({ ...s }));
  const k = segs.findIndex((s) => t > s.start + 1e-3 && t < s.end - 1e-3);
  if (k < 0) return { error: "A split already exists here" };
  const s = segs[k];
  const right: Segment = { start: t, end: s.end, description: "", verified: false };
  s.end = t;
  s.verified = false;
  segs.splice(k + 1, 0, right);
  return { segments: segs, selected: k + 1 };
}

/** Merge segment `i` into `i-1`, concatenating descriptions; prev becomes unverified. */
export function mergeInto(input: Segment[], i: number): { segments: Segment[]; selected: number } | null {
  if (i <= 0 || i >= input.length) return null;
  const segs = input.map((s) => ({ ...s }));
  const prev = segs[i - 1];
  const c = segs[i];
  prev.end = c.end;
  prev.description = [prev.description, c.description].map((x) => (x || "").trim()).filter(Boolean).join(" ");
  prev.verified = false;
  segs.splice(i, 1);
  return { segments: segs, selected: clamp(i - 1, 0, segs.length - 1) };
}

/** Move the shared boundary between `i-1` and `i` to time `t` (clamped, both unverified). */
export function moveBoundary(input: Segment[], i: number, t: number): Segment[] {
  if (i <= 0 || i >= input.length) return input;
  const segs = input.map((s) => ({ ...s }));
  const lo = segs[i - 1].start + 0.05;
  const hi = segs[i].end - 0.05;
  const nt = clamp(t, lo, hi);
  segs[i].start = nt;
  segs[i - 1].end = nt;
  segs[i - 1].verified = false;
  segs[i].verified = false;
  return segs;
}

/** Boundary times used for ,/. navigation: each segment start plus the duration end. */
export function boundaryTimes(segs: Segment[], duration: number): number[] {
  return segs.map((s) => s.start).concat([duration]);
}

/** Tick step (seconds) that yields ≤10 ticks across the duration. */
export function tickStep(duration: number): number {
  const targets = [1, 2, 5, 10, 15, 20, 30, 60, 120, 300, 600];
  for (const s of targets) if (duration / s <= 10) return s;
  return targets[targets.length - 1];
}
