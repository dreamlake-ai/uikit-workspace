import {
  Children,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  type Ref,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
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
  size as sizeMiddleware,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListItem,
  useListNavigation,
  useRole,
  useTypeahead,
} from "@floating-ui/react";
import { cn } from "../../lib/utils";
import {
  type LegacyOverlayContentProps,
  stripLegacyOverlayProps,
} from "../../lib/legacy-overlay-props";
import { ChevronDown } from "lucide-react";

function mergeRefs<T>(
  ...refs: (Ref<T> | undefined | ((n: T | null) => void))[]
) {
  return (node: T | null) => {
    for (const r of refs) {
      if (typeof r === "function") r(node);
      else if (r) (r as { current: T | null }).current = node;
    }
  };
}

interface SelectContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string | undefined;
  setValue: (value: string) => void;
  labelMap: Map<string, ReactNode>;
  refs: ReturnType<typeof useFloating>["refs"];
  floatingStyles: ReturnType<typeof useFloating>["floatingStyles"];
  context: ReturnType<typeof useFloating>["context"];
  getReferenceProps: (p?: Record<string, unknown>) => Record<string, unknown>;
  getFloatingProps: (p?: Record<string, unknown>) => Record<string, unknown>;
  getItemProps: (p?: Record<string, unknown>) => Record<string, unknown>;
  activeIndex: number | null;
  elementsRef: React.MutableRefObject<Array<HTMLElement | null>>;
  labelsRef: React.MutableRefObject<Array<string | null>>;
}
const SelectContext = createContext<SelectContextValue | null>(null);
function useSelectContext(name: string) {
  const c = useContext(SelectContext);
  if (!c) throw new Error(`<${name}> must be used inside <Select>`);
  return c;
}

/** Walk the children tree (through SelectGroups) collecting value → label so the
 *  trigger can show the current selection even while the panel — and its
 *  items — are unmounted. */
function collectLabels(children: ReactNode, map: Map<string, ReactNode>) {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const el = child as ReactElement<{ value?: string; children?: ReactNode }>;
    if (el.type === SelectItem && el.props.value != null) {
      map.set(el.props.value, el.props.children);
    } else if (el.props?.children) {
      collectLabels(el.props.children, map);
    }
  });
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Accepted for drop-in parity (currently cosmetic). */
  disabled?: boolean;
  name?: string;
  font?: string;
  children: ReactNode;
}

/**
 * Compound single-select. Compose `SelectTrigger` (with `SelectValue`) +
 * `SelectContent` containing `SelectItem`s (optionally grouped with
 * `SelectGroup` / `SelectLabel`).
 *
 * Drop-in for the legacy `@vuer-ai/vuer-uikit` Select (Radix), styled like the
 * kit's compact mono picker. Positioning, keyboard list navigation and typeahead
 * come from `@floating-ui/react`; the panel matches the trigger width.
 */
export function Select({
  value: controlledValue,
  defaultValue,
  onValueChange,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState<
    string | undefined
  >(defaultValue);
  const isValueControlled = controlledValue !== undefined;
  const value = isValueControlled ? controlledValue : uncontrolledValue;
  const setValue = (v: string) => {
    if (!isValueControlled) setUncontrolledValue(v);
    onValueChange?.(v);
  };

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpenControlled = controlledOpen !== undefined;
  const open = isOpenControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (o: boolean) => {
    if (!isOpenControlled) setUncontrolledOpen(o);
    onOpenChange?.(o);
  };

  const labelMap = useMemo(() => {
    const m = new Map<string, ReactNode>();
    collectLabels(children, m);
    return m;
  }, [children]);

  const elementsRef = useRef<Array<HTMLElement | null>>([]);
  const labelsRef = useRef<Array<string | null>>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-start",
    // Position via top/left, not transform — the panel's `uikit-panel-in`
    // entrance animation owns `transform`.
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      sizeMiddleware({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
          });
        },
      }),
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "listbox" });
  const listNav = useListNavigation(context, {
    listRef: elementsRef,
    activeIndex,
    onNavigate: setActiveIndex,
    loop: true,
  });
  const typeahead = useTypeahead(context, {
    listRef: labelsRef,
    activeIndex,
    onMatch: open ? setActiveIndex : undefined,
  });
  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [click, dismiss, role, listNav, typeahead],
  );

  const ctx = useMemo<SelectContextValue>(
    () => ({
      open,
      setOpen,
      value,
      setValue,
      labelMap,
      refs,
      floatingStyles,
      context,
      getReferenceProps,
      getFloatingProps,
      getItemProps,
      activeIndex,
      elementsRef,
      labelsRef,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      open,
      value,
      labelMap,
      refs,
      floatingStyles,
      context,
      getReferenceProps,
      getFloatingProps,
      getItemProps,
      activeIndex,
    ],
  );

  return (
    <SelectContext.Provider value={ctx}>{children}</SelectContext.Provider>
  );
}

export interface SelectTriggerProps extends ComponentProps<"button"> {
  asChild?: boolean;
  /** Leading icon rendered before the value. */
  icon?: ReactNode;
  /** Accepted for drop-in parity (cosmetic). */
  size?: "sm" | "md" | "lg";
}
/** Compact mono trigger (matches the kit's original Select look). */
export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  function SelectTrigger(
    { asChild = false, className, children, icon, size: _size, ...props },
    ref,
  ) {
    const ctx = useSelectContext("SelectTrigger");
    const setRef = mergeRefs<HTMLButtonElement>(ctx.refs.setReference, ref);
    const refProps = ctx.getReferenceProps({
      ...props,
      "data-state": ctx.open ? "open" : "closed",
    });
    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<Record<string, unknown>>;
      return cloneElement(child, { ref: setRef, ...refProps });
    }
    return (
      <button
        ref={setRef}
        type="button"
        className={cn(
          "group inline-flex w-fit items-center gap-1 cursor-pointer outline-none",
          "font-uikit-mono text-uikit-11 font-medium tracking-uikit-snug",
          // Muted at rest, ink on hover and while open. A dropdown trigger is
          // a secondary control — a sort order, an account menu — and full ink
          // put the sort value at nearly the weight of the row titles under
          // it. The darkening is also the only hover this trigger has ever
          // had: an opacity nudge alone was not visible on a muted colour.
          "text-uikit-muted opacity-85",
          "hover:text-uikit-ink hover:opacity-100",
          "data-[state=open]:text-uikit-ink data-[state=open]:opacity-100",
          "transition-[color,opacity] duration-[140ms]",
          className,
        )}
        {...refProps}
      >
        {icon && (
          <span className="inline-flex shrink-0 opacity-65">{icon}</span>
        )}
        {children}
        {/* lucide's chevron, not a "▾" glyph: every other dropdown affordance in
            consuming apps is the icon at this size, and a text caret sits on
            the font's baseline rather than optically centred with the label.

            It turns over while the panel is open, and the turn is ANIMATED
            from an inline style rather than a utility class. This was a hard
            flip for a reason worth writing down: neither `transition-transform`
            nor `transition-[rotate]` reaches this element in a consuming app's
            Tailwind build, so `group-data-[state=open]:rotate-180` snapped.
            An inline `transform` + `transition` needs no build step to reach
            it, and `ctx.open` is already the state the class was reading. */}
        <ChevronDown
          size={13}
          className="ml-0.5 shrink-0 opacity-55"
          style={{
            transform: ctx.open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 220ms cubic-bezier(.32, .72, 0, 1)",
          }}
        />
      </button>
    );
  },
);

export interface SelectValueProps {
  placeholder?: ReactNode;
  className?: string;
}
export function SelectValue({ placeholder, className }: SelectValueProps) {
  const ctx = useSelectContext("SelectValue");
  const display =
    ctx.value !== undefined ? ctx.labelMap.get(ctx.value) : undefined;
  const has = display != null;
  return (
    <span className={cn("truncate", !has && "opacity-65", className)}>
      {has ? display : placeholder}
    </span>
  );
}

export interface SelectContentProps
  extends ComponentProps<"div">, LegacyOverlayContentProps {}
export function SelectContent({
  className,
  children,
  style,
  ...props
}: SelectContentProps) {
  const ctx = useSelectContext("SelectContent");
  if (!ctx.open) return null;
  const rest = stripLegacyOverlayProps(props);
  return (
    <FloatingPortal>
      <FloatingFocusManager context={ctx.context} modal={false}>
        <div
          ref={ctx.refs.setFloating as never}
          style={{ ...ctx.floatingStyles, ...style }}
          className={cn(
            // A flex column so the rows do not touch. Each row paints its own rounded
            // fill on hover and when selected, and two of those meeting edge to edge
            // read as one shape rather than two rows.
            "uikit-panel-in z-[200] min-w-[140px] max-h-[min(60vh,320px)] overflow-y-auto rounded-[var(--radius)] p-1 font-uikit-ui",
            "flex flex-col gap-px",
            "bg-uikit-bg shadow-uikit-soft outline-none",
            className,
          )}
          {...ctx.getFloatingProps(rest)}
        >
          <FloatingList elementsRef={ctx.elementsRef} labelsRef={ctx.labelsRef}>
            {children}
          </FloatingList>
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  );
}

export interface SelectItemProps extends Omit<
  ComponentProps<"div">,
  "onSelect"
> {
  value: string;
  disabled?: boolean;
}
export function SelectItem({
  className,
  value,
  disabled,
  children,
  ...props
}: SelectItemProps) {
  const ctx = useSelectContext("SelectItem");
  const text = typeof children === "string" ? children : value;
  const { ref, index } = useListItem({ label: disabled ? null : text });
  const active = ctx.activeIndex === index;
  const selected = ctx.value === value;

  const itemProps = ctx.getItemProps({
    onClick: () => {
      if (disabled) return;
      ctx.setValue(value);
      ctx.setOpen(false);
    },
  });

  return (
    <div
      ref={ref as never}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled}
      tabIndex={active ? 0 : -1}
      data-active={active}
      data-selected={selected}
      className={cn(
        // rounded-uikit-badge, like every other menu row in the kit (MenuItem,
        // DropdownMenuItem, ContextMenuItem). This was the one row at
        // var(--radius) — the PANEL radius — so its fill read as a pill.
        // Row metrics follow the type, and the type follows the TRIGGER:
        // text-uikit-11, the size SelectTrigger sets. The panel used to run at
        // 12.5px, so the open list read a size larger than the control that
        // opened it — the one place in a picker where the two must agree.
        "cursor-pointer rounded-uikit-badge px-2.5 py-[6px] leading-[14px] outline-none select-none",
        "font-uikit-mono text-uikit-11 font-medium tracking-uikit-snug",
        "transition-[background-color,color] duration-[120ms]",
        "bg-transparent text-uikit-muted opacity-85 hover:bg-uikit-ink-4",
        "data-[active=true]:bg-uikit-ink-4",
        // The selected row is accent-tinted, the treatment consuming apps already
        // use for "this is the one you are on" (the account switcher and the
        // version/run pickers that mirror it). ink-5 read as another hover.
        "data-[selected=true]:bg-uikit-accent-soft data-[selected=true]:text-uikit-ink data-[selected=true]:opacity-100",
        "aria-disabled:opacity-50 aria-disabled:pointer-events-none",
        className,
      )}
      {...props}
      {...(disabled ? {} : itemProps)}
    >
      {children}
    </div>
  );
}

export function SelectGroup({ className, ...props }: ComponentProps<"div">) {
  return <div role="group" className={cn("py-0.5", className)} {...props} />;
}

export function SelectLabel({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "px-3.5 py-1 font-uikit-mono text-uikit-10 uppercase tracking-uikit-wide text-uikit-muted opacity-70 select-none",
        className,
      )}
      {...props}
    />
  );
}
