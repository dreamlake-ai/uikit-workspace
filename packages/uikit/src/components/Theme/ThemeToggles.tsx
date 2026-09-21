import { type ComponentProps } from "react";
import { cn } from "../../lib/utils";
import { useTheme } from "./ThemeProvider";

const toggleClass =
  "inline-flex items-center justify-center size-8 rounded-[var(--radius)] text-uikit-muted hover:bg-uikit-ink-5 hover:text-uikit-ink transition-colors cursor-pointer outline-none";

function LiquidIcon({ on }: { on: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={on ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
    </svg>
  );
}

export interface LiquidToggleProps extends ComponentProps<"button"> {}

/** Toggles the "liquid" theme flag. Drop-in for the legacy LiquidToggle. */
export function LiquidToggle({ className, ...props }: LiquidToggleProps) {
  const { isLiquid, toggleLiquid } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleLiquid}
      aria-pressed={isLiquid}
      aria-label="Toggle liquid theme"
      title="Toggle liquid theme"
      className={cn(toggleClass, isLiquid && "text-uikit-accent", className)}
      {...props}
    >
      <LiquidIcon on={isLiquid} />
    </button>
  );
}
