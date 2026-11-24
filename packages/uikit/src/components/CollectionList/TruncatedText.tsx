import {
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../Tooltip";

/**
 * One line of text that ends in an ellipsis when it does not fit — and, only
 * then, names itself in full in the kit tooltip on hover. A list title cut to
 * "managed-transfer-6708f93140198873fd345…" otherwise had no way to read the
 * rest without opening it.
 *
 * Whether it is cut is measured when the tooltip would open (scrollWidth >
 * clientWidth), so it is right after a resize or a rename without observers.
 * No native `title`: the app's hints are all the kit tooltip. The full text is
 * already the element's own text, so screen readers need nothing extra.
 */
export function TruncatedText({
  children,
  text,
  className,
  style,
  side = "top",
  ...rest
}: Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  /** The line itself — a string, or marked-up text (search highlights). */
  children: ReactNode;
  /** The full text for the tooltip, when `children` is not a plain string. */
  text?: string;
  className?: string;
  style?: CSSProperties;
  side?: "top" | "bottom" | "left" | "right";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <Tooltip
      side={side}
      open={open}
      onOpenChange={(next) => {
        const el = ref.current;
        setOpen(next && !!el && el.scrollWidth > el.clientWidth + 0.5);
      }}
    >
      <TooltipTrigger asChild>
        <span
          {...rest}
          ref={ref}
          data-truncated-text=""
          className={className}
          style={{
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            ...style,
          }}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{text ?? children}</TooltipContent>
    </Tooltip>
  );
}
