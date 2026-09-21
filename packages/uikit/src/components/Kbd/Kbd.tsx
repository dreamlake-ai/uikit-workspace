import { type ComponentProps } from "react";
import { cn } from "../../lib/utils";

export interface KbdProps extends ComponentProps<"kbd"> {}

/**
 * A keyboard-shortcut chip — `⌘K` beside a search field, `esc` in a dialog
 * footer.
 *
 * A real `<kbd>`, so the markup says what it is. Deliberately quiet: this is a
 * hint about a shortcut that already works, never a control, so it takes the
 * faintest ink wash in the kit and muted text rather than a border and ink.
 * Anything louder competes with the field it is sitting inside.
 */
export function Kbd({ className, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center shrink-0 select-none",
        "font-uikit-mono text-[9.5px] font-semibold tracking-uikit-wide",
        // 4px, one step BELOW the badge radius, and the one literal here. The
        // chip is 13.5px tall; at the ladder's 6px it is most of the way to a
        // stadium and stops reading as a key. If a second component wants this
        // step, promote it to the ladder rather than copying the literal.
        "px-[5px] py-[2px] rounded-[4px]",
        "bg-uikit-ink-5 text-uikit-muted opacity-80",
        className,
      )}
      {...props}
    />
  );
}
