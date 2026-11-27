export interface StatusStackCounts {
  passed: number;
  failed: number;
  /** Explicitly executing entries. Omitted means zero for existing callers. */
  running?: number;
  /** All other expected entries, including missing, queued, skipped or inconclusive. */
  other: number;
}

export interface StatusStackIconProps {
  counts: StatusStackCounts;
  /** Explicit inventory/report completeness; never inferred from reported successes. */
  complete: boolean;
  size?: number;
  /** Optional context prepended to the exact accessible counts. */
  label?: string;
  /** Use when the containing control already announces the counts. */
  decorative?: boolean;
  className?: string;
}

const tones = {
  passed: "var(--tone-green, #1f8f4a)",
  failed: "var(--tone-red, #c8513b)",
  running: "var(--tone-amber, #bf8c1d)",
  other: "var(--muted, #888888)",
};

/** Category layers, not a progress percentage. Counts and completeness belong to the caller. */
export function StatusStackIcon({
  counts,
  complete,
  size = 18,
  label,
  decorative = false,
  className,
}: StatusStackIconProps) {
  const running = counts.running === undefined ? 0 : counts.running;
  const distribution = { ...counts, running };
  const values = [counts.passed, counts.failed, running, counts.other];
  const total = values.reduce((sum, value) => sum + value, 0);
  const valid =
    values.every((value) => Number.isSafeInteger(value) && value >= 0) &&
    Number.isSafeInteger(total);
  const allPassed =
    valid && complete === true && total > 0 && counts.passed === total;
  const outcome = !valid
    ? null
    : counts.failed > 0
      ? "failed"
      : running > 0
        ? "running"
        : allPassed
          ? "passed"
          : null;
  const present = (["other", "failed", "running", "passed"] as const).filter(
    (key) => valid && distribution[key] > 0,
  );
  // A single category uses the familiar three-layer stack. Mixed categories each
  // receive one layer; repetition never pretends to be a quantitative proportion.
  const layers =
    present.length > 1
      ? present
      : Array.from({ length: 3 }, () => present[0] ?? "other");
  const summary = valid
    ? `${counts.passed} passed, ${counts.failed} failed, ${running} running, ${counts.other} other; ${complete === true ? "complete" : "incomplete"}`
    : "Status unavailable";
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      focusable="false"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={
        decorative ? undefined : `${label ? label + ": " : ""}${summary}`
      }
      className={className}
      data-status-stack=""
      data-all-passed={allPassed || undefined}
      data-complete={complete === true}
      style={{ flexShrink: 0, verticalAlign: "middle" }}
    >
      {layers.map((status, index) => {
        // Paint rear layers first, with less color toward the bottom. Opaque
        // surfaces keep overlapping layers and selected-row fills from bleeding through.
        const depth = index / (layers.length - 1);
        const spacing = layers.length === 4 ? 4 : 5;
        const center = 12 + ((layers.length - 1) / 2 - index) * spacing;
        const pastel = `color-mix(in srgb, ${tones[status]} ${8 + depth * 12}%, var(--bg, #fff))`;
        const outline = `color-mix(in srgb, ${tones[status]} ${20 + depth * 18}%, var(--bg, #fff))`;
        return (
          <path
            key={index}
            data-status-layer={status}
            d={`M2 ${center} 11 ${center - 4} 20 ${center} 11 ${center + 4}Z`}
            fill={pastel}
            stroke={outline}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        );
      })}
      {outcome && (
        <g
          data-status-badge={outcome}
          data-status-check={outcome === "passed" ? "" : undefined}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {outcome === "running" ? (
            <>
              <circle
                cx={17}
                cy={17}
                r={4.5}
                stroke="var(--bg, #fff)"
                strokeWidth={4.5}
              />
              <circle
                cx={17}
                cy={17}
                r={4.5}
                stroke={tones.running}
                strokeWidth={2.4}
                strokeDasharray="21 8"
                transform="rotate(-90 17 17)"
              />
            </>
          ) : (
            <>
              <path
                d={
                  outcome === "passed" ? "m11 16 4 4 6-8" : "m12 12 9 9m0-9-9 9"
                }
                stroke="var(--bg, #fff)"
                strokeWidth={4.5}
              />
              <path
                d={
                  outcome === "passed" ? "m11 16 4 4 6-8" : "m12 12 9 9m0-9-9 9"
                }
                stroke={outcome === "passed" ? "#23aaff" : tones.failed}
                strokeWidth={2.4}
              />
            </>
          )}
        </g>
      )}
    </svg>
  );
}
