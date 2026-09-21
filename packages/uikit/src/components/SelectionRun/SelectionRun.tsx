import { type ComponentProps } from "react";
import { cn } from "../../lib/utils";

export interface SelectionRunProps extends ComponentProps<"div"> {}

/**
 * A run of consecutively selected rows, ringed as one block.
 *
 * This is how multi-selection reads across the app: the rows keep their own
 * surface and a single accent ring is drawn around the run, so five selected
 * rows are **one shape** rather than five repeated fills. Five filled rows say
 * "five things happened"; one ringed block says "this is the selection", which
 * is the thing a bulk action is about to act on.
 *
 * The rows inside keep a tight 2px rhythm, which is why the run owns the gap
 * rather than the list around it. Wrap each *contiguous* stretch of selected
 * rows — a gap in the selection is a second run, not a taller one.
 *
 * The ring is outset and sits above its neighbours (`isolate`, `z-1`) so it is
 * not clipped by the row below it.
 *
 * Its radius must MATCH the rows'. An outset ring's inner curve is the run's
 * own corner, so a row rounded tighter than the run pulls away from the ring at
 * each corner and leaves a sliver there. The default is `var(--radius)`;
 * override with `className` when the rows are rounded differently.
 */
export function SelectionRun({ className, ...props }: SelectionRunProps) {
  return (
    <div
      data-slot="selection-run"
      className={cn(
        "relative isolate z-[1] flex flex-col gap-0.5 rounded-[var(--radius)]",
        "shadow-[0_0_0_2px_var(--uikit-accent)]",
        className,
      )}
      {...props}
    />
  );
}
