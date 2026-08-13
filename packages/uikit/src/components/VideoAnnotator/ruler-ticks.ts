// Three-tier ruler ticks (major / minor / micro) for the annotator timeline.
//
// Ports the shared episode-timeline ruler (viz-workspace TimeRuler / tick-steps —
// the design's DLDetailRuler) so the annotator ruler matches it 1:1. uikit can't
// depend on viz, so the step/divisor ladder + label formatters live here.
//
// Model difference: TimeRuler renders only the visible viewport, so it can afford
// dense micro ticks. This timeline widens the whole strip to zoom*100% and lays
// ticks across the full [0,D] at t/D, so finer tiers are dropped past a DOM cap
// instead of viewport-culled.

const STEPS = [
  0.05, 0.1, 0.25, 0.5, 1, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600,
  7200, 10800, 21600, 43200, 86400,
];

const MINOR_DIVISORS: Record<number, number> = {
  0.05: 5, 0.1: 4, 0.25: 5, 0.5: 5, 1: 4, 5: 5, 10: 10, 15: 5, 30: 6, 60: 6,
  120: 4, 300: 5, 600: 10, 900: 5, 1800: 6, 3600: 6, 7200: 4, 10800: 6,
  21600: 6, 43200: 6,
};

const MICRO_DIVISORS: Record<number, number> = {
  0.05: 1, 0.1: 1, 0.25: 1, 0.5: 1, 1: 1, 5: 4, 10: 4, 15: 3, 30: 5, 60: 5,
  120: 6, 300: 4, 600: 4, 900: 6, 1800: 5, 3600: 5, 7200: 6,
};

// Safety bound on ticks generated for one window (a degenerate visible range
// shouldn't be able to flood the DOM). A normal window holds ~240.
const HARD_CAP = 2000;

export type TickTier = "major" | "minor" | "micro";
export interface RulerTick {
  t: number;
  tier: TickTier;
}
export interface VaRulerResult {
  major: number;
  minor: number;
  micro: number;
  ticks: RulerTick[];
}

function pickMajorStep(visibleSpan: number, targetMajors = 8): number {
  for (const s of STEPS) if (visibleSpan / s <= targetMajors) return s;
  return STEPS[STEPS.length - 1];
}

function classify(t: number, major: number, minor: number): TickTier {
  if (Math.abs(t / major - Math.round(t / major)) < 1e-6) return "major";
  if (Math.abs(t / minor - Math.round(t / minor)) < 1e-6) return "minor";
  return "micro";
}

/**
 * Ticks for the VISIBLE time window `[visStartT, visEndT]` only — matching the
 * design's DLDetailRuler, which redraws the visible span rather than scaling a
 * wider strip. `major` is picked so ~8 land in the visible span (`D/zoom`);
 * minor/micro subdivide it and are laid at the micro grid across the window, so
 * dense micro graduation shows at ANY zoom while the DOM stays bounded by what's
 * on screen (~240 ticks) instead of the whole widened clip.
 *
 * Positions are still `t/D` (full-widened-strip coordinates) — the caller lays
 * each tick at `left: t/D*100%`; only the GENERATED RANGE is the window.
 */
export function computeVaTicks(
  D: number,
  zoom: number,
  visStartT: number,
  visEndT: number,
): VaRulerResult {
  const visible = D && zoom ? D / zoom : D;
  if (!D || !visible) return { major: 0, minor: 0, micro: 0, ticks: [] };

  const major = pickMajorStep(visible, 8);
  const minorDiv = MINOR_DIVISORS[major] ?? 4;
  const minor = major / minorDiv;
  const microDiv = MICRO_DIVISORS[major] ?? 1;
  const micro = minor / microDiv;

  // Snap the window start to the micro grid so tick times sit on round numbers
  // (stable React keys + the tier-promotion animation keeps identity as zoom
  // reselects the major). Index-based `i*micro` avoids float drift. `visStartT`
  // may be NEGATIVE when a label gutter insets the 0 tick — the window then
  // reaches left of 0 so the ruler shows negative graduations (bounded by the
  // caller's visible window, so it can't run away).
  const start = Math.floor(visStartT / micro) * micro;
  const end = Math.min(D, visEndT);
  const ticks: RulerTick[] = [];
  const eps = micro * 1e-6;
  const n0 = Math.round(start / micro);
  for (let i = n0; i * micro <= end + eps && ticks.length < HARD_CAP; i++) {
    const t = Math.min(i * micro, D);
    ticks.push({ t, tier: classify(t, major, minor) });
  }
  return { major, minor, micro, ticks };
}

/**
 * Major-tier label — cascades through s / m / h / d so it reads naturally at any
 * zoom level (e.g. `0s`, `40s`, `1m`, `2m 30s`, `1h 5m`).
 */
export function formatMajorLabel(seconds: number, major: number): string {
  if (seconds === 0) return "0s";
  const sign = seconds < 0 ? "-" : "";
  const abs = Math.abs(seconds);
  if (major < 1) {
    const dec = major < 0.1 ? 2 : 1;
    return `${sign}${abs.toFixed(dec)}s`;
  }
  const s = Math.round(abs);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (d > 0) return sign + (h > 0 ? `${d}d ${h}h` : `${d}d`);
  if (h > 0) return sign + (m > 0 ? `${h}h ${m}m` : `${h}h`);
  if (m > 0) return sign + (r > 0 ? `${m}m ${r}s` : `${m}m`);
  return `${sign}${r}s`;
}

/**
 * Minor-tier residual label — a number-only cascade that sits under each major
 * (e.g. `:20`, `:40`, or a plain second count at fine zoom).
 */
export function formatMinorLabel(
  seconds: number,
  major: number,
  minor: number,
): string {
  if (seconds === 0) return "";
  const s = seconds;
  if (major <= 30) {
    if (minor < 1) {
      return s.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    }
    const r = Math.round(s % major);
    return r === 0 ? "" : String(r);
  }
  if (major <= 900) {
    const r = Math.round(s % 60);
    if (r === 0) {
      const mm = Math.floor(s / 60) % (major / 60);
      return mm === 0 ? "" : `${mm}m`;
    }
    return `:${String(r).padStart(2, "0")}`;
  }
  if (major <= 43200) {
    const totalMin = Math.round(s / 60);
    const r = totalMin % 60;
    if (r === 0) {
      const hh = Math.floor(totalMin / 60) % (major / 3600);
      return hh === 0 ? "" : `${hh}h`;
    }
    return `${r}m`;
  }
  const totalHr = Math.round(s / 3600);
  const r = totalHr % 24;
  return r === 0 ? "" : `${r}h`;
}

// mono advance widths at 8.5px (minor) / 10.5px (major) — for collision boxes.
const MINOR_CH = 5.1;
const MAJOR_CH = 6.4;

/**
 * Minor-label collision culling (ported from the design's DLDetailRuler). Minor
 * labels are decoration: any that would touch a neighbour minor OR a major label
 * is dropped, so the strip thins gracefully instead of overprinting. If culling
 * leaves ~one label per major gap it reads as repeated noise, so the whole tier
 * is dropped. Positions are px on the widened strip (t/D * wrapW).
 */
export function cullMinorLabels(
  ticks: RulerTick[],
  major: number,
  minor: number,
  D: number,
  wrapW: number,
  gutterPx = 0,
): Set<number> {
  const keep = new Set<number>();
  if (!wrapW || D <= 0) return keep;
  // Same fixed-px gutter as the render: t=0 sits at x=gutterPx, t=D at wrapW.
  const innerW = Math.max(1, wrapW - gutterPx);
  const pxOf = (t: number) => gutterPx + (t / D) * innerW;

  const majorBoxes: [number, number][] = [];
  for (const tk of ticks) {
    if (tk.tier !== "major") continue;
    const pct = (pxOf(tk.t) / wrapW) * 100;
    const half = (formatMajorLabel(tk.t, major).length * MAJOR_CH) / 2 + 4;
    const x = pxOf(tk.t);
    const l = pct < 6 ? x : pct > 94 ? x - half * 2 : x - half;
    majorBoxes.push([l - 3, l + half * 2 + 3]);
  }

  let lastRight = -Infinity;
  ticks.forEach((tk, i) => {
    if (tk.tier !== "minor") return;
    const lbl = formatMinorLabel(tk.t, major, minor);
    if (!lbl) return;
    const half = (lbl.length * MINOR_CH) / 2 + 2;
    const x = pxOf(tk.t);
    const l = x - half;
    const r = x + half;
    if (l < lastRight + 5) return;
    if (majorBoxes.some((b) => r > b[0] && l < b[1])) return;
    keep.add(i);
    lastRight = r;
  });

  const gaps = Math.max(1, ticks.filter((t) => t.tier === "major").length - 1);
  if (keep.size <= gaps * 1.4) keep.clear();
  return keep;
}
