import { type CSSProperties, type MouseEvent } from "react";
import { cn } from "../../lib/utils";

export type TagVariant = "pill" | "tag";

/**
 * The 6-color palette from `design.md`. Pick by *function*, not vibe:
 * - `blue`     — active / running / accent (also `--accent`)
 * - `green`    — ok / source / success
 * - `amber`    — stale / scheduled / filter
 * - `red`      — error / sink / quarantine
 * - `purple`   — model / merge / human-authored
 * - `warmGray` — idle / queued / placeholder
 */
export type TagTone =
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "purple"
  | "warmGray";

// Tone → CSS-variable lookup. The hex values themselves live in
// `packages/uikit/src/styles.css` as `--tone-*` (Style Guide §Color),
// so every site that wants a palette color points through this map.
// Inline hex literals are intentionally avoided per §"Never invent a
// near-miss hex."
const TONE_VARS: Record<TagTone, string> = {
  blue: "var(--tone-blue)",
  green: "var(--tone-green)",
  amber: "var(--tone-amber)",
  red: "var(--tone-red)",
  purple: "var(--tone-purple)",
  warmGray: "var(--tone-warm-gray)",
};

/** Resolves a palette tone name OR a raw color string to a CSS color. */
function resolveColor(c: TagTone | string | undefined): string | undefined {
  if (!c) return undefined;
  return c in TONE_VARS ? TONE_VARS[c as TagTone] : c;
}

export interface TagProps {
  /** Tag label text. */
  name: string;
  /**
   * Visual style:
   * - `'tag'` (default): hashtag presentation — `#name` with an underline when active.
   * - `'pill'`: boxed pill with a hairline border, fills with accent when active.
   */
  variant?: TagVariant;
  /** Active state — pill fills with accent, tag underlines. */
  active?: boolean;
  /** Show a × button on hover that calls `onRemove`. */
  removable?: boolean;
  /**
   * Constrain the tag's color to one of the design's 6 palette buckets.
   * Sets both the static text color and the default accent (hover/active).
   * Pass `accent` alongside to override hover/active independently.
   */
  tone?: TagTone;
  /**
   * Override the accent (hover/active) color. Accepts a palette tone name
   * (`'blue'` … `'warmGray'`) or any CSS color string.
   * Default: the resolved `tone` color, or `var(--uikit-accent)` if no tone is set.
   */
  accent?: TagTone | (string & {});
  /** Reduce the font weight (the design's "light" variant). */
  light?: boolean;
  /** Reduce the font size by ~1.5px. */
  compact?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

// × hover / removal feedback uses the palette red — same color as
// `tone="red"` and `var(--color-uikit-danger)`. No bespoke "destructive"
// hex (Style Guide §Color §"Never invent a near-miss hex").
const DANGER = "var(--tone-red)";

export function Tag({
  name,
  variant = "tag",
  active = false,
  removable = false,
  tone,
  accent,
  light = false,
  compact = false,
  onClick,
  onRemove,
  className,
}: TagProps) {
  const toneColor = tone ? TONE_VARS[tone] : undefined;
  const staticColor = toneColor ?? "var(--ink)";
  const accentColor =
    resolveColor(accent) ?? toneColor ?? "var(--uikit-accent)";

  const handleX = (e: MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  // Inject prop-driven colors as CSS variables so Tailwind arbitrary
  // `[color:var(--tag-X)]` utilities can reference them.
  const cssVars = {
    "--tag-static": staticColor,
    "--tag-accent": accentColor,
    "--tag-danger": DANGER,
  } as CSSProperties;

  if (variant === "tag") {
    return (
      <span
        onClick={onClick}
        data-active={active || undefined}
        data-toned={tone ? "" : undefined}
        style={cssVars}
        className={cn(
          "group inline-flex items-baseline py-0.5 leading-[1.2]",
          "font-uikit-ui tracking-uikit-snug transition-colors duration-[140ms]",
          compact ? "text-uikit-12" : "text-[13.5px]",
          light ? "font-normal" : "font-medium",
          onClick || removable ? "cursor-pointer" : "cursor-default",
          // Text color: static → accent on hover → danger when × is hovered.
          "text-[color:var(--tag-static)] hover:text-[color:var(--tag-accent)]",
          "data-[active]:text-[color:var(--tag-accent)]",
          "has-[[data-x]:hover]:!text-[color:var(--tag-danger)]",
          className,
        )}
      >
        <span
          className={cn(
            "mr-0.5 font-normal text-current transition-opacity duration-[140ms]",
            // # opacity: 0.45 rest → 0.8 hover; toned → 0.7 rest.
            "opacity-45 group-hover:opacity-80",
            "group-data-[toned]:opacity-70",
          )}
        >
          #
        </span>
        <span
          className={cn(
            "text-current underline-offset-[3px]",
            "decoration-[color:var(--tag-accent)]",
            "transition-[opacity,text-decoration-color] duration-[140ms]",
            // Label opacity: 0.5 rest → 1 hover; toned → 1 always.
            "opacity-50 group-hover:opacity-100 group-data-[toned]:opacity-100",
            // Active → the label at full strength in its accent. It used to
            // underline, which reads as a link in a row of things that are not
            // links, and put a second line under text that already carries a
            // colour and an opacity to say the same thing.
            "group-data-[active]:opacity-100",
            "group-has-[[data-x]:hover]:line-through",
            "group-has-[[data-x]:hover]:!decoration-[color:var(--tag-danger)]",
          )}
        >
          {name}
        </span>
        {removable && (
          <span
            data-x=""
            onClick={handleX}
            className={cn(
              // No nudge. The row is `items-center`, so the × centres on the
              // chip by itself; the 1px lift it used to carry was tuned to a
              // geometry this pill no longer has and left it off-centre.
              "inline-flex items-center cursor-pointer leading-none overflow-hidden",
              "text-[color:var(--tag-accent)] hover:text-[color:var(--tag-danger)]",
              // Width / margin / opacity animate on parent hover.
              "w-0 ml-0 opacity-0",
              "group-hover:w-2.5 group-hover:ml-0.5 group-hover:opacity-75",
              "hover:!opacity-100",
              "transition-[opacity,margin-left,width,color] duration-[140ms]",
            )}
          >
            <CloseGlyph />
          </span>
        )}
      </span>
    );
  }

  // pill variant
  return (
    <span
      onClick={onClick}
      data-active={active || undefined}
      style={cssVars}
      className={cn(
        "group inline-flex items-center gap-1.5 whitespace-nowrap leading-none",
        "font-uikit-ui tracking-uikit-snug",
        // The badge step, like every other small control in the kit. At
        // `--radius * 1.2` a 24px pill is most of the way to a stadium, which
        // made it the one chip shape that did not match the buttons and the
        // form pills beside it.
        "px-2.5 py-[5px] rounded-uikit-badge",
        compact ? "text-uikit-11" : "text-[11.5px]",
        light ? "font-normal" : "font-medium",
        onClick || removable ? "cursor-pointer" : "cursor-default",
        "transition-[color,background-color,box-shadow] duration-[140ms]",
        // No line and no fill, in any state — the colour does all of it.
        //
        // A hairline made every status and role read as an outlined button,
        // something to press, when these are labels reporting a value. A fill
        // was the same mistake with softer edges: it still drew a box around a
        // word, and a column of them read as a stack of chips rather than as
        // the values they name. What is left is the word in its tone, with
        // enough padding to keep it off its neighbours.
        "bg-transparent shadow-none",
        "text-[color:var(--tag-static)]",
        // Active is the accent, and nothing else.
        "data-[active]:text-[color:var(--tag-accent)]",
        // × hover: the label turns danger AND takes the strike, which is the
        // preview of what the click does. The `tag` variant has always drawn
        // that line; this one only changed colour, so the same gesture showed
        // two different previews depending on which variant you were on.
        "has-[[data-x]:hover]:!text-[color:var(--tag-danger)]",
        "has-[[data-x]:hover]:line-through",
        "has-[[data-x]:hover]:decoration-[color:var(--tag-danger)]",
        "transition-[color,text-decoration-color] duration-[140ms]",
        className,
      )}
    >
      {name}
      {removable && (
        <span
          data-x=""
          onClick={handleX}
          className={cn(
            "inline-flex items-center cursor-pointer leading-none",
            "transition-[opacity,color] duration-[140ms]",
            "opacity-0 group-hover:opacity-55",
            "group-data-[active]:group-hover:opacity-80",
            "hover:!opacity-100",
            "text-current group-data-[active]:text-uikit-bg",
            "hover:text-[color:var(--tag-danger)] group-data-[active]:hover:text-uikit-bg",
          )}
        >
          <CloseGlyph />
        </span>
      )}
    </span>
  );
}

function CloseGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
