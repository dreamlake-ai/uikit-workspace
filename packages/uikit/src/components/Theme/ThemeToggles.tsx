import { type ComponentProps } from "react";
import { cn } from "../../lib/utils";
import { useTheme } from "./ThemeProvider";

const toggleClass =
  "inline-flex items-center justify-center size-8 rounded-[var(--radius)] text-uikit-muted hover:bg-uikit-ink-5 hover:text-uikit-ink transition-colors cursor-pointer outline-none";

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
    </svg>
  );
}
function SystemIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 18v3" />
    </svg>
  );
}
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

export interface ThemeColorToggleProps extends ComponentProps<"button"> {}

/**
 * Cycles the base theme: light → dark → system. Drop-in for the legacy
 * `@vuer-ai/vuer-uikit` ThemeColorToggle. Must be used within a `ThemeProvider`.
 */
export function ThemeColorToggle({
  className,
  ...props
}: ThemeColorToggleProps) {
  const { baseTheme, setBaseTheme } = useTheme();
  const next = () =>
    setBaseTheme(
      baseTheme === "light"
        ? "dark"
        : baseTheme === "dark"
          ? "system"
          : "light",
    );
  return (
    <button
      type="button"
      onClick={next}
      aria-label={`Theme: ${baseTheme}`}
      title={`Theme: ${baseTheme}`}
      className={cn(toggleClass, className)}
      {...props}
    >
      {baseTheme === "system" ? (
        <SystemIcon />
      ) : baseTheme === "dark" ? (
        <MoonIcon />
      ) : (
        <SunIcon />
      )}
    </button>
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
