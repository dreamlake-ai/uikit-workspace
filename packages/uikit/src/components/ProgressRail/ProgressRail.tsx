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
}

const nodeTone: Record<ProgressRailItem["state"], string> = {
  complete: "border-uikit-tone-green/40 text-uikit-tone-green",
  current: "border-uikit-accent text-uikit-accent",
  pending: "border-uikit-ink-12 text-uikit-muted",
  error: "border-uikit-tone-red/50 text-uikit-tone-red",
};

/** Passive ordered stages. The caller supplies state, detail and available width. */
export function ProgressRail({
  items,
  className,
  "aria-label": label,
}: ProgressRailProps) {
  if (!items.length) return null;
  return (
    <ol
      role="list"
      aria-label={label}
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
          className="relative grid min-w-0 grid-cols-[19px_minmax(0,1fr)] gap-x-2 pb-4 last:pb-0"
        >
          {index < items.length - 1 && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute bottom-0 left-[9px] top-[19px] w-px",
                item.state === "complete"
                  ? "bg-uikit-tone-green/30"
                  : "bg-uikit-ink-12",
              )}
            />
          )}
          <span
            aria-hidden="true"
            className={cn(
              "flex size-[19px] items-center justify-center rounded-full border",
              nodeTone[item.state],
            )}
          >
            {item.state === "complete" && <Check size={11} />}
            {item.state === "error" && <X size={11} />}
            {item.state === "current" && (
              <span className="size-[5px] rounded-full bg-current" />
            )}
          </span>
          <div className="min-w-0 [overflow-wrap:anywhere]">
            <div
              className={cn(
                "leading-[19px]",
                item.state === "pending"
                  ? "text-uikit-muted"
                  : "text-uikit-ink",
              )}
            >
              {item.label}
              <span className="sr-only">: {item.state}</span>
            </div>
            {item.detail != null && (
              <div className="mt-0.5 text-uikit-11 leading-4 text-uikit-muted">
                {item.detail}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
