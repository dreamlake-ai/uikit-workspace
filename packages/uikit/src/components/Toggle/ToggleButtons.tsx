import {
  type ComponentProps,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  cloneElement,
  isValidElement,
} from "react";
import { cn } from "../../lib/utils";

export type ToggleButtonsVariant = "primary" | "secondary" | "ghost";
export type ToggleButtonSize = "sm" | "md" | "lg";

const CONTAINER: Record<ToggleButtonsVariant, string> = {
  primary: "bg-uikit-chip",
  secondary: "bg-uikit-chip",
  ghost: "bg-transparent",
};

const HIGHLIGHT: Record<ToggleButtonsVariant, string> = {
  primary: "bg-uikit-accent shadow-uikit-sm rounded-[var(--radius)]",
  secondary: "bg-uikit-bg shadow-uikit-sm rounded-[var(--radius)]",
  ghost: "bg-uikit-chip shadow-uikit-sm rounded-[var(--radius)]",
};

const BTN_VARIANT: Record<ToggleButtonsVariant, string> = {
  primary: "text-uikit-ink data-[selected=true]:text-white",
  secondary: "text-uikit-ink data-[selected=true]:text-uikit-ink",
  ghost:
    "text-uikit-muted hover:text-uikit-ink data-[selected=true]:text-uikit-ink",
};

function btnSizeClass(size: ToggleButtonSize, icon: boolean) {
  const text = {
    sm: "text-uikit-11 gap-1",
    md: "text-uikit-12 gap-1.5",
    lg: "text-uikit-14 gap-1.5",
  }[size];
  const box = icon
    ? { sm: "size-6 p-1", md: "size-8 p-2", lg: "size-9 p-2.5" }[size]
    : { sm: "h-6 px-2", md: "h-7 px-3", lg: "h-8 px-4" }[size];
  return `${text} ${box}`;
}

interface Ctx {
  value: string;
  onValueChange: (value: string) => void;
  size: ToggleButtonSize;
  variant: ToggleButtonsVariant;
  registerItem: (value: string, el: HTMLElement) => void;
  unregisterItem: (value: string) => void;
}
const ToggleButtonsContext = createContext<Ctx | null>(null);

export interface ToggleButtonsProps extends Omit<
  ComponentProps<"div">,
  "onChange"
> {
  value: string;
  onValueChange: (value: string) => void;
  variant?: ToggleButtonsVariant;
  size?: ToggleButtonSize;
  padding?: boolean;
  children: ReactNode;
}

/**
 * Segmented single-select control with a sliding highlight that animates to the
 * active `ToggleButton`. Ported from the legacy `@vuer-ai/vuer-uikit`
 * (measurement-based highlight kept; Radix Slot / CVA dropped). Restyled to
 * DreamLake tokens.
 */
export function ToggleButtons({
  value,
  onValueChange,
  children,
  className,
  size = "md",
  padding = true,
  variant = "primary",
  ...props
}: ToggleButtonsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Map<string, HTMLElement>>(new Map());
  const [highlight, setHighlight] = useState<CSSProperties>({ opacity: 0 });

  const registerItem = useCallback((v: string, el: HTMLElement) => {
    setItems((prev) => new Map(prev).set(v, el));
  }, []);
  const unregisterItem = useCallback((v: string) => {
    setItems((prev) => {
      const next = new Map(prev);
      next.delete(v);
      return next;
    });
  }, []);

  useEffect(() => {
    const el = items.get(value);
    const container = containerRef.current;
    if (el && container) {
      const raf = requestAnimationFrame(() => {
        const c = container.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        const offset = padding ? 4 : 0;
        setHighlight({
          width: r.width,
          height: r.height,
          transform: `translate(${r.left - c.left - offset}px, ${r.top - c.top - offset}px)`,
          opacity: 1,
        });
      });
      return () => cancelAnimationFrame(raf);
    }
    setHighlight((p) => ({ ...p, opacity: 0 }));
  }, [value, items, padding]);

  // Memoize so the context identity is stable — otherwise every render makes a
  // new object, re-running each ToggleButton's register effect and churning the
  // measurement map, which can leave the sliding highlight stuck at opacity 0.
  const ctx = useMemo(
    () => ({
      value,
      onValueChange,
      size,
      variant,
      registerItem,
      unregisterItem,
    }),
    [value, onValueChange, size, variant, registerItem, unregisterItem],
  );

  return (
    <ToggleButtonsContext.Provider value={ctx}>
      <div
        ref={containerRef}
        className={cn(
          "relative inline-flex items-center rounded-[var(--radius)]",
          CONTAINER[variant],
          padding ? "p-1" : "p-0",
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            "pointer-events-none absolute transition-all duration-200 ease-out",
            HIGHLIGHT[variant],
          )}
          style={highlight}
        />
        {children}
      </div>
    </ToggleButtonsContext.Provider>
  );
}

export interface ToggleButtonProps extends ComponentProps<"button"> {
  value: string;
  icon?: boolean;
  asChild?: boolean;
}

export function ToggleButton({
  value,
  children,
  className,
  icon = false,
  asChild = false,
  ref: externalRef,
  ...props
}: ToggleButtonProps) {
  const ctx = useContext(ToggleButtonsContext);
  if (!ctx)
    throw new Error("<ToggleButton> must be used inside <ToggleButtons>");
  const itemRef = useRef<HTMLElement | null>(null);
  const isSelected = ctx.value === value;

  // Merge our measurement ref with any external ref (e.g. a TooltipTrigger
  // asChild passes one in). Without this the external ref would win and our
  // ref would be null, so the button never registers and the highlight breaks.
  const setRef = useCallback(
    (el: HTMLButtonElement | null) => {
      itemRef.current = el;
      if (typeof externalRef === "function") externalRef(el);
      else if (externalRef)
        (externalRef as { current: HTMLButtonElement | null }).current = el;
    },
    [externalRef],
  );

  useEffect(() => {
    const el = itemRef.current;
    if (el) {
      ctx.registerItem(value, el);
      return () => ctx.unregisterItem(value);
    }
  }, [value, ctx]);

  const classes = cn(
    "relative z-10 inline-flex items-center justify-center font-normal whitespace-nowrap transition-colors outline-none cursor-pointer",
    "disabled:pointer-events-none disabled:opacity-50 rounded-[var(--radius)]",
    "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
    BTN_VARIANT[ctx.variant],
    btnSizeClass(ctx.size, icon),
    className,
  );

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{
      onClick?: (e: unknown) => void;
      className?: string;
    }>;
    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      ref: setRef,
      "data-selected": isSelected,
      className: cn(classes, child.props.className),
      onClick: (e: unknown) => {
        child.props.onClick?.(e);
        ctx.onValueChange(value);
      },
    });
  }

  return (
    <button
      ref={setRef}
      type="button"
      data-selected={isSelected}
      className={classes}
      onClick={() => ctx.onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
}
