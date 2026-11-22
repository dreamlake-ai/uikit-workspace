import { type ButtonHTMLAttributes, forwardRef, useState } from "react";
import { cn } from "../../lib/utils";
import { type ToggleShape, roundClass } from "../../lib/toggleShape";

export type ToggleVariant = "primary" | "secondary";
export type ToggleSize = "sm" | "base" | "lg";

// Pressed is a *state of this control*, not a status in the domain, so it stays
// neutral — `--chip-bg`, the same layer a segmented control uses for its track
// and Badge uses for `secondary`. Accent stays free to mean running / active.
//
// Both variants take it. They differ at rest (ink vs muted label) and meet in
// the pressed state, which is the one thing they are both saying.
const VARIANTS: Record<ToggleVariant, string> = {
  primary:
    "text-uikit-ink hover:bg-uikit-ink-5 data-[state=on]:text-uikit-ink data-[state=on]:bg-uikit-chip",
  secondary:
    "text-uikit-muted hover:bg-uikit-ink-5 data-[state=on]:text-uikit-ink data-[state=on]:bg-uikit-chip",
};

// Button's ladder, step for step — same text sizes, same leading, same padding.
// A Toggle is a button that stays down; there is no reason for it to be built to
// different measurements than the button beside it.
//
// It used to pin a height (`h-7`) and set no vertical padding at all, so the box
// stopped growing with its own text: 12px sides against 0 top and bottom read as
// a squashed pill. 6px corner, not `--radius`'s 10px — that is the panel/row
// step, and at 28px tall it rounds a small control most of the way to a stadium.
// The corner is applied by `shape` below: `square` is that 6px badge radius,
// `round` the full stadium.
const SHAPES: Record<ToggleShape, string> = {
  square: "rounded-uikit-badge",
  round: "rounded-uikit-round",
};

const SIZES: Record<ToggleSize, string> = {
  sm: "text-uikit-11 leading-[14.5px] gap-1 px-2.5 py-[5px] [&_svg:not([class*='size-'])]:size-3",
  base: "text-uikit-12 leading-[16.5px] gap-1.5 px-3.5 py-[7px] [&_svg:not([class*='size-'])]:size-4",
  lg: "text-uikit-14 leading-[18.5px] gap-1.5 px-[18px] py-[9px] [&_svg:not([class*='size-'])]:size-5",
};

export interface ToggleVariantsOptions {
  variant?: ToggleVariant;
  size?: ToggleSize;
  /** Corner shape: `square` (default, the 6px badge radius) or `round`. */
  shape?: ToggleShape;
  className?: string;
}

/** Class-string helper, exported for drop-in parity with the legacy `toggleVariants`. */
export function toggleVariants({
  variant = "primary",
  size = "base",
  shape = "square",
  className,
}: ToggleVariantsOptions = {}) {
  return cn(
    "inline-flex items-center justify-center shrink-0 whitespace-nowrap font-normal outline-none cursor-pointer",
    // Keyboard focus: the kit's 2px accent ring, inset (as on Button's
    // transparent variants), on `:focus-visible` only.
    "focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-uikit-accent focus-visible:-outline-offset-2",
    "transition-all disabled:opacity-50 disabled:cursor-not-allowed",
    "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    SHAPES[shape],
    roundClass("toggle", shape),
    className,
  );
}

export interface ToggleProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "type"
> {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  variant?: ToggleVariant;
  size?: ToggleSize;
  /** Corner shape: `square` (default) or `round` (the stadium pill). */
  shape?: ToggleShape;
}

/**
 * A two-state toggle button (pressed / not). Ported from the legacy
 * `@vuer-ai/vuer-uikit` Toggle (Radix Toggle) as a plain `aria-pressed` button —
 * no Radix dep. Drop-in API: `pressed` / `defaultPressed` / `onPressedChange` /
 * `variant` / `size`, controlled or uncontrolled.
 */
export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  function Toggle(
    {
      pressed,
      defaultPressed = false,
      onPressedChange,
      variant = "primary",
      size = "base",
      shape = "square",
      disabled,
      className,
      ...rest
    },
    ref,
  ) {
    const [internal, setInternal] = useState(defaultPressed);
    const isControlled = pressed !== undefined;
    const on = isControlled ? pressed : internal;

    const toggle = () => {
      if (disabled) return;
      const next = !on;
      if (!isControlled) setInternal(next);
      onPressedChange?.(next);
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={on}
        data-state={on ? "on" : "off"}
        data-shape={shape}
        disabled={disabled}
        onClick={toggle}
        className={toggleVariants({ variant, size, shape, className })}
        {...rest}
      />
    );
  },
);

/** `Toggle` with `shape="round"` — the stadium pill. */
export const ToggleRound = forwardRef<
  HTMLButtonElement,
  Omit<ToggleProps, "shape">
>(function ToggleRound(props, ref) {
  return <Toggle ref={ref} {...props} shape="round" />;
});
