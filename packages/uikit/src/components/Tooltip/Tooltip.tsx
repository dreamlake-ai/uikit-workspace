import {
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { cn } from "../../lib/utils";

type Side = "top" | "right" | "bottom" | "left";

interface TooltipContextValue {
  open: boolean;
  refs: ReturnType<typeof useFloating>["refs"];
  floatingStyles: ReturnType<typeof useFloating>["floatingStyles"];
  getReferenceProps: (
    props?: Record<string, unknown>,
  ) => Record<string, unknown>;
  getFloatingProps: (
    props?: Record<string, unknown>,
  ) => Record<string, unknown>;
  setPlacement: (side: Side) => void;
}
const TooltipContext = createContext<TooltipContextValue | null>(null);
function useTooltipContext(name: string) {
  const c = useContext(TooltipContext);
  if (!c) throw new Error(`<${name}> must be used inside <Tooltip>`);
  return c;
}

const DelayContext = createContext<number>(200);

export interface TooltipProviderProps {
  /** Hover delay (ms) before tooltips open. Default 200. */
  delayDuration?: number;
  children: ReactNode;
}
/** Optional: sets a shared open delay for descendant tooltips. */
export function TooltipProvider({
  delayDuration = 200,
  children,
}: TooltipProviderProps) {
  return (
    <DelayContext.Provider value={delayDuration}>
      {children}
    </DelayContext.Provider>
  );
}

export interface TooltipProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hover delay (ms). Falls back to the nearest TooltipProvider (or 200). */
  delayDuration?: number;
  /** Preferred side of the trigger. Default 'top'. */
  side?: Side;
  /** Gap between trigger and tooltip, in px. Default 6. */
  sideOffset?: number;
  children: ReactNode;
}

/**
 * Hover/focus tooltip. Compose `TooltipTrigger` + `TooltipContent`.
 *
 * Drop-in for the legacy `@vuer-ai/vuer-uikit` Tooltip (Radix). Reimplemented on
 * `@floating-ui/react` for anchored, viewport-aware positioning.
 */
export function Tooltip({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  delayDuration,
  side = "top",
  sideOffset = 6,
  children,
}: TooltipProps) {
  const providerDelay = useContext(DelayContext);
  const delay = delayDuration ?? providerDelay;
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolled;
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolled(next);
    onOpenChange?.(next);
  };

  // Placement can be set by the `side` prop here or overridden by a
  // `side` prop on TooltipContent (drop-in parity with the Radix API).
  const [placement, setPlacement] = useState<Side>(side);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(sideOffset),
      // `crossAxis: false` so flip judges only the axis the placement is ON.
      // With the default (true) a wide tooltip on a control near a viewport
      // edge was rejected for sticking out SIDEWAYS, and flip — running before
      // shift — bounced it onto the perpendicular axis: a top-bar button's
      // tooltip landed beside the button instead of under it, and `side` looked
      // like it did nothing. Keeping horizontal overflow out of flip's decision
      // lets `shift()` do the job it is there for and slide it back into view.
      flip({ fallbackAxisSideDirection: "start", crossAxis: false }),
      shift({ padding: 6 }),
    ],
  });

  const hover = useHover(context, {
    move: false,
    delay: { open: delay, close: 80 },
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  const value = useMemo<TooltipContextValue>(
    () => ({
      open,
      refs,
      floatingStyles,
      getReferenceProps,
      getFloatingProps,
      setPlacement,
    }),
    [open, refs, floatingStyles, getReferenceProps, getFloatingProps],
  );

  return (
    <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>
  );
}

export interface TooltipTriggerProps extends ComponentProps<"button"> {
  asChild?: boolean;
}
export function TooltipTrigger({
  asChild = false,
  children,
  ...props
}: TooltipTriggerProps) {
  const ctx = useTooltipContext("TooltipTrigger");
  const refProps = ctx.getReferenceProps(props);

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<Record<string, unknown>>;
    // COMPOSE the child's own event handlers with floating-ui's rather than
    // replacing them. `cloneElement` lets the passed props win, so any handler
    // the trigger already had for an event the interaction hooks also listen
    // to was silently dropped. `useHover` enters on `onPointerEnter` (no
    // clash) but leaves on `onMouseLeave` (clash) — so a trigger that painted
    // itself on enter and reset on leave applied the paint and never undid it.
    // Measured on a topbar icon button: background went to `ink 4%` on hover
    // and stayed there after the pointer left, for the life of the page.
    const merged: Record<string, unknown> = { ...refProps };
    for (const key of Object.keys(refProps)) {
      if (!/^on[A-Z]/.test(key)) continue;
      const own = child.props[key];
      const theirs = refProps[key];
      if (typeof own === "function" && typeof theirs === "function") {
        merged[key] = (...args: unknown[]) => {
          (own as (...a: unknown[]) => unknown)(...args);
          (theirs as (...a: unknown[]) => unknown)(...args);
        };
      }
    }
    return cloneElement(child, { ref: ctx.refs.setReference, ...merged });
  }
  return (
    <button ref={ctx.refs.setReference as never} type="button" {...refProps}>
      {children}
    </button>
  );
}

export interface TooltipContentProps extends ComponentProps<"div"> {
  /** Override the side set on `Tooltip` (drop-in parity with the Radix API). */
  side?: Side;
  /** Accepted for Radix parity; gap is controlled on `Tooltip`. */
  sideOffset?: number;
  /** Accepted for Radix parity; currently advisory. */
  align?: "start" | "center" | "end";
}
export function TooltipContent({
  className,
  children,
  style,
  side,
  sideOffset: _sideOffset,
  align: _align,
  ...props
}: TooltipContentProps) {
  const ctx = useTooltipContext("TooltipContent");
  useEffect(() => {
    if (side) ctx.setPlacement(side);
  }, [side, ctx]);
  if (!ctx.open) return null;
  return (
    <FloatingPortal>
      <div
        ref={ctx.refs.setFloating as never}
        style={{ ...ctx.floatingStyles, ...style }}
        className={cn(
          "z-[200] max-w-[260px] rounded-md px-2 py-1 font-uikit-ui text-uikit-11 leading-uikit-snug",
          // The kit's floating-overlay surface — the SAME one Popover and
          // DropdownMenu use. This used to be an inverted chip
          // (`bg-uikit-ink text-uikit-bg`), which left the tooltip as the only
          // overlay in the kit that didn't wear the theme's own surface: a hard
          // black block on a warm light page, a hard white one in dark. It read
          // as foreign on every DreamLake surface, worst of all on the graph
          // canvases. `shadow-uikit-soft` carries a 1px faint ring, which is
          // what lifts the panel off the page in dark mode, where panel and bg
          // are the same colour.
          "bg-uikit-panel text-uikit-ink border border-uikit-faint shadow-uikit-soft pointer-events-none",
          className,
        )}
        {...ctx.getFloatingProps(props)}
      >
        {children}
      </div>
    </FloatingPortal>
  );
}
