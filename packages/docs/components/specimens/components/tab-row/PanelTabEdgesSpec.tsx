import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { ArrowDownLeft, Plus } from "lucide-react";
import { Button, TabRow } from "@dreamlake/uikit";

/** Interaction proposals on the existing TabRow; wrapper gestures are docs-only. */
function EdgeExample({
  edge,
  crowded = false,
}: {
  edge: "smooth" | "straight";
  crowded?: boolean;
}) {
  const id = useId();
  const alternative = edge === "smooth" ? "1.A" : "1.B";
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
  const [tip, setTip] = useState<{
    label: string;
    left: number;
    arrowLeft: number;
    tabId: string;
  } | null>(null);
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
    const left = Math.max(0, Math.min(box.left - area.left, area.width - 180));
    setTip({
      tabId: element.id,
      arrowLeft: Math.max(
        12,
        Math.min(box.left + box.width / 2 - area.left - left, 160),
      ),
      label: element.title || element.textContent || "Session",
      left,
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
      // Follow the actual painted tab, including overlap and its sticky controls.
      const target = document
        .elementsFromPoint(x, bounds.top + bounds.height / 2)
        .map((element) =>
          element
            .closest(".uikit-tab-row-item")
            ?.querySelector<HTMLElement>('[role="tab"]'),
        )
        .find((element) => element && scroll.contains(element));
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
        {alternative} ·{" "}
        {edge === "smooth"
          ? "S-curved tabs (selected direction)"
          : "Straight left edge (comparison)"}{" "}
        · {crowded ? "crowded" : "roomy"}
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
              hideTip();
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
              title: "",
              descriptionId:
                tip?.tabId === `${id}-${tab.value}`
                  ? `${id}-tooltip`
                  : undefined,
              trailing:
                tab.label === "Design memo" && tab.value === active ? (
                  <span
                    className="dl-tab-reference"
                    data-reference-id="6af89080efca7d15a5c451f7"
                    aria-label="Memo reference 6af89080efca7d15a5c451f7"
                  >
                    #6af890
                  </span>
                ) : undefined,
            }))}
            value={active}
            onValueChange={setActive}
            onClose={(value) => {
              const next = tabs.filter((tab) => tab.value !== value);
              setTabs(next);
              if (active === value) setActive(next[0]?.value ?? "");
            }}
            minTabWidth={crowded ? 170 : 96}
            preferredTabWidth={160}
            minTabHeight={30}
            aria-label={`${edge} ${crowded ? "crowded" : "roomy"} panel tabs`}
            trailing={
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  icon
                  className="uikit-document-tab-action"
                  aria-label="New session"
                  onClick={() => {
                    const value = String(nextId.current++);
                    setTabs([...tabs, { value, label: "New session" }]);
                    setActive(value);
                  }}
                >
                  <Plus size={14} />
                </Button>
              </>
            }
          />
          <Button
            className="dl-tab-undock"
            variant="ghost"
            size="sm"
            icon
            aria-label="Undock session"
            onClick={() =>
              setStatus(
                "Undock action preview — pinned to the far-right corner.",
              )
            }
          >
            <ArrowDownLeft size={14} />
          </Button>
          {tip && (
            <div
              className="dl-tab-edge-popover"
              id={`${id}-tooltip`}
              role="tooltip"
              style={
                {
                  left: tip.left,
                  "--tip-arrow-left": `${tip.arrowLeft}px`,
                } as CSSProperties
              }
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
.dl-tab-edge-panel{position:relative;isolation:isolate;min-width:0;background:var(--uikit-document-strip-surface,var(--uikit-workspace-bg));border:0;box-shadow:none}
.dl-tab-edge-header{padding:8px 36px 0 0;position:relative;z-index:2}
.dl-tab-edge-study .uikit-tab-row{gap:0}
.dl-tab-edge-study .uikit-tab-row-scroll{padding-left:8px;align-items:flex-end;flex:0 1 auto;touch-action:pan-x}
.dl-tab-edge-study [data-overflow] .uikit-tab-row-scroll{flex:1 1 auto}
.dl-tab-edge-study .uikit-tab-row-line{display:none}
.dl-tab-edge-study .uikit-tab-row-controls{z-index:6;align-self:stretch;align-items:center;margin-bottom:0;background:var(--uikit-document-strip-surface,var(--uikit-workspace-bg));gap:0}
.dl-tab-edge-study .uikit-tab-row-item-label{padding:5px 6px 6px 9px;opacity:.8}
.dl-tab-edge-study .uikit-tab-row-item[data-active] .uikit-tab-row-item-label{opacity:1}
.dl-tab-edge-study [data-tab-edge="straight"] .uikit-tab-row-item:first-child{border-top-left-radius:0}
.dl-tab-edge-study [data-tab-edge="straight"] .uikit-tab-row-item:first-child::before{display:none}
.dl-tab-reference{font:10px var(--font-uikit-mono,monospace);padding:1px 3px;border:1px solid var(--faint);border-radius:3px;white-space:nowrap}
.dl-tab-undock{position:absolute!important;right:4px;top:8px}
.dl-tab-edge-study [data-grabbed] .uikit-tab-row-scroll{cursor:grabbing;touch-action:none}
.dl-tab-edge-content{position:relative;z-index:0;min-height:112px;padding:20px;background:var(--uikit-document-surface,var(--bg));border:0;box-shadow:none;border-radius:0 0 10px 10px;color:var(--ink);font-size:13px}
.dl-tab-edge-content p{margin:8px 0 0;color:var(--muted);font-size:12px;line-height:1.5}
.dl-tab-edge-status{display:block;min-height:18px;margin-top:6px;color:var(--muted);font-size:11px}
.dl-tab-edge-popover::before{content:"";position:absolute;left:var(--tip-arrow-left,16px);top:-5px;width:8px;height:8px;background:var(--bg);border-top:1px solid var(--faint);border-left:1px solid var(--faint);transform:translateX(-50%) rotate(45deg)}
.dl-tab-edge-popover{position:absolute;top:calc(100% + 5px);z-index:10;max-width:180px;padding:8px 10px;border:1px solid var(--faint);border-radius:6px;background:var(--bg);color:var(--ink);box-shadow:0 4px 14px #0002;font-size:12px;pointer-events:none}
@media(max-width:700px){.dl-tab-edge-study{grid-template-columns:minmax(0,1fr)}}
`;
