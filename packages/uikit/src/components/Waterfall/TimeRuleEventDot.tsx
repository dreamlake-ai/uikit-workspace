export interface TimeRuleEventDotProps {
  /** Position as percentage (0-100) */
  percent: number;
}

/**
 * Small dot indicator for key events on the timeline ruler. Marks where
 * significant events occur, for visual reference and cursor snapping.
 */
export function TimeRuleEventDot({ percent }: TimeRuleEventDotProps) {
  if (percent < 0 || percent > 100) return null;

  return (
    <div
      className="bg-uikit-ink-12 absolute top-1/2 z-0 h-1 w-1 -translate-y-1/2 rounded-full"
      style={{ left: `${percent}%` }}
    />
  );
}
