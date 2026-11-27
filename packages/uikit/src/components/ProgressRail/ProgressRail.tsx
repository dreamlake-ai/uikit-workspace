import { type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface ProgressRailItem {
  id: string;
  label: ReactNode;
  detail?: ReactNode;
  state: "complete" | "current" | "pending" | "error";
}

export interface ProgressRailProps {
  items: readonly ProgressRailItem[];
  "aria-label": string;
  className?: string;
  /** Dense checklist rows with inline detail and no connected rail. */
  compact?: boolean;
}

const nodeTone: Record<ProgressRailItem["state"], string> = {
  complete: "text-uikit-accent",
  current: "text-uikit-accent",
  pending: "text-uikit-muted",
  error: "text-uikit-tone-red",
};

/** Passive ordered stages. The caller supplies state, detail and available width. */
export function ProgressRail({
  items,
  className,
  compact = false,
  "aria-label": label,
}: ProgressRailProps) {
  if (!items.length) return null;
  return (
    <ol
      role="list"
      aria-label={label}
      data-variant={compact ? "compact" : "rail"}
      className={cn("m-0 min-w-0 list-none p-0 text-uikit-12", className)}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          data-state={item.state}
          aria-current={
            item.state === "current" || item.state === "error"
              ? "step"
              : undefined
          }
          className={cn(
            "relative grid min-w-0 gap-x-2 last:pb-0",
            compact
              ? "grid-cols-[12px_minmax(0,1fr)] pb-[7px] text-uikit-11"
              : "grid-cols-[19px_minmax(0,1fr)] pb-4",
          )}
        >
          {!compact && index < items.length - 1 && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute bottom-0 left-[9px] top-[19px] w-px",
                item.state === "complete"
                  ? "bg-uikit-accent/30"
                  : "bg-uikit-ink-12",
              )}
            />
          )}
          <span
            aria-hidden="true"
            className={cn(
              "flex items-center justify-center",
              compact ? "h-4 w-3" : "size-[19px]",
              nodeTone[item.state],
            )}
          >
            {item.state === "complete" && <Check size={11} />}
            {item.state === "error" && <X size={11} />}
          </span>
          <div
            className={cn(
              "min-w-0 [overflow-wrap:anywhere]",
              compact && "flex items-start gap-x-2",
            )}
          >
            <div
              className={cn(
                compact ? "min-w-0 flex-1 leading-4" : "leading-[19px]",
                item.state === "current" && "font-medium",
                item.state === "pending"
                  ? "text-uikit-muted"
                  : "text-uikit-ink",
              )}
            >
              {item.label}
              <span className="sr-only">: {item.state}</span>
            </div>
            {item.detail != null && (
              <div
                className={cn(
                  "leading-4 text-uikit-muted",
                  compact
                    ? "ml-auto max-w-[50%] text-right text-uikit-10"
                    : "mt-0.5 text-uikit-11",
                )}
              >
                {item.detail}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
