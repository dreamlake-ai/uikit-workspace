import { type ComponentProps, type Ref, forwardRef, useRef } from "react";
import { cn } from "../../lib/utils";

export type InputState = "default" | "error";
export type InputSize = "sm" | "md" | "lg";

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: T | null }).current = node;
    }
  };
}

const SIZE: Record<InputSize, string> = {
  sm: "h-6 text-uikit-11 px-2 [&_.input-slot>svg:not([class*='size-'])]:size-3",
  md: "h-8 text-uikit-12 px-3 [&_.input-slot>svg:not([class*='size-'])]:size-4",
  lg: "h-9 text-uikit-14 px-3.5 [&_.input-slot>svg:not([class*='size-'])]:size-5",
};

export interface InputRootProps extends Omit<ComponentProps<"input">, "size"> {
  state?: InputState;
  size?: InputSize;
  side?: "left" | "right" | "center";
  inputClassName?: string;
}

/**
 * Styled input container with optional left/right `InputSlot`s (for icons,
 * prefixes, suffixes). Clicking a slot focuses the input and places the caret at
 * the matching end.
 *
 * Ported from the legacy `@vuer-ai/vuer-uikit` InputRoot (also exported as
 * `Input`); restyled to DreamLake tokens. Radix `composeRefs` replaced with a
 * tiny local ref-merge.
 */
export const InputRoot = forwardRef<HTMLInputElement, InputRootProps>(
  function InputRoot(
    {
      style,
      className,
      side,
      children,
      disabled,
      state = "default",
      size = "md",
      type,
      inputClassName,
      ...props
    },
    ref,
  ) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus drops the fill to the page ground and draws a 1px accent line on
    // the field's own edge. Two parts, and both matter.
    //
    // The line is INSET. An outset ring around a filled pill reads as a browser
    // default dropped on the page, and it has to be budgeted for by whatever
    // clips the field — a rail, a toolbar, a row. Inset, it lands on the edge
    // the field already has.
    //
    // And the fill DROPS rather than deepens. That carries the same message
    // without colour, for a reader who cannot separate a blue hairline from a
    // grey one. This is the inverse of what the kit used to do (chip → a deeper
    // `--search-bg`), which is the treatment the app has never worn.
    //
    // Rest stays on the translucent `--chip-bg` rather than the opaque
    // `--search-bg`: the two are the same colour over `--bg` by construction
    // (4% ink on #fffefa IS #f5f4f0), but only the translucent one stays right
    // when the field sits on a panel or a rail.
    const surface = disabled
      ? "bg-uikit-chip opacity-60 cursor-not-allowed"
      : state === "error"
        ? "bg-uikit-danger-8 has-[input:focus]:shadow-[inset_0_0_0_1px_var(--color-uikit-danger)]"
        : "bg-uikit-chip has-[input:focus]:bg-uikit-bg has-[input:focus]:shadow-[inset_0_0_0_1px_var(--uikit-accent)]";

    return (
      <div
        style={style}
        data-input
        className={cn(
          "flex items-center gap-2 overflow-hidden rounded-[var(--radius)] text-uikit-ink",
          "transition-[background-color,box-shadow] duration-[140ms]",
          surface,
          SIZE[size],
          className,
        )}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("input, button, a")) return;
          const input = inputRef.current;
          if (!input) return;
          const isRight = target.closest(".input-slot[data-side='right']");
          const pos = isRight ? input.value.length : 0;
          requestAnimationFrame(() => {
            try {
              input.setSelectionRange(pos, pos);
            } catch {
              /* unsupported input type */
            }
            input.focus();
          });
        }}
      >
        <input
          spellCheck="false"
          {...props}
          type={type}
          data-side={side}
          disabled={disabled}
          ref={mergeRefs(inputRef, ref)}
          className={cn(
            "h-full w-full bg-transparent outline-none placeholder:text-uikit-muted",
            "data-[side=right]:text-right data-[side=center]:text-center",
            "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            "disabled:cursor-not-allowed",
            inputClassName,
          )}
        />
        {children}
      </div>
    );
  },
);

export interface InputSlotProps extends ComponentProps<"div"> {
  side?: "left" | "right";
  /** Hide this slot while the input has focus — for a hint that has served its
   *  purpose the moment the reader is typing (a `⌘K` chip, a format example).
   *  Pure CSS: slots render after the input in the DOM, so a sibling selector
   *  reaches them without any focus state in React. */
  hideOnFocus?: boolean;
}

export const InputSlot = forwardRef<HTMLDivElement, InputSlotProps>(
  function InputSlot(
    { className, children, side = "left", hideOnFocus, ...props },
    ref,
  ) {
    return (
      <div
        data-side={side}
        {...props}
        ref={ref}
        className={cn(
          "input-slot shrink-0 cursor-text text-uikit-muted",
          side === "left" ? "-order-1" : "order-0",
          hideOnFocus && "[input:focus~&]:hidden",
          className,
        )}
      >
        {children}
      </div>
    );
  },
);

export { InputRoot as Input };
