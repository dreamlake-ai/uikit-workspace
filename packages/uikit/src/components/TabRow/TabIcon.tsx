import { forwardRef, type ComponentProps } from "react";
import { cn } from "../../lib/utils";

/** Leading tab icon or asynchronous icon host. Empty hosts take no width or gap;
 * the tab keeps the compact leading inset while its icon is loading. */
export const TabIcon = forwardRef<HTMLSpanElement, ComponentProps<"span">>(
  function TabIcon({ className, ...props }, ref) {
    return (
      <span
        {...props}
        ref={ref}
        data-tab-leading-icon=""
        className={cn("uikit-tab-icon", className)}
      />
    );
  },
);
