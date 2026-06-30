import {
  type ComponentProps,
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../../lib/utils";

// ── Compound (Radix-style) API ───────────────────────────────────────────────
// `Tabs` supports two shapes: the data-driven one below (`tabs` prop), and a
// compound form (`<Tabs value onValueChange><TabsList><TabsTrigger/>…`). The
// latter is a drop-in for the legacy `@vuer-ai/vuer-uikit` Radix tabs.

interface TabsCtx {
  value: string;
  setValue: (v: string) => void;
}
const TabsContext = createContext<TabsCtx | null>(null);
function useTabsContext(name: string) {
  const c = useContext(TabsContext);
  if (!c) throw new Error(`<${name}> must be used inside <Tabs>`);
  return c;
}

export type TabsVariant = "underline" | "segment";
export type TabsSize = "xs" | "sm" | "md" | "lg";

export interface Tab {
  value: string;
  label: ReactNode;
  count?: number; // underline variant only
  title?: string; // segment variant tooltip
}

export interface TabsProps {
  /** Data-driven form: render this list of tabs. Omit when using the compound
   *  form with `TabsList`/`TabsTrigger`/`TabsContent` children. */
  tabs?: Tab[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Alias for `onChange` (compound/Radix-style form). */
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  size?: TabsSize;
  /** Override indicator thickness (px). Default: 4. */
  indicatorHeight?: number;
  className?: string;
  /** Compound form children (TabsList / TabsContent). */
  children?: ReactNode;
}

// ── underline sizes ──────────────────────────────────────────────────────────

const underlineSizeMap: Record<TabsSize, string> = {
  xs: "text-uikit-11 h-5 pt-px pb-[5px] mr-3",
  sm: "text-uikit-12 h-[27px] pt-1 pb-2 mr-[18px]",
  md: "text-[13.5px] h-[22px] pt-px pb-2 mr-[18px]",
  lg: "text-[15px] h-[34px] pt-1 pb-3 mr-[22px]",
};

// ── segment sizes (exact reference values) ───────────────────────────────────

interface SegmentSizeConfig {
  inset: number;
  containerR: number;
  pillR: number;
  buttonR: number;
  padV: number;
  padH: number;
  iconSize: number;
}

const segmentConfig: Record<TabsSize, SegmentSizeConfig> = {
  xs: {
    inset: 1,
    containerR: 4,
    pillR: 3,
    buttonR: 3,
    padV: 1,
    padH: 4,
    iconSize: 9,
  },
  sm: {
    inset: 1,
    containerR: 5,
    pillR: 4,
    buttonR: 4,
    padV: 2,
    padH: 5,
    iconSize: 10,
  },
  md: {
    inset: 2,
    containerR: 6,
    pillR: 5,
    buttonR: 5,
    padV: 4,
    padH: 6,
    iconSize: 12,
  },
  lg: {
    inset: 3,
    containerR: 7,
    pillR: 6,
    buttonR: 6,
    padV: 5,
    padH: 7,
    iconSize: 14,
  },
};

// ── underline tab item ───────────────────────────────────────────────────────

function UnderlineTabItem({
  tab,
  active,
  size,
  innerRef,
  onClick,
}: {
  tab: Tab;
  active: boolean;
  size: TabsSize;
  innerRef: (el: HTMLDivElement | null) => void;
  onClick: () => void;
}) {
  const isSmall = size === "xs" || size === "sm";

  return (
    <div
      ref={innerRef}
      role="tab"
      aria-selected={active}
      data-active={active || undefined}
      data-small={isSmall || undefined}
      onClick={onClick}
      className={cn(
        "group/tab relative inline-flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap",
        "font-uikit-ui tracking-uikit-snug",
        "transition-[color,opacity] duration-[120ms]",
        underlineSizeMap[size],
        // Color: muted by default, ink when active.
        "text-uikit-muted data-[active]:text-uikit-ink",
        // Weight (only when !isSmall).
        "[&:not([data-small])]:font-medium",
        "[&:not([data-small])]:data-[active]:font-semibold",
        // Opacity (large variants): rest 0.45, hover 0.7, active 1.
        "[&:not([data-small])]:opacity-45",
        "[&:not([data-small])]:hover:opacity-70",
        "[&:not([data-small])]:data-[active]:opacity-100",
        // Opacity (small variants): rest 0.75, hover/active 1.
        "data-[small]:opacity-75",
        "data-[small]:hover:opacity-100",
        "data-[small]:data-[active]:opacity-100",
      )}
    >
      <span>{tab.label}</span>
      {tab.count != null && (
        <span
          className={cn(
            "font-uikit-mono text-[9.5px] rounded-full px-1.5 py-px tracking-uikit-wide",
            "transition-[background-color,opacity] duration-[120ms]",
            // Weight + opacity track the parent's active/hover state.
            "font-medium opacity-55 group-hover/tab:opacity-90 group-data-[active]/tab:opacity-100",
            "group-data-[active]/tab:font-semibold",
            // Background tracks parent state — uses currentColor for theme inheritance.
            "bg-[color-mix(in_oklab,currentColor_5%,transparent)]",
            "group-data-[active]/tab:bg-[color-mix(in_oklab,currentColor_12%,transparent)]",
          )}
        >
          {tab.count}
        </span>
      )}
    </div>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

/**
 * Tab bar. Two interchangeable shapes:
 * - Data-driven: `<Tabs tabs={[…]} value onChange />`.
 * - Compound (drop-in for the legacy Radix tabs):
 *   `<Tabs value onValueChange><TabsList><TabsTrigger/></TabsList><TabsContent/></Tabs>`.
 */
export function Tabs(props: TabsProps) {
  // Compound form: provide context + render children (TabsList/TabsContent).
  if (props.children !== undefined) {
    return (
      <TabsRoot
        value={props.value}
        defaultValue={props.defaultValue}
        onValueChange={props.onValueChange ?? props.onChange}
        className={props.className}
      >
        {props.children}
      </TabsRoot>
    );
  }
  return <TabsData {...props} />;
}

function TabsData({
  tabs,
  defaultValue,
  value,
  onChange,
  onValueChange,
  variant = "underline",
  size = "md",
  indicatorHeight,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? tabs?.[0]?.value ?? "",
  );
  const [bar, setBar] = useState({
    left: 0,
    width: 0,
    height: 0,
    ready: false,
  });
  const tabRefs = useRef<Record<string, HTMLElement | null>>({});

  const activeValue = value !== undefined ? value : internalValue;

  const handleTabClick = (newValue: string) => {
    if (value === undefined) setInternalValue(newValue);
    (onValueChange ?? onChange)?.(newValue);
  };

  useEffect(() => {
    if (value !== undefined) setInternalValue(value);
  }, [value]);

  useEffect(() => {
    const el = tabRefs.current[activeValue];
    if (!el) return;
    setBar({
      left: el.offsetLeft,
      width: el.offsetWidth,
      height: el.offsetHeight,
      ready: true,
    });
  }, [activeValue, tabs?.length]);

  const segCfg = segmentConfig[size];
  const tabList = tabs ?? [];

  return (
    <div
      role="tablist"
      className={cn(
        "relative font-uikit-ui",
        variant === "underline" && "flex items-end",
        variant === "segment" && "inline-flex bg-uikit-ink-5",
        className,
      )}
      style={
        variant === "segment"
          ? {
              padding: segCfg.inset,
              gap: 1,
              borderRadius: segCfg.containerR,
            }
          : undefined
      }
    >
      {/* underline — sliding bottom indicator */}
      {variant === "underline" && (
        <span
          className="absolute pointer-events-none z-[2] bg-uikit-ink"
          style={{
            left: bar.left,
            width: bar.width,
            height: indicatorHeight ?? 2,
            bottom: -1,
            transition: bar.ready
              ? "left 280ms cubic-bezier(.4,0,.2,1), width 280ms cubic-bezier(.4,0,.2,1)"
              : "none",
          }}
        />
      )}

      {/* segment — elevated pill matching the page background */}
      {variant === "segment" && (
        <div
          aria-hidden
          // Style Guide §Elevation tint-1 — the resting-panel tint.
          // Theme-aware via `--shadow-tint-1` so dark mode darkens.
          className="absolute pointer-events-none bg-uikit-bg shadow-[0_1px_2px_var(--shadow-tint-1)]"
          style={{
            top: segCfg.inset,
            bottom: segCfg.inset,
            left: 0,
            width: bar.width,
            transform: `translateX(${bar.left}px)`,
            borderRadius: segCfg.pillR,
            opacity: bar.ready ? 1 : 0,
            transition: bar.ready
              ? "transform 220ms cubic-bezier(.32,.72,0,1), width 220ms cubic-bezier(.32,.72,0,1)"
              : "none",
          }}
        />
      )}

      {/* tab items */}
      {tabList.map((tab) => {
        const active = tab.value === activeValue;

        if (variant === "underline") {
          return (
            <UnderlineTabItem
              key={tab.value}
              tab={tab}
              active={active}
              size={size}
              innerRef={(el) => {
                tabRefs.current[tab.value] = el;
              }}
              onClick={() => handleTabClick(tab.value)}
            />
          );
        }

        // segment
        return (
          <button
            key={tab.value}
            ref={(el) => {
              tabRefs.current[tab.value] = el;
            }}
            type="button"
            title={tab.title}
            aria-pressed={active}
            data-active={active || undefined}
            onClick={() => handleTabClick(tab.value)}
            className={cn(
              "relative z-[1] inline-flex items-center justify-center cursor-pointer",
              "appearance-none border-0 bg-transparent outline-none",
              "text-uikit-muted data-[active]:text-uikit-ink",
              "transition-colors duration-[160ms]",
            )}
            style={{
              padding: `${segCfg.padV}px ${segCfg.padH}px`,
              borderRadius: segCfg.buttonR,
              fontSize: segCfg.iconSize,
              lineHeight: 1,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Compound parts ───────────────────────────────────────────────────────────

interface TabsRootProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children?: ReactNode;
}

/** Context provider for the compound form. Rendered by `Tabs` when children
 *  are passed; not exported (use `<Tabs>` directly). */
function TabsRoot({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: TabsRootProps) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const current = isControlled ? value! : internal;
  const setValue = (v: string) => {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <div className={cn("flex flex-col", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export type TabsListProps = ComponentProps<"div">;
/** Row of `TabsTrigger`s (compound form). */
export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-end gap-3 border-b border-uikit-faint font-uikit-ui",
        className,
      )}
      {...props}
    />
  );
}

export interface TabsTriggerProps extends Omit<
  ComponentProps<"button">,
  "value"
> {
  value: string;
}
/** A single tab button (compound form). */
export function TabsTrigger({
  value,
  className,
  children,
  onClick,
  ...props
}: TabsTriggerProps) {
  const ctx = useTabsContext("TabsTrigger");
  const active = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-active={active || undefined}
      onClick={(e) => {
        onClick?.(e);
        ctx.setValue(value);
      }}
      className={cn(
        "relative -mb-px cursor-pointer select-none whitespace-nowrap border-b-2 border-transparent",
        "pb-1.5 pt-1 text-uikit-12 text-uikit-muted transition-colors",
        "hover:text-uikit-ink data-[active]:border-uikit-ink data-[active]:text-uikit-ink data-[active]:font-medium",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps extends Omit<ComponentProps<"div">, "value"> {
  value: string;
}
/** Panel shown when its `value` matches the active tab (compound form). */
export function TabsContent({
  value,
  className,
  children,
  ...props
}: TabsContentProps) {
  const ctx = useTabsContext("TabsContent");
  if (ctx.value !== value) return null;
  return (
    <div role="tabpanel" className={className} {...props}>
      {children}
    </div>
  );
}
