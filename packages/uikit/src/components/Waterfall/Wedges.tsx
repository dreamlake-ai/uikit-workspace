import { type LogItemWithMeta } from "./types";
import { cn } from "../../lib/utils";

interface LeftWedgeProps {
  item: LogItemWithMeta;
  classes: Record<string, string>;
  viewStart: number;
  index: number;
}

interface RightWedgeProps {
  item: LogItemWithMeta;
  classes: Record<string, string>;
  viewEnd: number;
  index: number;
}

export function LeftWedge({ item, classes, viewStart }: LeftWedgeProps) {
  const barEnd =
    item.startTime !== undefined && item.duration !== undefined
      ? item.startTime + item.duration
      : undefined;
  const isOffscreenLeft =
    (barEnd !== undefined && barEnd < viewStart) ||
    (item.time !== undefined && item.time < viewStart);

  return (
    <div
      key={`left-wedge=${item.id}`}
      className={cn("relative flex h-[32px] w-0 flex-row justify-items-center")}
    >
      {isOffscreenLeft && item.color ? (
        <div
          className={cn(
            "my-auto border-y-[6px] border-r-[5px] border-y-transparent",
            classes[item.color],
          )}
        />
      ) : null}
    </div>
  );
}

export function RightWedge({ item, classes, viewEnd }: RightWedgeProps) {
  const barStart = item.startTime;
  const isOffscreenRight =
    (barStart !== undefined && barStart > viewEnd) ||
    (item.time !== undefined && item.time > viewEnd);

  return (
    <div
      key={`right-wedge=${item.id}`}
      className={cn("relative flex h-[32px] w-0 flex-row justify-items-center")}
    >
      {isOffscreenRight && item.color ? (
        <div
          className={cn(
            "my-auto border-y-[6px] border-l-[5px] border-y-transparent",
            classes[item.color],
          )}
        />
      ) : null}
    </div>
  );
}
