import { type LogItemWithMeta } from "./types";
import { borderColorClasses, colorClasses, formatDuration } from "./utils";
import { cn } from "../../lib/utils";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export interface TimelineEventBarProps {
  item: LogItemWithMeta;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick?: (time: number) => void;
  viewStart: number;
  viewWindow: number;
  timeToPercent: (time: number) => number;
  index?: number;
}

/**
 * Individual timeline event bar — renders a single event with its launch-wait
 * line and execution bar.
 */
export function TimelineProcessBar({
  item,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
  viewStart,
  viewWindow,
  timeToPercent,
}: TimelineEventBarProps) {
  const viewEnd = viewStart + viewWindow;
  const isHaltedStep = item.isHaltedStep;
  const barStart = item.startTime;
  const barEnd =
    item.startTime !== undefined && item.duration !== undefined
      ? item.startTime + item.duration
      : undefined;

  return (
    <div
      className={cn("relative h-[32px] w-full", isHovered && "bg-uikit-ink-5")}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Launch Wait Line */}
      {item.createTime !== undefined &&
        item.startTime !== undefined &&
        item.createTime < item.startTime &&
        item.color && (
          <div
            className="absolute top-1/2 h-2 -translate-y-1/2"
            style={{
              left: `${timeToPercent(item.createTime)}%`,
              width: `${((item.startTime - item.createTime) / viewWindow) * 100}%`,
            }}
          >
            <div
              className={cn(
                "absolute top-1/2 left-0 h-2 w-px -translate-y-1/2",
                colorClasses[item.color],
              )}
            />
            <div
              className={cn(
                "absolute top-1/2 w-full -translate-y-1/2 border-t",
                borderColorClasses[item.color],
              )}
            />
            <div
              className={cn(
                "absolute top-1/2 right-0 h-2 w-px -translate-y-1/2",
                colorClasses[item.color],
              )}
            />
          </div>
        )}

      {/* Execution Bar */}
      {item.startTime !== undefined &&
        item.duration !== undefined &&
        !isHaltedStep && (
          <div
            className={cn(
              "rounded-uikit-badge absolute top-1/2 flex h-5 -translate-y-1/2 items-center justify-center overflow-hidden",
              item.color && colorClasses[item.color],
              item.hasStripes &&
                "bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,var(--shadow-inset)_4px,var(--shadow-inset)_8px)]",
              onClick && "cursor-pointer",
            )}
            style={{
              left: `${timeToPercent(item.startTime)}%`,
              width: `${(item.duration / viewWindow) * 100}%`,
            }}
            onClick={(e) => {
              if (onClick && item.startTime !== undefined) {
                e.stopPropagation();
                // Calculate click position within the bar
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickPercent = clickX / rect.width;
                const clickTime =
                  item.startTime + item.duration! * clickPercent;
                onClick(clickTime);
              }
            }}
          />
        )}

      {/* Visible Label for Execution Bar */}
      {item.startTime !== undefined &&
        item.duration !== undefined &&
        !isHaltedStep &&
        (() => {
          const visibleStart = Math.max(barStart!, viewStart);
          const visibleEnd = Math.min(barEnd!, viewEnd);

          if (visibleEnd <= visibleStart) return null;

          const visibleDuration = visibleEnd - visibleStart;
          const visibleWidthPercent = (visibleDuration / viewWindow) * 100;

          if (visibleWidthPercent < 4) return null;

          return (
            <div
              className="pointer-events-none absolute top-1/2 flex h-5 -translate-y-1/2 items-center justify-center"
              style={{
                left: `${timeToPercent(visibleStart)}%`,
                width: `${visibleWidthPercent}%`,
              }}
            >
              <span
                className={cn(
                  "text-uikit-11 font-medium whitespace-nowrap",
                  item.color === "gray-light" || item.color === "gray-medium"
                    ? "text-uikit-ink"
                    : "text-white",
                )}
              >
                {formatDuration(item.duration)}
              </span>
            </div>
          );
        })()}

      {/* Start Circle */}
      {item.startTime !== undefined &&
        item.duration !== undefined &&
        !isHaltedStep &&
        item.color && (
          <div
            className={cn(
              "bg-uikit-panel absolute top-1/2 z-10 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2",
              borderColorClasses[item.color],
            )}
            style={{
              left: `${timeToPercent(item.startTime)}%`,
            }}
          />
        )}

      {/* Special Halted Step Visualization */}
      {isHaltedStep &&
        item.startTime !== undefined &&
        item.duration !== undefined && (
          <div
            className="absolute top-1/2 flex h-full -translate-y-1/2 items-center"
            style={{
              left: `${timeToPercent(item.startTime)}%`,
              width: `${(item.duration / viewWindow) * 100}%`,
            }}
          >
            <div className="relative flex h-full w-full items-center justify-center">
              <div className="bg-uikit-faint absolute top-1/2 left-0 h-2 w-px -translate-y-1/2" />
              <div className="border-uikit-faint w-full border-t border-dashed" />
              <div className="bg-uikit-faint absolute top-1/2 right-0 h-2 w-px -translate-y-1/2" />
            </div>
          </div>
        )}

      {/* Halted Step Label */}
      {isHaltedStep &&
        item.startTime !== undefined &&
        item.duration !== undefined &&
        (() => {
          const visibleStart = Math.max(barStart!, viewStart);
          const visibleEnd = Math.min(barEnd!, viewEnd);

          if (visibleEnd <= visibleStart) return null;

          const visibleDuration = visibleEnd - visibleStart;
          const visibleWidthPercent = (visibleDuration / viewWindow) * 100;

          return (
            <div
              className="pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center justify-center overflow-hidden"
              style={{
                left: `${timeToPercent(visibleStart)}%`,
                width: `${visibleWidthPercent}%`,
                zoom: clamp(visibleWidthPercent, 6, 12) / 12,
              }}
            >
              {visibleWidthPercent > 7 && (
                <span className="rounded-full bg-uikit-tone-amber px-2 py-0.5 text-uikit-10 text-white">
                  Halted
                </span>
              )}
              {visibleWidthPercent < 7 && (
                <span className="h-3 w-3 rounded-full bg-uikit-tone-amber" />
              )}
            </div>
          );
        })()}
    </div>
  );
}
