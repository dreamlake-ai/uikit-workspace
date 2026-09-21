import { type ComponentProps, type KeyboardEvent, useRef } from "react";
import { cn } from "../../lib/utils";

export interface PillOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Geometry is the app's, to the half-pixel. The line box is PINNED: the mono
// face renders a ~16.5px default line, which makes the pill 26.5px tall;
// 14.5px + 5 + 5 puts it back on the 24.5px the design draws.
const PILL = [
  "inline-flex items-center justify-center whitespace-nowrap select-none cursor-pointer",
  "font-uikit-mono text-uikit-11 leading-[14.5px] tracking-uikit-snug",
  "px-2.5 py-[5px] rounded-uikit-badge",
  "transition-[background-color,box-shadow,opacity,color] duration-[120ms]",
  // Rest: a hairline, no fill. Hover only raises the label — the app drew no
  // hover at all here, which left a clickable control with nothing to say it
  // was one.
  "bg-transparent text-uikit-ink shadow-[inset_0_0_0_1px_var(--faint)] opacity-85 hover:opacity-100",
  // Inset, matching TabRow — an offset ring around a 24px pill in a wrapping
  // row collides with its neighbours.
  "outline-none focus-visible:outline-2 focus-visible:outline-uikit-accent focus-visible:-outline-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40",
].join(" ");

// Selected: filled, label in the page ground, no ring. The two controls part
// company only here — see the note on each.
const SELECTED_INK = "bg-uikit-ink text-uikit-bg shadow-none opacity-100";
const SELECTED_ACCENT =
  "bg-uikit-accent text-uikit-bg shadow-none opacity-100 hover:opacity-100";

export interface PillRadioProps extends Omit<
  ComponentProps<"div">,
  "onChange" | "defaultValue"
> {
  /** Selected option value. */
  value: string;
  onValueChange: (value: string) => void;
  options: PillOption[];
}

/**
 * Single-select row of outlined pills. The selected pill fills with INK — this
 * is a choice among peers (a role, a priority), not a highlight, so it reads as
 * "this one" rather than as an accent-colored status.
 *
 * The outlined-pill counterpart to `ToggleButtons`: that control puts its
 * options on a shared track with a sliding thumb, which suits two or three
 * fixed segments in a toolbar. These wrap, carry longer labels, and sit in a
 * form under a field label.
 *
 * Implemented as real `<button role="radio">` elements inside a `radiogroup`,
 * with arrow-key navigation and roving focus. The app's version was a row of
 * `<span role="button">`: not focusable, not operable from the keyboard, and
 * announcing the wrong role.
 */
export function PillRadio({
  value,
  onValueChange,
  options,
  className,
  ...props
}: PillRadioProps) {
  const ref = useRef<HTMLDivElement>(null);

  const move = (event: KeyboardEvent<HTMLDivElement>, step: number) => {
    const pickable = options.filter((o) => !o.disabled);
    if (pickable.length === 0) return;
    event.preventDefault();
    const at = pickable.findIndex((o) => o.value === value);
    // From nothing selected, → and ↓ land on the first option, ← and ↑ the last.
    const next =
      at < 0
        ? step > 0
          ? 0
          : pickable.length - 1
        : (at + step + pickable.length) % pickable.length;
    const target = pickable[next];
    onValueChange(target.value);
    // Selection follows focus in a radiogroup, so the DOM focus has to follow
    // the value we just set — the newly selected pill is the only tab stop.
    ref.current
      ?.querySelector<HTMLButtonElement>(
        `[data-value="${CSS.escape(target.value)}"]`,
      )
      ?.focus();
  };

  return (
    <div
      ref={ref}
      role="radiogroup"
      className={cn("flex flex-wrap gap-1.5", className)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown")
          move(event, 1);
        if (event.key === "ArrowLeft" || event.key === "ArrowUp")
          move(event, -1);
      }}
      {...props}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            data-value={option.value}
            aria-checked={selected}
            disabled={option.disabled}
            // Roving tabindex: the group is one tab stop, and arrow keys move
            // within it. With nothing selected yet, the first option holds it.
            tabIndex={selected || (!value && option === options[0]) ? 0 : -1}
            onClick={() => onValueChange(option.value)}
            className={cn(PILL, selected && SELECTED_INK)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export interface ChipMultiProps extends Omit<
  ComponentProps<"div">,
  "onChange" | "defaultValue"
> {
  /** Selected option values. */
  value: string[];
  onValueChange: (value: string[]) => void;
  options: PillOption[];
}

/**
 * Multi-select row of the same pills. A selected chip fills with the ACCENT,
 * where `PillRadio` fills with ink: picking several things out of a set is an
 * additive act, and the accent is what the rest of the kit uses for "on".
 *
 * Each chip is an independent toggle, so these are ordinary buttons carrying
 * `aria-pressed` — every one is a tab stop, and there is no roving focus to
 * manage.
 */
export function ChipMulti({
  value,
  onValueChange,
  options,
  className,
  ...props
}: ChipMultiProps) {
  const toggle = (v: string) =>
    onValueChange(
      value.includes(v) ? value.filter((x) => x !== v) : [...value, v],
    );

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)} {...props}>
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={option.disabled}
            onClick={() => toggle(option.value)}
            className={cn(PILL, selected && SELECTED_ACCENT)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
