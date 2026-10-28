import {
  type ComponentProps,
  type MouseEvent,
  type ReactElement,
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  cloneElement,
  isValidElement,
} from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface CollapsibleContextValue {
  open: boolean;
  toggle: () => void;
  disabled?: boolean;
  /** Ties the trigger's `aria-controls` to the content's `id`. */
  contentId: string;
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

function useCollapsibleContext(component: string) {
  const ctx = useContext(CollapsibleContext);
  if (!ctx) throw new Error(`<${component}> must be used inside <Collapsible>`);
  return ctx;
}

export interface CollapsibleProps extends ComponentProps<"div"> {
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Fired with the next open state on toggle. */
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

/**
 * An expand/collapse region: a `Collapsible` wrapping a `CollapsibleTrigger`
 * and a `CollapsibleContent`.
 *
 * Ported from the legacy `@vuer-ai/vuer-uikit` Collapsible, which wrapped
 * Radix. Reimplemented with React context (no Radix dep); the content animates
 * height with a pure-CSS grid-rows technique instead of Radix's measured
 * keyframes. Drop-in API preserved: `open` / `defaultOpen` / `onOpenChange` /
 * `disabled`, plus `CollapsibleTrigger` (with `asChild`) and
 * `CollapsibleContent`.
 */
export function Collapsible({
  open,
  defaultOpen = false,
  onOpenChange,
  disabled,
  className,
  children,
  ...props
}: CollapsibleProps) {
  const [internal, setInternal] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internal;
  const contentId = useId();

  const toggle = () => {
    if (disabled) return;
    const next = !isOpen;
    if (!isControlled) setInternal(next);
    onOpenChange?.(next);
  };

  return (
    <CollapsibleContext.Provider
      value={{ open: isOpen, toggle, disabled, contentId }}
    >
      <div
        data-slot="collapsible"
        data-state={isOpen ? "open" : "closed"}
        className={className}
        {...props}
      >
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}

export interface CollapsibleTriggerProps extends ComponentProps<"button"> {
  /** Render the single child element as the trigger instead of a `<button>`. */
  asChild?: boolean;
}

/** Toggles the surrounding `Collapsible`. */
export function CollapsibleTrigger({
  asChild = false,
  onClick,
  children,
  className,
  ...props
}: CollapsibleTriggerProps) {
  const ctx = useCollapsibleContext("CollapsibleTrigger");

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!e.defaultPrevented) ctx.toggle();
  };

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{
      onClick?: (e: MouseEvent) => void;
      className?: string;
    }>;
    const merged: Record<string, unknown> = {
      "data-slot": "collapsible-trigger",
      "data-state": ctx.open ? "open" : "closed",
      "aria-expanded": ctx.open,
      "aria-controls": ctx.contentId,
      onClick: (e: MouseEvent) => {
        child.props.onClick?.(e);
        if (!e.defaultPrevented) ctx.toggle();
      },
      className: cn(child.props.className, className),
    };
    return cloneElement(child, merged);
  }

  return (
    <button
      type="button"
      data-slot="collapsible-trigger"
      data-state={ctx.open ? "open" : "closed"}
      aria-expanded={ctx.open}
      aria-controls={ctx.contentId}
      disabled={ctx.disabled}
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

export type CollapsibleContentProps = ComponentProps<"div">;

/**
 * Content that animates its height open/closed. The content's natural height
 * is measured (via a ResizeObserver, so it tracks dynamic content) and the
 * wrapper animates between `0` and that height, quick then slow; the content
 * itself fades and settles 4px down as it opens. While the height is moving
 * the wrapper carries `data-animating`, so a surrounding Dialog follows it
 * instead of animating its own height on top. Closed content is `inert` (no
 * focus inside a hidden section). Reduced motion: no animation (styles.css).
 * `className` lands on the inner content element, so padding/spacing doesn't
 * bleed through while collapsed.
 */
export function CollapsibleContent({
  className,
  children,
  style,
  ...props
}: CollapsibleContentProps) {
  const ctx = useCollapsibleContext("CollapsibleContent");
  const innerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const wasOpen = useRef(ctx.open);

  useEffect(() => {
    const el = innerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => setContentHeight(el.scrollHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Flag the height transition from the toggle itself (before the first
  // transition frame), cleared on transitionend — or after the duration if no
  // transition runs (reduced motion, hidden ancestor).
  useEffect(() => {
    if (wasOpen.current === ctx.open) return;
    wasOpen.current = ctx.open;
    if (contentHeight == null) return;
    setAnimating(true);
    const t = window.setTimeout(() => setAnimating(false), 320);
    return () => window.clearTimeout(t);
  }, [ctx.open, contentHeight]);

  // Before the first measurement, render at natural height when open (no
  // animation on mount — like Radix, which only animates on state change).
  // Once measured, animate the pixel height between 0 and the content height.
  const measured = contentHeight != null;

  return (
    <div
      id={ctx.contentId}
      data-slot="collapsible-content"
      data-state={ctx.open ? "open" : "closed"}
      data-measured={measured ? "" : undefined}
      data-animating={animating ? "" : undefined}
      aria-hidden={!ctx.open}
      inert={!ctx.open}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && e.propertyName === "height")
          setAnimating(false);
      }}
      className="uikit-collapsible-content"
      style={{
        overflow: "hidden",
        height: ctx.open ? (measured ? contentHeight! : "auto") : 0,
        // Once folded away, take the content out of view entirely (not just
        // clipped to 0px) — find-in-page and visibility checks skip it. The
        // render that closes still has `wasOpen` set, so the fold-out plays.
        visibility:
          !ctx.open && !animating && !wasOpen.current ? "hidden" : undefined,
        ...style,
      }}
      {...props}
    >
      <div ref={innerRef} className={cn("uikit-collapsible-inner", className)}>
        {children}
      </div>
    </div>
  );
}

export interface CollapsibleChevronProps extends Omit<
  ComponentProps<"svg">,
  "ref"
> {
  /** Icon size in px. Default 14. */
  size?: number;
}

/**
 * The disclosure chevron: points right while closed and turns down (90°) as
 * the content opens, on the same curve. Decorative (`aria-hidden`) — the
 * trigger's `aria-expanded` carries the state.
 */
export function CollapsibleChevron({
  size = 14,
  className,
  ...props
}: CollapsibleChevronProps) {
  const ctx = useCollapsibleContext("CollapsibleChevron");
  return (
    <ChevronRight
      aria-hidden
      size={size}
      strokeWidth={2}
      data-state={ctx.open ? "open" : "closed"}
      className={cn("uikit-collapsible-chevron shrink-0", className)}
      {...props}
    />
  );
}
