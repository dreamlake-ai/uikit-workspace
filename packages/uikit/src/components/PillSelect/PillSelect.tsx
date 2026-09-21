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
  // Rest is MUTED text on a hairline, no fill. The line marks where the
  // targets are; it is the one place this row departs from `Toggle`, which
  // outlines nothing — without a box the options read as loose words under the
  // field label rather than a control you pick from.
  "bg-transparent text-uikit-muted shadow-[inset_0_0_0_1px_var(--faint)] opacity-85",
  "hover:bg-uikit-ink-5 hover:opacity-100",
  // Inset, matching TabRow — an offset ring around a 24px pill in a wrapping
  // row collides with its neighbours.
  "outline-none focus-visible:outline-2 focus-visible:outline-uikit-accent focus-visible:-outline-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40",
].join(" ");

// Selected: ink text on a `--chip-bg` fill, and the hairline DROPS. The fill
// says which one is taken; a line around that fill would only thicken its edge.
//
// Three louder treatments were tried in the app and rejected, and the reasons
// are worth keeping: a 1.5px ink ring made the selected option the heaviest ink
// in a form whose other fields are bare text, so it read as flagged rather than
// chosen and outshouted the submit button; an accent tint put a second blue in
// a form that already has one, on the button that submits it; and a solid
// accent fill with the label knocked out in `--bg` is the ink ring's problem in
// another colour (and 2.5:1 in light mode besides).
//
// Single- and multi-select share it. What differs is how many are on at once,
// which the control already shows.
const SELECTED = "bg-uikit-chip text-uikit-ink shadow-none opacity-100";

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
            className={cn(PILL, selected && SELECTED)}
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
            className={cn(PILL, selected && SELECTED)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
