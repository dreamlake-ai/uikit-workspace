import { type ButtonHTMLAttributes, forwardRef, useState } from "react";
import { cn } from "../../lib/utils";

export type ToggleVariant = "primary" | "secondary";
export type ToggleSize = "sm" | "base" | "lg";

// Pressed takes `--selected-bg`, the kit's one surface for "this is the one you
// are on" (a pale blue, #d9e6f7 / #3d4856). It was an ink wash at 4–8%, which on
// a light page is a grey smudge you have to hunt for — a pressed toggle is the
// single most important thing in its own row to be able to find. The token has
// existed since the palette was written and no component had ever reached for
// it; this is what it is for.
const VARIANTS: Record<ToggleVariant, string> = {
  primary:
    "text-uikit-ink hover:bg-uikit-ink-5 data-[state=on]:text-uikit-ink data-[state=on]:bg-uikit-selected",
  secondary:
    "text-uikit-muted hover:bg-uikit-ink-5 data-[state=on]:text-uikit-ink data-[state=on]:bg-uikit-selected",
};

// Button's ladder, step for step — same text sizes, same leading, same padding.
// A Toggle is a button that stays down; there is no reason for it to be built to
// different measurements than the button beside it.
//
// It used to pin a height (`h-7`) and set no vertical padding at all, so the box
// stopped growing with its own text: 12px sides against 0 top and bottom read as
// a squashed pill. 6px corner, not `--radius`'s 10px — that is the panel/row
// step, and at 28px tall it rounds a small control most of the way to a stadium.
const SIZES: Record<ToggleSize, string> = {
  sm: "text-uikit-11 leading-[14.5px] gap-1 px-2.5 py-[5px] rounded-uikit-badge [&_svg:not([class*='size-'])]:size-3",
  base: "text-uikit-12 leading-[16.5px] gap-1.5 px-3.5 py-[7px] rounded-uikit-badge [&_svg:not([class*='size-'])]:size-4",
  lg: "text-uikit-14 leading-[18.5px] gap-1.5 px-[18px] py-[9px] rounded-uikit-badge [&_svg:not([class*='size-'])]:size-5",
};

export interface ToggleVariantsOptions {
  variant?: ToggleVariant;
  size?: ToggleSize;
  className?: string;
}

/** Class-string helper, exported for drop-in parity with the legacy `toggleVariants`. */
export function toggleVariants({
  variant = "primary",
  size = "base",
  className,
}: ToggleVariantsOptions = {}) {
  return cn(
    "inline-flex items-center justify-center shrink-0 whitespace-nowrap font-normal outline-none cursor-pointer",
    "transition-all disabled:opacity-50 disabled:cursor-not-allowed",
    "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
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
        disabled={disabled}
        onClick={toggle}
        className={toggleVariants({ variant, size, className })}
        {...rest}
      />
    );
  },
);
