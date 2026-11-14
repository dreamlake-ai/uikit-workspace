import { useEffect, useId, useRef, useState } from "react";
import { ArrowDownLeft, Plus } from "lucide-react";
import { Button, TabRow } from "@dreamlake/uikit";

/** Interaction specimens on the existing TabRow; shared defaults are unchanged. */
function EdgeExample({
  edge,
  crowded = false,
}: {
  edge: "smooth" | "straight";
  crowded?: boolean;
}) {
  const id = useId();
  const initial = [
    "Chat session",
    "Design memo",
    "Terminal",
    "Review feedback",
    "Project notes",
    "Compute results",
    "Release checklist",
  ];
  const [tabs, setTabs] = useState(
    initial
      .slice(0, crowded ? 7 : 3)
      .map((label, i) => ({ value: String(i), label })),
  );
  const [active, setActive] = useState("0");
  const [overflow, setOverflow] = useState(false);
  const [tip, setTip] = useState<{ label: string; left: number } | null>(null);
  const [grabbed, setGrabbed] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const host = useRef<HTMLDivElement>(null);
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismiss = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointer = useRef<{
    id: number;
    value: string;
    x: number;
    y: number;
    grabbed: boolean;
    target: HTMLElement;
  } | null>(null);
  const suppressClick = useRef(false);
  const touchActive = useRef(false);
  const tipActive = useRef(false);
  const point = useRef({ x: 0, touch: false });
  const hideTip = () => {
    tipActive.current = false;
    setTip(null);
  };
  const scheduleDismiss = () => {
    if (dismiss.current) clearTimeout(dismiss.current);
    if (!touchActive.current) dismiss.current = setTimeout(hideTip, 1000);
  };
  const nextId = useRef(10);
  const selected = tabs.find((tab) => tab.value === active);
  const cancelHold = () => {
    if (hold.current) clearTimeout(hold.current);
    hold.current = null;
  };
  const showTip = (element: HTMLElement, touch: boolean) => {
    if (dismiss.current) clearTimeout(dismiss.current);
    const box = element.getBoundingClientRect();
    const area = host.current!.getBoundingClientRect();
    tipActive.current = true;
    setTip({
      label: element.title || element.textContent || "Session",
      left: Math.max(0, Math.min(box.left - area.left, area.width - 180)),
    });
    if (touch) scheduleDismiss();
  };
  useEffect(() => {
    const root = host.current;
    const scroll = root?.querySelector<HTMLElement>(".uikit-tab-row-scroll");
    if (!root || !scroll) return;
    const measure = () =>
      setOverflow(scroll.scrollWidth > scroll.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(scroll);
    measure();
    const wheel = (event: WheelEvent) => {
      if (!event.deltaY || Math.abs(event.deltaX) >= Math.abs(event.deltaY))
        return;
      const delta =
        event.deltaY *
        (event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? scroll.clientWidth
            : 1);
      const before = scroll.scrollLeft;
      scroll.scrollLeft += delta;
      if (scroll.scrollLeft !== before) event.preventDefault();
    };
    const followScroll = () => {
      if (!tipActive.current || pointer.current?.grabbed) return;
      const bounds = scroll.getBoundingClientRect();
      const x = Math.max(
        bounds.left + 1,
        Math.min(point.current.x, bounds.right - 1),
      );
      const candidates = Array.from(
        scroll.querySelectorAll<HTMLElement>('[role="tab"]'),
      );
      const visible = candidates.filter((element) => {
        const box = element.getBoundingClientRect();
        return box.right > bounds.left && box.left < bounds.right;
      });
      const target = visible.reduce<HTMLElement | null>((best, element) => {
        const box = element.getBoundingClientRect();
        const distance = Math.abs((box.left + box.right) / 2 - x);
        if (!best) return element;
        const previous = best.getBoundingClientRect();
        return distance < Math.abs((previous.left + previous.right) / 2 - x)
          ? element
          : best;
      }, null);
      if (target) showTip(target, point.current.touch);
    };
    const touchMove = (event: TouchEvent) => {
      if (pointer.current?.grabbed) {
        event.preventDefault();
        return;
      }
      if (event.touches[0])
        point.current = { x: event.touches[0].clientX, touch: true };
      if (dismiss.current) clearTimeout(dismiss.current);
    };
    scroll.addEventListener("scroll", followScroll);
    root.addEventListener("wheel", wheel, { passive: false });
    root.addEventListener("touchmove", touchMove, { passive: false });
    return () => {
      observer.disconnect();
      root.removeEventListener("wheel", wheel);
      root.removeEventListener("touchmove", touchMove);
      scroll.removeEventListener("scroll", followScroll);
    };
  }, [tabs.length]);
  useEffect(
    () => () => {
      cancelHold();
      if (dismiss.current) clearTimeout(dismiss.current);
    },
    [],
  );

  return (
    <section
      className="dl-tab-edge-example"
      data-tab-edge={edge}
      data-tab-density={crowded ? "crowded" : "roomy"}
      aria-label={`${edge} ${crowded ? "crowded" : "roomy"} tabs`}
    >
      <p className="dl-tab-edge-label">
        {edge === "smooth" ? "Smooth left edge" : "Straight left edge"} ·{" "}
        {crowded ? "crowded" : "roomy"}
      </p>
      <div className="dl-tab-edge-panel">
        <div
          ref={host}
          className="dl-tab-edge-header"
          data-overflow={overflow || undefined}
          data-grabbed={grabbed || undefined}
          onPointerOver={(event) => {
            const tab = (event.target as HTMLElement).closest<HTMLElement>(
              '[role="tab"]',
            );
            point.current = {
              x: event.clientX,
              touch: event.pointerType === "touch",
            };
            if (tab && event.pointerType !== "touch") showTip(tab, false);
          }}
          onPointerLeave={(event) => {
            if (event.pointerType !== "touch" && !pointer.current?.grabbed)
              hideTip();
          }}
          onTouchStartCapture={() => {
            touchActive.current = true;
            if (dismiss.current) clearTimeout(dismiss.current);
          }}
          onTouchEndCapture={() => {
            touchActive.current = false;
            scheduleDismiss();
          }}
          onTouchCancel={() => {
            touchActive.current = false;
            scheduleDismiss();
          }}
          onFocusCapture={(event) => {
            if ((event.target as HTMLElement).matches('[role="tab"]'))
              showTip(event.target as HTMLElement, false);
          }}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node))
              setTip(null);
          }}
          onKeyDownCapture={(event) => {
            if (event.key === "Escape") {
              cancelHold();
              pointer.current = null;
              setGrabbed(null);
              hideTip();
            }
          }}
          onPointerDownCapture={(event) => {
            const tab = (event.target as HTMLElement).closest<HTMLElement>(
              '[role="tab"]',
            );
            if (!tab || event.button !== 0) return;
            suppressClick.current = false;
            const index = Array.from(
              host.current!.querySelectorAll('[role="tab"]'),
            ).indexOf(tab);
            const value = tabs[index]?.value;
            if (value == null) return;
            point.current = {
              x: event.clientX,
              touch: event.pointerType === "touch",
            };
            if (event.pointerType === "touch") {
              touchActive.current = true;
              showTip(tab, true);
            }
            pointer.current = {
              id: event.pointerId,
              value,
              x: event.clientX,
              y: event.clientY,
              grabbed: false,
              target: tab,
            };
            cancelHold();
            hold.current = setTimeout(
              () => {
                const current = pointer.current;
                if (!current) return;
                current.grabbed = true;
                current.target.setPointerCapture(current.id);
                setGrabbed(current.value);
                hideTip();
                setStatus(
                  `Grabbed ${tabs.find((item) => item.value === current.value)?.label}. Move and release to reorder this example.`,
                );
              },
              event.pointerType === "touch" ? 500 : 180,
            );
          }}
          onPointerMoveCapture={(event) => {
            point.current = {
              x: event.clientX,
              touch: event.pointerType === "touch",
            };
            const current = pointer.current;
            if (!current || current.id !== event.pointerId) return;
            if (!current.grabbed) {
              if (
                Math.hypot(
                  event.clientX - current.x,
                  event.clientY - current.y,
                ) > 8
              ) {
                cancelHold();
                pointer.current = null;
              }
              return;
            }
            event.preventDefault();
            const elements = Array.from(
              host.current!.querySelectorAll<HTMLElement>('[role="tab"]'),
            );
            const targetIndex = elements.findIndex((element) => {
              const box = element.getBoundingClientRect();
              return event.clientX >= box.left && event.clientX <= box.right;
            });
            if (targetIndex < 0) return;
            setTabs((items) => {
              const from = items.findIndex(
                (item) => item.value === current.value,
              );
              if (from === targetIndex) return items;
              const next = [...items];
              const [moved] = next.splice(from, 1);
              next.splice(targetIndex, 0, moved);
              return next;
            });
          }}
          onPointerUpCapture={() => {
            cancelHold();
            if (pointer.current?.grabbed) {
              suppressClick.current = true;
              setStatus("Tab reordered in this example.");
            }
            pointer.current = null;
            setGrabbed(null);
          }}
          onPointerCancel={() => {
            cancelHold();
            pointer.current = null;
            setGrabbed(null);
          }}
          onClickCapture={(event) => {
            if (suppressClick.current) {
              event.preventDefault();
              event.stopPropagation();
              suppressClick.current = false;
            }
          }}
        >
          <TabRow
            tabs={tabs.map((tab) => ({
              ...tab,
              id: `${id}-${tab.value}`,
              panelId: `${id}-panel`,
            }))}
            value={active}
            onValueChange={setActive}
            onClose={(value) => {
              const next = tabs.filter((tab) => tab.value !== value);
              setTabs(next);
              if (active === value) setActive(next[0]?.value ?? "");
            }}
            minTabWidth={crowded ? 112 : 96}
            preferredTabWidth={160}
            minTabHeight={30}
            aria-label={`${edge} ${crowded ? "crowded" : "roomy"} panel tabs`}
            trailing={
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  icon
                  aria-label="New session"
                  onClick={() => {
                    const value = String(nextId.current++);
                    setTabs([...tabs, { value, label: "New session" }]);
                    setActive(value);
                  }}
                >
                  <Plus size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon
                  aria-label="Undock session"
                  onClick={() =>
                    setStatus(
                      "Undock action preview — placement is being reviewed.",
                    )
                  }
                >
                  <ArrowDownLeft size={14} />
                </Button>
              </>
            }
          />
          {tip && (
            <div
              className="dl-tab-edge-popover"
              role="tooltip"
              style={{ left: tip.left }}
            >
              {tip.label}
            </div>
          )}
        </div>
        <div
          className="dl-tab-edge-content"
          id={`${id}-panel`}
          role={selected ? "tabpanel" : undefined}
          aria-labelledby={selected ? `${id}-${active}` : undefined}
          tabIndex={selected ? 0 : undefined}
        >
          <strong>{selected?.label ?? "All tabs closed"}</strong>
          <p>
            {crowded
              ? "Wheel or swipe through tabs. Hold a tab to grab and reorder."
              : "Close stays inside. New session follows the final tab."}
          </p>
          <span role="status" className="dl-tab-edge-status">
            {status}
          </span>
        </div>
      </div>
    </section>
  );
}

export function PanelTabEdgesSpec() {
  return (
    <div data-panel-tab-edge-study className="dl-tab-edge-study">
      <style>{CSS}</style>
      <EdgeExample edge="smooth" />
      <EdgeExample edge="straight" />
      <EdgeExample edge="smooth" crowded />
      <EdgeExample edge="straight" crowded />
    </div>
  );
}

const CSS = `
.dl-tab-edge-study{display:grid;grid-template-columns:minmax(0,1fr);gap:24px;width:100%;min-width:0}
.dl-tab-edge-example{min-width:0}
.dl-tab-edge-example[data-tab-density="crowded"] .dl-tab-edge-panel{max-width:360px}
.dl-tab-edge-label{margin:0 0 12px;font:500 12px var(--font-uikit-mono,monospace);color:var(--ink)}
.dl-tab-edge-panel{position:relative;isolation:isolate;min-width:0;background:var(--panel-bg);border-radius:10px}
.dl-tab-edge-header{padding:8px 8px 0 0;position:relative;z-index:2}
.dl-tab-edge-study .uikit-tab-row{gap:0}
.dl-tab-edge-study .uikit-tab-row-scroll{padding-left:8px;align-items:flex-end;flex:0 1 auto;touch-action:pan-x}
.dl-tab-edge-study [data-overflow] .uikit-tab-row-scroll{flex:1 1 auto}
.dl-tab-edge-study .uikit-tab-row-line{display:none}
.dl-tab-edge-study .uikit-tab-row-controls{z-index:6;align-self:stretch;align-items:center;margin-bottom:0;background:var(--panel-bg);gap:0}
.dl-tab-edge-study [data-overflow] .uikit-tab-row-controls{box-shadow:-8px 0 10px -8px var(--ink)}
.dl-tab-edge-study .uikit-tab-row-item{--dl-study-tab-fill:color-mix(in srgb,var(--bg) 80%,var(--panel-bg));position:relative;z-index:1;background:var(--dl-study-tab-fill);border-color:var(--faint);border-bottom-color:transparent;border-radius:6px 6px 0 0}
.dl-tab-edge-study .uikit-tab-row-item[data-active]{--dl-study-tab-fill:var(--bg);z-index:4;background:var(--bg);border-bottom-color:var(--bg)}
.dl-tab-edge-study .uikit-tab-row-item-label{padding:5px 6px 6px 9px;opacity:.8}
.dl-tab-edge-study .uikit-tab-row-item[data-active] .uikit-tab-row-item-label{opacity:1}
.dl-tab-edge-study .uikit-tab-row-item-x,.dl-tab-edge-study .uikit-tab-row-item:hover .uikit-tab-row-item-x,.dl-tab-edge-study .uikit-tab-row-item:focus-within .uikit-tab-row-item-x{width:18px;height:18px;flex:0 0 18px;margin-right:6px;opacity:.65}
.dl-tab-edge-study [data-tab-edge="smooth"] .uikit-tab-row-item:first-child{overflow:visible;border-top-left-radius:12px}
.dl-tab-edge-study [data-tab-edge="smooth"] .uikit-tab-row-item:first-child::before{content:"";position:absolute;pointer-events:none;left:-8px;bottom:-1px;width:8px;height:8px;background:radial-gradient(circle at 0 0,transparent 7px,var(--dl-study-tab-fill) 7.5px)}
.dl-tab-edge-study [data-tab-edge="straight"] .uikit-tab-row-item:first-child{border-top-left-radius:0}
.dl-tab-edge-study [data-tab-density="crowded"] .uikit-tab-row-item + .uikit-tab-row-item{margin-left:-12px}
.dl-tab-edge-study [data-tab-density="crowded"] .uikit-tab-row-item-x{margin-right:18px}
.dl-tab-edge-study [data-tab-density="crowded"] .uikit-tab-row-item:hover .uikit-tab-row-item-x{margin-right:18px}
.dl-tab-edge-study [data-grabbed] .uikit-tab-row-scroll{cursor:grabbing;touch-action:none}
.dl-tab-edge-content{position:relative;z-index:0;min-height:112px;padding:20px;background:var(--bg);border-radius:0 0 10px 10px;color:var(--ink);font-size:13px}
.dl-tab-edge-content p{margin:8px 0 0;color:var(--muted);font-size:12px;line-height:1.5}
.dl-tab-edge-status{display:block;min-height:18px;margin-top:6px;color:var(--muted);font-size:11px}
.dl-tab-edge-popover{position:absolute;top:calc(100% + 5px);z-index:10;max-width:180px;padding:8px 10px;border:1px solid var(--faint);border-radius:6px;background:var(--bg);color:var(--ink);box-shadow:0 4px 14px #0002;font-size:12px;pointer-events:none}
@media(max-width:700px){.dl-tab-edge-study{grid-template-columns:minmax(0,1fr)}}
`;
