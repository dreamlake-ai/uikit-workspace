import { type ComponentProps } from "react";
import { cn } from "../../lib/utils";
import { type BaseTheme, useTheme } from "./ThemeProvider";
import { Moon, Sun, SunMoon } from "lucide-react";

export interface ThemeCycleToggleProps extends ComponentProps<"button"> {}

const NEXT: Record<BaseTheme, BaseTheme> = {
  dark: "system",
  system: "light",
  light: "dark",
};

/**
 * Single-icon theme button: one glyph, no panel, each click advancing
 * `dark → system → light`. For a surface the three-segment `ThemeModeToggle`
 * doesn't fit — a sidebar footer, a collapsed rail.
 *
 * Borderless on purpose: a 28px transparent circle in muted ink, resting at
 * 0.8 and snapping to 1 under the pointer. It sits in chrome that is already
 * quiet, so a filled or ringed button would be the loudest thing there.
 * The glyph shows the CURRENT preference, not the next one.
 */
export function ThemeCycleToggle({
  className,
  ...props
}: ThemeCycleToggleProps) {
  const { baseTheme, setBaseTheme } = useTheme();
  const Icon =
    baseTheme === "system" ? SunMoon : baseTheme === "light" ? Sun : Moon;
  const label = `Theme: ${baseTheme}. Switch to ${NEXT[baseTheme]} mode`;
  return (
    <button
      type="button"
      onClick={() => setBaseTheme(NEXT[baseTheme])}
      aria-label={label}
      title={label}
      data-theme-preference={baseTheme}
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full",
        "border-0 bg-transparent p-0 text-uikit-muted opacity-80 hover:opacity-100",
        "cursor-pointer outline-none transition-opacity",
        "focus-visible:outline-2 focus-visible:outline-uikit-accent focus-visible:outline-offset-2",
        className,
      )}
      {...props}
    >
      <Icon size={14} strokeWidth={1.5} aria-hidden />
    </button>
  );
}

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
