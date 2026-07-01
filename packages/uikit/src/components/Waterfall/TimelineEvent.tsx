import { type LogItemWithMeta } from "./types";
import { colorClasses } from "./utils";
import { cn } from "../../lib/utils";

export interface TimelineEventProps {
  item: LogItemWithMeta;
  isHovered: boolean;
  /** Outer-corner rounding class so a hovered subtree reads as one block. */
  hoverRadiusClass?: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick?: (time: number) => void;
  timeToPercent: (time: number) => number;
  index?: number;
}

/**
 * Instant-event marker — an event that occurs at a single point in time (no
 * duration). Rendered as a diamond on the timeline.
 */
export function TimelineEvent({
  item,
  isHovered,
  hoverRadiusClass,
  onMouseEnter,
  onMouseLeave,
  onClick,
  timeToPercent,
}: TimelineEventProps) {
  // Only render if item has a time property (instant event)
  if (item?.time === undefined || item?.time === null) return null;

  return (
    <div
      className={cn(
        "relative h-[32px] w-full",
        isHovered && "bg-uikit-tree-hover",
        hoverRadiusClass,
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Diamond shape for instant event */}
      <div
        className={cn(
          "absolute top-1/2 -translate-x-1/2 -translate-y-1/2",
          "border-uikit-panel h-3 w-3 rotate-45 border-2",
          item.color && colorClasses[item.color],
          onClick && "cursor-pointer transition-transform hover:scale-110",
        )}
        style={{
          left: `${timeToPercent(item.time)}%`,
        }}
        onClick={(e) => {
          if (onClick && item.time !== undefined) {
            e.stopPropagation();
            onClick(item.time);
          }
        }}
        title={item.label}
      />
    </div>
  );
}
