import { type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { cn } from "../../lib/utils";
import { type BaseTheme, useThemeOptional } from "./ThemeProvider";

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M4.93 19.07l1.41-1.41" />
      <path d="M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// Unselected glyphs differ from selected in OPACITY ONLY. They used to shrink
// to .85 and counter-rotate 18°, which meant every switch shoved all three
// icons around while the thumb travelled underneath them — competing with the
// one piece of motion the control actually has. The icons hold still; the thumb
// is the only thing that moves.
const SELECTED_ICON = "[&>svg]:opacity-100";
const SEGMENTS: Record<
  BaseTheme,
  { label: string; icon: ReactNode; rest: string }
> = {
  light: {
    label: "Light mode",
    icon: <SunIcon />,
    rest: "[&>svg]:opacity-70",
  },
  system: {
    label: "System theme",
    icon: <MonitorIcon />,
    rest: "[&>svg]:opacity-70",
  },
  dark: {
    label: "Dark mode",
    icon: <MoonIcon />,
    rest: "[&>svg]:opacity-70",
  },
};

export interface ThemeModeToggleProps extends Omit<
  ComponentProps<"div">,
  "children" | "onChange"
> {
  /** Segment size in px — the thumb's diameter and the control's height minus
   *  its 2px padding. Default 22, the size the app's navbar wears. */
  size?: number;
  /** `vertical` stacks the three segments — for a collapsed icon rail, where
   *  all three choices should stay directly clickable. */
  orientation?: "horizontal" | "vertical";
  /** Controlled mode: the selected theme. Given this, the control stops
   *  reading the `ThemeProvider` and reports changes through `onValueChange`
   *  instead — for an app that keeps its own theme state, or a preview that
   *  must not drive the real page. */
  value?: BaseTheme;
  /** Controlled mode: called with the picked theme. */
  onValueChange?: (theme: BaseTheme) => void;
  /** Whether to offer the middle "follow the OS" segment. Defaults to whether
   *  the provider has system tracking on; in controlled mode, to `true`. */
  enableSystem?: boolean;
}

/**
 * Segmented theme control: light · system · dark, picked directly, with a
 * circular thumb that slides to the chosen segment.
 *
 * This is the toggle the app has always shipped in its navbar, brought into
 * the kit. It differs from `ThemeColorToggle` in what it asks of the reader:
 * that one is a single button that CYCLES, so choosing "dark" from "light"
 * costs two clicks and the current mode has to be inferred from one glyph.
 * This one shows all three modes at once and takes one click to reach any of
 * them. Prefer it wherever there is room for 68px of chrome; keep
 * `ThemeColorToggle` for a crowded toolbar.
 *
 * Built standalone rather than on `ToggleButtons`: with three equal segments
 * the thumb's position is `index × size`, so the measurement pass that control
 * runs (register refs → read rects → set a transform) buys nothing here, and
 * its highlight is a rounded rect on a chip track rather than a circle on a
 * bare one. The motion is shared, though — `--uikit-ease-thumb` and
 * `--uikit-dur-thumb` are the same curve and duration both controls use, which
 * is what keeps two of them on one page from reading as unrelated widgets.
 *
 * Uses the `ThemeProvider` by default, and with `enableSystem={false}` there
 * the middle segment drops out on its own. Pass `value` + `onValueChange` to
 * drive it yourself instead, with or without a provider above it.
 */
export function ThemeModeToggle({
  size = 22,
  orientation = "horizontal",
  value,
  onValueChange,
  enableSystem,
  className,
  style,
  ...props
}: ThemeModeToggleProps) {
  // Read without throwing: a controlled toggle is allowed to have no provider.
  const ctx = useThemeOptional();
  const controlled = value !== undefined;
  if (!controlled && !ctx) {
    throw new Error(
      "ThemeModeToggle must be used within a ThemeProvider, or given `value` and `onValueChange`.",
    );
  }

  const baseTheme = controlled ? value : ctx!.baseTheme;
  const pick = (mode: BaseTheme) =>
    controlled ? onValueChange?.(mode) : ctx!.setBaseTheme(mode);

  // With a provider, `systemTheme` is undefined exactly when it was given
  // `enableSystem={false}` — there is no OS preference to follow, so a segment
  // offering to follow it would do nothing.
  const showSystem =
    enableSystem ?? (controlled ? true : ctx!.systemTheme !== undefined);
  const modes: BaseTheme[] = showSystem
    ? ["light", "system", "dark"]
    : ["light", "dark"];
  const index = Math.max(0, modes.indexOf(baseTheme));

  return (
    <div
      role="group"
      aria-label="Theme"
      data-orientation={orientation}
      className={cn(
        // Transparent at rest; the chip tint arrives with the pointer. The
        // frame is there to say "these three are one control" at the moment
        // someone is about to use it, and a permanent tinted slab in a quiet
        // navbar is a box drawn around three icons that were reading fine.
        //
        // What makes that safe is the thumb's shadow. A `--bg` thumb on a
        // transparent strip over a `--bg` page is invisible — that is the bug
        // the permanent frame was added to fix — but an elevated thumb reads
        // on its own ground, so the frame does not have to carry it.
        "relative isolate inline-flex shrink-0 items-center rounded-full p-0.5",
        "bg-transparent hover:bg-uikit-chip transition-colors duration-[160ms]",
        orientation === "vertical" && "flex-col",
        className,
      )}
      style={style}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0.5 top-0.5 z-0 rounded-full bg-uikit-bg",
          "transition-transform ease-[var(--uikit-ease-thumb)] duration-[var(--uikit-dur-thumb)]",
          "motion-reduce:transition-none",
        )}
        style={{
          width: size,
          height: size,
          // Same travel distance either way — the axis is all that changes.
          transform:
            orientation === "vertical"
              ? `translateY(${index * size}px)`
              : `translateX(${index * size}px)`,
          willChange: "transform",
        }}
      />
      {modes.map((mode) => {
        const selected = baseTheme === mode;
        const seg = SEGMENTS[mode];
        return (
          <button
            key={mode}
            type="button"
            data-mode={mode}
            aria-label={seg.label}
            title={seg.label}
            aria-pressed={selected}
            onClick={() => pick(mode)}
            className={cn(
              "relative z-10 inline-flex items-center justify-center rounded-full",
              "text-uikit-muted hover:text-uikit-ink aria-pressed:text-uikit-ink",
              "cursor-pointer outline-none transition-colors duration-[250ms]",
              "[&>svg]:block [&>svg]:size-[13px]",
              "[&>svg]:transition-opacity [&>svg]:duration-[250ms]",
              "motion-reduce:[&>svg]:transition-none",
              selected ? SELECTED_ICON : seg.rest,
            )}
            style={{ width: size, height: size } as CSSProperties}
          >
            {seg.icon}
          </button>
        );
      })}
    </div>
  );
}
