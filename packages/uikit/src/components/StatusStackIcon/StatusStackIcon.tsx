export interface StatusStackCounts {
  passed: number;
  failed: number;
  /** All other expected entries, including missing, running, skipped or inconclusive. */
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
  const values = [counts.passed, counts.failed, counts.other];
  const total = values.reduce((sum, value) => sum + value, 0);
  const valid =
    values.every((value) => Number.isSafeInteger(value) && value >= 0) &&
    Number.isSafeInteger(total);
  const allPassed =
    valid && complete === true && total > 0 && counts.passed === total;
  const present = (["other", "failed", "passed"] as const).filter(
    (key) => valid && counts[key] > 0,
  );
  // A single category uses the familiar three-layer stack. Mixed categories each
  // receive one layer; repetition never pretends to be a quantitative proportion.
  const layers =
    present.length > 1
      ? present
      : Array.from({ length: 3 }, () => present[0] ?? "other");
  const summary = valid
    ? `${counts.passed} passed, ${counts.failed} failed, ${counts.other} other; ${complete === true ? "complete" : "incomplete"}`
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
        const center = 17 - index * (layers.length === 2 ? 8 : 5);
        return (
          <path
            key={index}
            data-status-layer={status}
            d={`M2 ${center} 11 ${center - 4} 20 ${center} 11 ${center + 4}Z`}
            fill={tones[status]}
            fillOpacity={0.13}
            stroke={tones[status]}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        );
      })}
      {allPassed && (
        <g
          data-status-check=""
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18 3 3 4-5.5" stroke="var(--bg, #fff)" strokeWidth={4} />
          <path d="m15 18 3 3 4-5.5" stroke="#23aaff" strokeWidth={2} />
        </g>
      )}
    </svg>
  );
}
