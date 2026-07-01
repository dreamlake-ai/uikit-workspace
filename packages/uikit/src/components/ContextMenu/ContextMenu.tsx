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
  useRef,
  useState,
} from "react";
import {
  FloatingFocusManager,
  FloatingList,
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useListItem,
  useListNavigation,
  useRole,
} from "@floating-ui/react";
import { cn } from "../../lib/utils";
import {
  type LegacyOverlayContentProps,
  stripLegacyOverlayProps,
} from "../../lib/legacy-overlay-props";

interface MenuCtx {
  open: boolean;
  setOpen: (o: boolean) => void;
  refs: ReturnType<typeof useFloating>["refs"];
  floatingStyles: ReturnType<typeof useFloating>["floatingStyles"];
  context: ReturnType<typeof useFloating>["context"];
  getFloatingProps: (p?: Record<string, unknown>) => Record<string, unknown>;
  getItemProps: (p?: Record<string, unknown>) => Record<string, unknown>;
  activeIndex: number | null;
  elementsRef: React.MutableRefObject<Array<HTMLElement | null>>;
}
const Ctx = createContext<MenuCtx | null>(null);
function useCtx(name: string) {
  const c = useContext(Ctx);
  if (!c) throw new Error(`<${name}> must be used inside <ContextMenu>`);
  return c;
}

export interface ContextMenuProps {
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

/**
 * Right-click menu. Compose `ContextMenuTrigger` (the area that opens it) +
 * `ContextMenuContent` with items.
 *
 * Drop-in for the legacy `@vuer-ai/vuer-uikit` ContextMenu (Radix). Reimplemented
 * on `@floating-ui/react`; the menu anchors to the cursor position.
 */
export function ContextMenu({ onOpenChange, children }: ContextMenuProps) {
  const [open, setOpenState] = useState(false);
  const setOpen = (o: boolean) => {
    setOpenState(o);
    onOpenChange?.(o);
  };

  // The menu is anchored to the cursor's viewport position, so page scrolling
  // would leave it stranded. Match the legacy Radix behaviour: lock body scroll
  // while open (compensating for the scrollbar width to avoid a layout shift).
  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const { body } = document;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [open]);

  const elementsRef = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "right-start",
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset({ mainAxis: 0, alignmentAxis: 4 }),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
    ],
  });

  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "menu" });
  const listNav = useListNavigation(context, {
    listRef: elementsRef,
    activeIndex,
    onNavigate: setActiveIndex,
    loop: true,
  });
  const { getFloatingProps, getItemProps } = useInteractions([
    dismiss,
    role,
    listNav,
  ]);

  const value = useMemo<MenuCtx>(
    () => ({
      open,
      setOpen,
      refs,
      floatingStyles,
      context,
      getFloatingProps,
      getItemProps,
      activeIndex,
      elementsRef,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      open,
      refs,
      floatingStyles,
      context,
      getFloatingProps,
      getItemProps,
      activeIndex,
    ],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export interface ContextMenuTriggerProps extends ComponentProps<"div"> {
  asChild?: boolean;
}
export function ContextMenuTrigger({
  asChild = false,
  children,
  onContextMenu,
  ...props
}: ContextMenuTriggerProps) {
  const ctx = useCtx("ContextMenuTrigger");
  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    // Anchor the floating menu to the cursor via a virtual reference element.
    ctx.refs.setPositionReference({
      getBoundingClientRect: () => ({
        width: 0,
        height: 0,
        x: e.clientX,
        y: e.clientY,
        top: e.clientY,
        right: e.clientX,
        bottom: e.clientY,
        left: e.clientX,
      }),
    });
    ctx.setOpen(true);
  };
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{
      onContextMenu?: (e: React.MouseEvent) => void;
    }>;
    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      onContextMenu: (e: React.MouseEvent) => {
        child.props.onContextMenu?.(e);
        handle(e);
      },
    });
  }
  return (
    <div
      onContextMenu={(e) => {
        onContextMenu?.(e);
        handle(e);
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export interface ContextMenuContentProps
  extends ComponentProps<"div">, LegacyOverlayContentProps {}
export function ContextMenuContent({
  className,
  children,
  style,
  ...props
}: ContextMenuContentProps) {
  const ctx = useCtx("ContextMenuContent");
  if (!ctx.open) return null;
  const rest = stripLegacyOverlayProps(props);
  return (
    <FloatingPortal>
      <FloatingFocusManager
        context={ctx.context}
        modal={false}
        initialFocus={-1}
      >
        <div
          ref={ctx.refs.setFloating as never}
          style={{ ...ctx.floatingStyles, ...style }}
          className={cn(
            "uikit-panel-in z-[200] min-w-[180px] rounded-[var(--radius)] p-1 font-uikit-ui",
            "bg-uikit-panel text-uikit-ink border border-uikit-faint shadow-uikit-soft outline-none",
            className,
          )}
          {...ctx.getFloatingProps(rest)}
        >
          <FloatingList elementsRef={ctx.elementsRef}>{children}</FloatingList>
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  );
}

const itemClass =
  "flex w-full items-center gap-2 rounded-uikit-badge px-2 py-1.5 text-uikit-12 leading-uikit-snug cursor-pointer select-none outline-none data-[active=true]:bg-uikit-ink-5 data-[danger=true]:text-uikit-tone-red disabled:opacity-50 disabled:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5";

export interface ContextMenuItemProps extends Omit<
  ComponentProps<"div">,
  "onSelect"
> {
  onSelect?: () => void;
  disabled?: boolean;
  /** Renders the item in the danger tone. */
  danger?: boolean;
  /** Drop-in alias for `danger`: `"destructive"` renders the danger tone. */
  variant?: "default" | "destructive";
  asChild?: boolean;
}
export function ContextMenuItem({
  className,
  onClick,
  onSelect,
  disabled,
  danger,
  variant,
  children,
  ...props
}: ContextMenuItemProps) {
  const isDanger = danger || variant === "destructive";
  const ctx = useCtx("ContextMenuItem");
  const { ref, index } = useListItem();
  const active = ctx.activeIndex === index;
  const itemProps = ctx.getItemProps({
    onClick: (e: React.MouseEvent) => {
      onClick?.(e as React.MouseEvent<HTMLDivElement>);
      onSelect?.();
      ctx.setOpen(false);
    },
  });
  return (
    <div
      ref={ref as never}
      role="menuitem"
      tabIndex={active ? 0 : -1}
      data-active={active}
      data-danger={isDanger || undefined}
      aria-disabled={disabled}
      className={cn(itemClass, className)}
      {...props}
      {...(disabled ? {} : itemProps)}
    >
      {children}
    </div>
  );
}

export function ContextMenuLabel({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "px-2 py-1 text-uikit-10 uppercase tracking-uikit-wide text-uikit-muted select-none",
        className,
      )}
      {...props}
    />
  );
}
export function ContextMenuSeparator({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      role="separator"
      className={cn("my-1 h-px bg-uikit-faint", className)}
      {...props}
    />
  );
}
export function ContextMenuGroup({
  className,
  ...props
}: ComponentProps<"div">) {
  return <div role="group" className={cn("py-0.5", className)} {...props} />;
}

/** Portal folded into Content; passthrough for drop-in. */
export function ContextMenuPortal({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

// Shortcut hint (right-aligned) for drop-in parity.
export function ContextMenuShortcut({
  className,
  ...props
}: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "ml-auto text-uikit-10 text-uikit-muted tracking-uikit-wide",
        className,
      )}
      {...props}
    />
  );
}
