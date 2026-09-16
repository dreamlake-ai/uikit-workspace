import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface TabRowItem {
  value: string;
  label: string;
  title?: string;
  /** Optional ID of the panel controlled by this tab. */
  panelId?: string;
  closable?: boolean;
  /** Animate entry; callers own whether a tab is newly opened. */
  entering?: boolean;
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
  /** Width in CSS pixels when enough room is available. */
  preferredTabWidth?: number;
  "aria-label"?: string;
  className?: string;
  style?: CSSProperties;
}

/** Controlled, closable document tabs. Tabs compress before overflowing. */
export function TabRow({
  tabs, value, onValueChange, onClose, leading, trailing,
  minTabWidth = 80, preferredTabWidth = 170,
  "aria-label": ariaLabel = "Open documents", className, style,
}: TabRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const minimum = Number.isFinite(minTabWidth) ? Math.max(48, minTabWidth) : 80;
  const preferred = Number.isFinite(preferredTabWidth) ? Math.max(minimum, preferredTabWidth) : Math.max(minimum, 170);
  useEffect(() => {
    scrollRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({
      inline: "nearest", block: "nearest", behavior: "smooth",
    });
  }, [value, tabs.length]);

  return (
    <div className={cn("uikit-tab-row", className)} style={{
      ...style,
      "--tab-row-min-width": `${minimum}px`,
      "--tab-row-preferred-width": `${preferred}px`,
    } as CSSProperties}>
      <div className="uikit-tab-row-line" aria-hidden />
      {leading != null && <div className="uikit-tab-row-controls">{leading}</div>}
      <div className="uikit-tab-row-scroll" ref={scrollRef} role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab, index) => (
          <div key={tab.value} className="uikit-tab-row-item" role="presentation"
            data-active={tab.value === value || undefined} data-enter={tab.entering || undefined}>
            <button type="button" role="tab" className="uikit-tab-row-item-label"
              aria-selected={tab.value === value} aria-controls={tab.panelId}
              tabIndex={tab.value === value || (!tabs.some(t => t.value === value) && index === 0) ? 0 : -1}
              title={tab.title ?? tab.label} onClick={() => onValueChange(tab.value)}
              onAuxClick={event => {
                if (event.button === 1 && onClose && tab.closable !== false) {
                  event.preventDefault(); onClose(tab.value);
                }
              }}
              onKeyDown={event => {
                let next: number;
                if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
                else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = tabs.length - 1;
                else if (event.key === "Delete" && onClose && tab.closable !== false) {
                  event.preventDefault(); onClose(tab.value); return;
                } else return;
                event.preventDefault();
                scrollRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
                onValueChange(tabs[next].value);
              }}>
              {tab.label}
            </button>
            {onClose && tab.closable !== false && <button type="button"
              className="uikit-tab-row-item-x" aria-label={`Close ${tab.label}`}
              title="Close tab" onClick={() => onClose(tab.value)}>
              <X size={10} strokeWidth={3} />
            </button>}
          </div>
        ))}
      </div>
      {trailing != null && <div className="uikit-tab-row-controls">{trailing}</div>}
      <style>{CSS}</style>
    </div>
  );
}

const RED = "oklch(59% .18 25)";
const OPEN = "160ms cubic-bezier(.2,.7,.3,1)";
const CSS =
  '.uikit-tab-row{position:relative;display:flex;align-items:flex-end;gap:6px;width:100%;min-width:0}' +
  '.uikit-tab-row-line{position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--faint);z-index:0}' +
  '.uikit-tab-row-controls{position:relative;z-index:1;flex:0 0 auto;margin-bottom:4px;display:flex;align-items:center;gap:2px}' +
  '.uikit-tab-row-item:focus-within .uikit-tab-row-item-x{width:16px;margin-right:5px;opacity:.55}' +
  '.uikit-tab-row-item button:focus-visible{outline:2px solid var(--uikit-accent);outline-offset:-2px}' +
  '.uikit-tab-row-scroll{position:relative;z-index:1;display:flex;align-items:flex-end;gap:2px;' +
  'flex:1;min-width:0;overflow-x:auto;scrollbar-width:none}' +
  '.uikit-tab-row-scroll::-webkit-scrollbar{display:none}' +
  '.uikit-tab-row-item{display:flex;align-items:center;flex:0 1 var(--tab-row-preferred-width);overflow:hidden;' +
  'box-sizing:border-box;min-width:var(--tab-row-min-width);max-width:var(--tab-row-preferred-width);' +
  'border:1px solid transparent;border-radius:8px 8px 0 0;transition:background 120ms ease}' +
  '@keyframes uikit-tab-row-item-in{from{min-width:0;max-width:0;opacity:0;transform:translateY(3px)}' +
  'to{min-width:var(--tab-row-min-width);max-width:var(--tab-row-preferred-width);opacity:1;transform:none}}' +
  '.uikit-tab-row-item[data-enter]{animation:uikit-tab-row-item-in 220ms cubic-bezier(.2,.7,.3,1)}' +
  '@media (prefers-reduced-motion:reduce){.uikit-tab-row-item[data-enter]{animation:none}}' +
  '.uikit-tab-row-item:not([data-active]):hover{background:color-mix(in srgb,var(--ink) 5%,transparent)}' +
  '.uikit-tab-row-item[data-active]{background:var(--bg);border-color:var(--faint);' +
  'border-bottom-color:var(--bg)}' +
  '.uikit-tab-row-item-label{font-family:var(--font-uikit-mono, monospace);font-size:11px;font-weight:500;letter-spacing:-.005em;' +
  'border:0;background:transparent;cursor:pointer;padding:6px 10px;flex:1;min-width:0;text-align:left;' +
  'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--uikit-muted);opacity:.6;' +
  `transition:color 120ms ease,opacity 120ms ease,padding-right ${OPEN}}` +
  `.uikit-tab-row-item:hover .uikit-tab-row-item-label,.uikit-tab-row-item[data-active] .uikit-tab-row-item-label` +
  '{padding-right:4px}' +
  '.uikit-tab-row-item:hover .uikit-tab-row-item-label{opacity:1}' +
  '.uikit-tab-row-item[data-active] .uikit-tab-row-item-label{color:var(--ink);opacity:1;font-weight:600}' +
  '.uikit-tab-row-item-x{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;' +
  'box-sizing:border-box;border:0;padding:0;background:transparent;cursor:pointer;' +
  'color:var(--uikit-muted);border-radius:4px;width:0;margin-right:0;opacity:0;overflow:hidden;' +
  `transition:width ${OPEN},margin-right ${OPEN},opacity 120ms ease,color 120ms ease}` +
  '.uikit-tab-row-item:hover .uikit-tab-row-item-x,.uikit-tab-row-item[data-active] .uikit-tab-row-item-x' +
  '{width:16px;margin-right:5px;opacity:.55}' +
  `.uikit-tab-row-item:hover .uikit-tab-row-item-x:hover,.uikit-tab-row-item[data-active] .uikit-tab-row-item-x:hover` +
  `{opacity:1;color:${RED}}` +
  `.uikit-tab-row-item:has(.uikit-tab-row-item-x:hover) .uikit-tab-row-item-label{color:${RED};opacity:1;` +
  `text-decoration:line-through;text-decoration-color:${RED};text-decoration-thickness:1px}`;
