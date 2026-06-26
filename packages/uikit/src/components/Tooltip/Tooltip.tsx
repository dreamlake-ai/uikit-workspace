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
      flip({ fallbackAxisSideDirection: "start" }),
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
    return cloneElement(child, { ref: ctx.refs.setReference, ...refProps });
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
          "bg-uikit-ink text-uikit-bg shadow-uikit-soft pointer-events-none",
          className,
        )}
        {...ctx.getFloatingProps(props)}
      >
        {children}
      </div>
    </FloatingPortal>
  );
}
