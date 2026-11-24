import {
  Fragment,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { documentTabStyles } from "./documentTabStyles";
import {
  useDocumentTabScroll,
  revealDocumentTab,
} from "./useDocumentTabScroll";

export interface TabRowItem {
  value: string;
  /** Optional DOM identity for aria-labelledby on the controlled panel. */
  id?: string;
  label: string;
  /** Optional title rendering; label remains the accessible name. No interactive controls. */
  labelContent?: ReactNode;
  /** Optional visual beside the label, or in its place with iconOnly. */
  icon?: ReactNode;
  /** Compact icon tab; label remains the accessible name and default tooltip. */
  iconOnly?: boolean;
  /** Size this text tab to content, capped by preferredTabWidth. */
  fitContent?: boolean;
  /** Fixed control before the label, outside both its button and the sticky end. */
  leading?: ReactNode;
  /** Content beside the label button, such as a persistent reference action. */
  trailing?: ReactNode;
  title?: string;
  /** Description supplied by a shared tooltip when visible. */
  descriptionId?: string;
  /** Optional ID of the panel controlled by this tab. */
  panelId?: string;
  closable?: boolean;
  /** Hide the visual close when a host supplies one elsewhere; keyboard closing remains available. */
  closeButton?: boolean;
  /** Animate entry; callers own whether a tab is newly opened. */
  entering?: boolean;
  /** Start a new group: a thin divider precedes this tab. Ignored on the first tab. */
  groupStart?: boolean;
}

export interface TabRowProps {
  tabs: TabRowItem[];
  value: string;
  onValueChange: (value: string) => void;
  onClose?: (value: string) => void;
  /** Fixed controls before/after the scrolling tabs. */
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Width in CSS pixels at which compression stops and scrolling begins. */
  minTabWidth?: number;
  /** Rounded first edge beside workspace ground; curved keeps the document foot. */
  startEdge?: "curved" | "flush";
  /** Minimum label height in CSS pixels; use 44 for touch-oriented selectors. */
  minTabHeight?: number;
  /** Width in CSS pixels when enough room is available. */
  preferredTabWidth?: number;
  "aria-label"?: string;
  className?: string;
  style?: CSSProperties;
}

/** Controlled, closable document tabs. Tabs compress before overflowing. */
export function TabRow({
  tabs,
  value,
  onValueChange,
  onClose,
  leading,
  trailing,
  minTabWidth = 80,
  startEdge = "curved",
  preferredTabWidth = 170,
  minTabHeight,
  "aria-label": ariaLabel = "Open documents",
  className,
  style,
}: TabRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useDocumentTabScroll(scrollRef);
  const minimum = Number.isFinite(minTabWidth) ? Math.max(48, minTabWidth) : 80;
  const preferred = Number.isFinite(preferredTabWidth)
    ? Math.max(minimum, preferredTabWidth)
    : Math.max(minimum, 170);
  useEffect(() => {
    const tab = scrollRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.closest<HTMLElement>(".uikit-tab-row-item");
    if (!tab) return;
    revealDocumentTab(scrollRef.current!, tab, true);
  }, [value, tabs.length]);
  useEffect(() => {
    const area = scrollRef.current;
    if (!area || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      // A pinned active tab must not occupy the entire touch viewport and
      // cover every sibling. Keep the usual stack when two minimum slots fit.
      area.toggleAttribute(
        "data-tab-linear",
        area.clientWidth > 0 && area.clientWidth < minimum * 2 + 16,
      );
      const tab = area
        .querySelector('[aria-selected="true"]')
        ?.closest<HTMLElement>(".uikit-tab-row-item");
      if (!tab) return;
      revealDocumentTab(area, tab);
    });
    observer.observe(area);
    return () => observer.disconnect();
  }, [minimum]);

  return (
    // `data-tab-count`: a host may draw a lone tab differently from a strip
    // (a full-width head instead of a tab shape) without counting the DOM.
    <div
      className={cn("uikit-tab-row", className)}
      data-tab-count={tabs.length}
      data-document-tab-edge={startEdge}
      style={
        {
          "--uikit-document-tab-height": `${Math.max(26, (minTabHeight ?? 0) + 2)}px`,
          "--uikit-document-control-height":
            "calc(var(--uikit-document-tab-height) - 2 * var(--uikit-document-inactive-inset, 2px))",
          ...style,
          "--tab-row-min-height":
            minTabHeight == null ? undefined : `${Math.max(0, minTabHeight)}px`,
          "--tab-row-min-width": `${minimum}px`,
          "--tab-row-preferred-width": `${preferred}px`,
        } as CSSProperties
      }
    >
      <div className="uikit-tab-row-line" aria-hidden />
      {leading != null && (
        <div className="uikit-tab-row-controls">{leading}</div>
      )}
      <div
        className="uikit-tab-row-scroll uikit-document-tab-strip"
        ref={scrollRef}
        role={tabs.length ? "tablist" : undefined}
        aria-label={tabs.length ? ariaLabel : undefined}
      >
        {tabs.map((tab, index) => {
          const hasIcon = tab.icon != null && typeof tab.icon !== "boolean";
          const iconOnly = !!tab.iconOnly && hasIcon;
          const iconWidth =
            onClose &&
            tab.value === value &&
            tab.closable !== false &&
            tab.closeButton !== false
              ? 54
              : 32;
          return (
            <Fragment key={tab.value}>
              {tab.groupStart && index > 0 && (
                <span className="uikit-tab-row-divider" aria-hidden />
              )}
              <div
                className="uikit-tab-row-item uikit-document-tab"
                role="presentation"
                data-active={tab.value === value || undefined}
                data-enter={tab.entering || undefined}
                data-icon-only={iconOnly || undefined}
                data-fit-content={tab.fitContent || undefined}
                style={
                  iconOnly
                    ? ({
                        "--tab-row-min-width": `${iconWidth}px`,
                        "--tab-row-preferred-width": `${iconWidth}px`,
                      } as CSSProperties)
                    : undefined
                }
              >
                {tab.leading != null && (
                  <span className="uikit-tab-row-item-leading">
                    {tab.leading}
                  </span>
                )}
                <button
                  id={tab.id}
                  type="button"
                  role="tab"
                  className="uikit-tab-row-item-label uikit-document-tab-label"
                  aria-label={
                    iconOnly || tab.labelContent != null ? tab.label : undefined
                  }
                  aria-selected={tab.value === value}
                  aria-controls={tab.panelId}
                  aria-describedby={tab.descriptionId}
                  tabIndex={
                    tab.value === value ||
                    (!tabs.some((t) => t.value === value) && index === 0)
                      ? 0
                      : -1
                  }
                  title={
                    tab.title ??
                    (tab.labelContent == null ? tab.label : undefined)
                  }
                  onClick={() => onValueChange(tab.value)}
                  onAuxClick={(event) => {
                    if (
                      event.button === 1 &&
                      onClose &&
                      tab.closable !== false
                    ) {
                      event.preventDefault();
                      onClose(tab.value);
                    }
                  }}
                  onKeyDown={(event) => {
                    let next: number;
                    if (event.key === "ArrowRight")
                      next = (index + 1) % tabs.length;
                    else if (event.key === "ArrowLeft")
                      next = (index - 1 + tabs.length) % tabs.length;
                    else if (event.key === "Home") next = 0;
                    else if (event.key === "End") next = tabs.length - 1;
                    else if (
                      event.key === "Delete" &&
                      onClose &&
                      tab.closable !== false
                    ) {
                      event.preventDefault();
                      onClose(tab.value);
                      return;
                    } else return;
                    event.preventDefault();
                    scrollRef.current
                      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                      [next]?.focus({ preventScroll: true });
                    onValueChange(tabs[next].value);
                  }}
                >
                  {hasIcon && (
                    <span className="uikit-tab-row-item-icon" aria-hidden>
                      {tab.icon}
                    </span>
                  )}
                  {!iconOnly && (tab.labelContent ?? tab.label)}
                </button>
                <span className="uikit-document-tab-end">
                  {tab.trailing != null && (
                    <span className="uikit-tab-row-item-trailing">
                      {tab.trailing}
                    </span>
                  )}
                  {onClose &&
                    tab.value === value &&
                    tab.closable !== false &&
                    tab.closeButton !== false && (
                      <button
                        type="button"
                        className="uikit-tab-row-item-x uikit-document-tab-close"
                        aria-label={`Close ${tab.label}`}
                        title="Close tab"
                        onClick={() => onClose(tab.value)}
                      >
                        <X size={10} strokeWidth={2.5} />
                      </button>
                    )}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>
      {trailing != null && (
        <div className="uikit-tab-row-controls">{trailing}</div>
      )}
      <style>{CSS + documentTabStyles}</style>
    </div>
  );
}

const RED = "oklch(59% .18 25)";
const OPEN = "160ms cubic-bezier(.2,.7,.3,1)";
const CSS =
  ".uikit-tab-row-item-leading{display:inline-flex;align-items:center;flex:none}" +
  ".uikit-tab-row-item-trailing{display:inline-flex;align-items:center;flex:none;margin-right:0}" +
  ".uikit-tab-row-item-icon{display:inline-flex;vertical-align:middle;margin-right:6px}" +
  ".uikit-tab-row-item[data-icon-only]{flex-shrink:0}" +
  ".uikit-tab-row-item[data-icon-only] .uikit-tab-row-item-icon{margin-right:0}" +
  ".uikit-tab-row{-webkit-user-select:none;user-select:none;position:relative;display:flex;align-items:flex-end;gap:4px;width:100%;min-width:0}" +
  ".uikit-tab-row-line{display:none}" +
  // The 4px spacer sits above the controls: the row keeps its height, and
  // controls leave the same lower inset as inactive tab fills. Their complete
  // box matches that fill instead of exceeding the tab face.
  ".uikit-tab-row-controls{position:relative;z-index:1;flex:0 0 auto;margin-top:4px;margin-bottom:var(--uikit-document-inactive-inset,2px);display:flex;align-items:center;gap:2px}" +
  ".uikit-tab-row-compact .uikit-tab-row-controls{margin-top:0;margin-bottom:0;align-self:center}" +
  ".uikit-tab-row-item:focus-within .uikit-tab-row-item-x{width:16px;margin-right:0;opacity:.55}" +
  ".uikit-tab-row-item button:focus-visible{outline:2px solid var(--uikit-accent);outline-offset:-2px}" +
  ".uikit-tab-row-scroll{position:relative;z-index:1;display:flex;align-items:flex-end;gap:2px;" +
  "flex:1;min-width:0;overflow-x:auto;scrollbar-width:none}" +
  ".uikit-tab-row:has([data-panel-header-spread]) > .uikit-tab-row-scroll{flex:0 1 auto}" +
  ".uikit-tab-row-controls:has([data-panel-header-spread]){flex:1 0 auto}" +
  ".uikit-tab-row-controls:has([data-panel-header-spread]) > *{width:100%}" +
  ".uikit-tab-row-scroll::-webkit-scrollbar{display:none}" +
  ".uikit-tab-row-scroll[data-tab-linear] > .uikit-document-tab{position:relative;left:auto}" +
  ".uikit-tab-row-divider{flex:none;align-self:center;width:1px;height:14px;margin:0 4px;background:var(--faint)}" +
  ".uikit-tab-row-item{display:flex;align-items:center;flex:0 1 var(--tab-row-preferred-width);overflow:visible;" +
  "box-sizing:border-box;min-width:var(--tab-row-min-width);max-width:var(--tab-row-preferred-width);" +
  "border:1px solid transparent;transition:background 120ms ease}" +
  ".uikit-tab-row-item[data-fit-content]:not([data-icon-only]){flex:0 0 auto;min-width:0;max-width:var(--tab-row-preferred-width)}" +
  "@keyframes uikit-tab-row-item-in{from{min-width:0;max-width:0;opacity:0;transform:translateY(3px)}" +
  "to{min-width:var(--tab-row-min-width);max-width:var(--tab-row-preferred-width);opacity:1;transform:none}}" +
  ".uikit-tab-row-item[data-enter]{animation:uikit-tab-row-item-in 220ms cubic-bezier(.2,.7,.3,1)}" +
  "@media (prefers-reduced-motion:reduce){.uikit-tab-row-item[data-enter]{animation:none}}" +
  ".uikit-tab-row-item-label{font-family:var(--font-uikit-mono, monospace);font-size:11px;font-weight:500;letter-spacing:-.005em;" +
  "border:0;background:transparent;cursor:pointer;padding:6px 10px;flex:1;min-width:0;min-height:var(--tab-row-min-height,0px);text-align:left;" +
  "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--uikit-muted);opacity:.6;" +
  `transition:color 120ms ease,opacity 120ms ease,padding-right ${OPEN}}` +
  // Label padding is constant in every state; end controls own their space.
  // In particular, fitted non-closable tabs must not shift siblings on hover.
  ".uikit-tab-row-item[data-icon-only] .uikit-tab-row-item-label{display:flex;align-items:center;justify-content:center;padding:6px}" +
  ".uikit-tab-row-item:hover .uikit-tab-row-item-label{opacity:1}" +
  ".uikit-tab-row-item[data-active] .uikit-tab-row-item-label{color:var(--ink);opacity:1;font-weight:600}" +
  ".uikit-tab-row-item-x{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;" +
  "box-sizing:border-box;border:0;padding:0;background:transparent;cursor:pointer;" +
  "color:var(--uikit-muted);border-radius:4px;width:16px;margin-right:0;opacity:.55;overflow:hidden;" +
  `transition:width ${OPEN},margin-right ${OPEN},opacity 120ms ease,color 120ms ease}` +
  ".uikit-tab-row-item:hover .uikit-tab-row-item-x,.uikit-tab-row-item[data-active] .uikit-tab-row-item-x" +
  "{width:16px;margin-right:0;opacity:.55}" +
  `.uikit-tab-row-item:hover .uikit-tab-row-item-x:hover,.uikit-tab-row-item[data-active] .uikit-tab-row-item-x:hover` +
  `{opacity:1;color:${RED}}` +
  `.uikit-tab-row-item:has(.uikit-tab-row-item-x:hover) .uikit-tab-row-item-label{color:${RED};opacity:1;` +
  `text-decoration:line-through;text-decoration-color:${RED};text-decoration-thickness:1px}`;
