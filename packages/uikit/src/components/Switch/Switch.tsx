import { type ButtonHTMLAttributes, forwardRef, useState } from "react";
import { cn } from "../../lib/utils";
import { type ToggleShape, roundClass } from "../../lib/toggleShape";

export interface SwitchProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "type" | "value"
> {
  /** Controlled checked state. */
  checked?: boolean;
  /** Initial state when uncontrolled. */
  defaultChecked?: boolean;
  /** Fired with the next checked state on toggle. */
  onCheckedChange?: (checked: boolean) => void;
  /** Extra classes on the moving thumb. */
  thumbClassName?: string;
  /**
   * Corner shape. `square` (default) gives the track `--radius-uikit-toggle`
   * (4px) and the thumb `--radius-uikit-toggle-thumb` (2px), concentric with
   * the 2px inset. `round` is the stadium track and circular thumb.
   */
  shape?: ToggleShape;
}

/**
 * Binary on/off toggle.
 *
 * Ported from the legacy `@vuer-ai/vuer-uikit` Switch, which wrapped Radix's
 * Switch primitive. Reimplemented here as a plain `role="switch"` button (no
 * Radix dependency, in keeping with this kit) while preserving the drop-in API:
 * `checked` / `defaultChecked` / `onCheckedChange` / `disabled` / `className` /
 * `thumbClassName`. Works controlled or uncontrolled. Track fills with the
 * accent token when on.
 *
 * Square by default, like every toggle in the kit; `shape="round"` (or
 * `SwitchRound`) keeps the pill.
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  function Switch(
    {
      checked,
      defaultChecked = false,
      onCheckedChange,
      disabled,
      className,
      thumbClassName,
      shape = "square",
      ...rest
    },
    ref,
  ) {
    const [internal, setInternal] = useState(defaultChecked);
    const isControlled = checked !== undefined;
    const isOn = isControlled ? checked : internal;
    const round = shape === "round";

    const toggle = () => {
      if (disabled) return;
      const next = !isOn;
      if (!isControlled) setInternal(next);
      onCheckedChange?.(next);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={isOn}
        data-state={isOn ? "checked" : "unchecked"}
        data-shape={shape}
        disabled={disabled}
        onClick={toggle}
        className={cn(
          "relative inline-flex h-4 w-8 shrink-0 items-center",
          round ? "rounded-uikit-round" : "rounded-uikit-toggle",
          "transition-colors duration-200 cursor-pointer",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOn ? "bg-uikit-accent" : "bg-uikit-ink-12",
          roundClass("switch", shape),
          className,
        )}
        {...rest}
      >
        <span
          data-slot="switch-thumb"
          className={cn(
            "pointer-events-none block size-3 bg-white shadow-uikit-sm",
            round ? "rounded-uikit-round" : "rounded-uikit-toggle-thumb",
            "transition-transform duration-200",
            isOn ? "translate-x-[18px]" : "translate-x-[2px]",
            thumbClassName,
          )}
        />
      </button>
    );
  },
);

/** `Switch` with `shape="round"` — the stadium track and circular thumb. */
export const SwitchRound = forwardRef<
  HTMLButtonElement,
  Omit<SwitchProps, "shape">
>(function SwitchRound(props, ref) {
  return <Switch ref={ref} {...props} shape="round" />;
});
