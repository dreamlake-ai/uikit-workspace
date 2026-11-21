import {
  useRef,
  useLayoutEffect,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Button } from "../Button";
import { documentTabStyles } from "../TabRow/documentTabStyles";
import {
  useDocumentTabScroll,
  revealDocumentTab,
} from "../TabRow/useDocumentTabScroll";
import { cn } from "../../lib/utils";
import { TAB_DRAG_THRESHOLD_PX, usePanelConfig } from "./config";
import { CloseIcon } from "./PanelLeaf";
import type { LeafNode, PanelNode } from "./panel-tree";

/** DOM id of the panel a tab controls. Shared with PanelLeaf so `aria-controls`
 *  and the panel's own `id` cannot drift apart. */
export const tabPanelDomId = (leafId: string) => `panel-${leafId}`;
/** DOM id of a tab, for its panel's `aria-labelledby`. */
export const tabDomId = (leafId: string) => `tab-${leafId}`;

/**
 * A group's flat TAB BAR: one tab per leaf, the active one lit.
 *
 * The selected tab is also a drag handle — drag it out of the group to dock it
 * elsewhere, the same gesture as the panel header's grab handle. Because a tab
 * is BOTH a click target and a drag handle, the drag only becomes real once the
 * pointer has travelled `TAB_DRAG_THRESHOLD_PX`. An inactive tab's first
 * gesture only selects it, so incidental motion cannot tear it out.
 *
 * This is a purely presentational strip: the tree's `activeId` is the single
 * source of truth for which tab shows.
 *
 * ACCESSIBILITY: a real `tablist`. Each tab is a `<button>`, so Enter/Space and
 * screen-reader button semantics come for free; focus roves with ←/→/Home/End,
 * Delete closes, and only the selected tab sits in the page tab order — the
 * standard tablist pattern. Dragging a tab OUT of its group stays pointer-only:
 * a deliberate limit, stated in the docs rather than left to be discovered.
 */
export function GroupTabBar({
  group,
  onActivate,
  onCloseTab,
  onHandleDown,
}: {
  group: Extract<PanelNode, { kind: "group" }>;
  onActivate: (id: string) => void;
  onCloseTab: (id: string) => void;
  onHandleDown: (
    leaf: LeafNode,
    e: ReactPointerEvent,
    thresholdPx?: number,
  ) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  useDocumentTabScroll(barRef);
  // Affordances only — see the Delete case below for why the strip does not
  // enforce this itself.
  const {
    closable,
    showTabClose,
    renderTab,
    renderTabTrailing,
    tabbed,
    panelAsAction,
  } = usePanelConfig();
  // Keep programmatically opened/selected tabs reachable when their panel
  // narrows. Scroll only this strip: scrollIntoView can move the document or
  // another docked panel and steal the reader's place.
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const active = bar.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!active) return;
    const reveal = (smooth = false) =>
      revealDocumentTab(bar, active, smooth, 8);
    reveal(true);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => reveal());
    observer.observe(bar);
    observer.observe(active);
    return () => observer.disconnect();
  }, [group.activeId, group.children.length, tabbed]);
  const actionLeaves = group.children.filter(
    (leaf) => leaf.id !== group.activeId && panelAsAction?.(leaf),
  );
  const tabs = group.children.filter((leaf) => !actionLeaves.includes(leaf));
  const pendingFocus = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (pendingFocus.current !== group.activeId) return;
    barRef.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.focus({ preventScroll: true });
    pendingFocus.current = null;
  }, [group.activeId]);
  const customTab = !!(renderTab || renderTabTrailing);
  const Tab = customTab ? "div" : "button";
  const canClose = (leaf: LeafNode) => closable?.(leaf) ?? true;

  const moveFocus = (from: number, to: number) => {
    const tabElements =
      barRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    if (!tabElements || tabs.length === 0) return;
    const i = ((to % tabs.length) + tabs.length) % tabs.length;
    if (i === from) return;
    tabElements[i].focus({ preventScroll: true });
    // Selection follows focus — the expected behaviour for a tablist whose
    // panels are already there and cheap to switch between.
    onActivate(tabs[i].id);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLElement>, index: number) => {
    if (e.target !== e.currentTarget) return;
    if (customTab && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onActivate(tabs[index].id);
      return;
    }
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        moveFocus(index, index - 1);
        break;
      case "ArrowRight":
        e.preventDefault();
        moveFocus(index, index + 1);
        break;
      case "Home":
        e.preventDefault();
        moveFocus(index, 0);
        break;
      case "End":
        e.preventDefault();
        moveFocus(index, tabs.length - 1);
        break;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        // Not guarded by `closable` here. This strip decides what to SHOW; the
        // layout decides what may actually go, in one place, so the two cannot
        // drift into disagreeing. Sending the request either way is what keeps
        // that single point of enforcement load-bearing.
        onCloseTab(tabs[index].id);
        break;
    }
  };

  // A single document uses the same tab semantics and inside close control.
  // Keep the marker used by hosts for title styling and docking targets.
  const single = tabbed && group.children.length === 1;

  return (
    // The shared strip uses an opaque gutter; selected tabs join the body surface.
    <div
      className="relative isolate flex min-w-0 shrink-0 items-stretch"
      data-panel-tab-controls
    >
      <style>{documentTabStyles}</style>
      {actionLeaves.map((leaf) => (
        <Button
          key={leaf.id}
          variant="action"
          tone="muted"
          size="sm"
          id={tabDomId(leaf.id)}
          data-panel-action={leaf.id}
          className="shrink-0"
          aria-controls={tabPanelDomId(leaf.id)}
          onClick={() => {
            pendingFocus.current = leaf.id;
            onActivate(leaf.id);
          }}
        >
          {leaf.title ?? `Panel ${leaf.n}`}
        </Button>
      ))}
      <div
        ref={barRef}
        role="tablist"
        aria-orientation="horizontal"
        className={cn(
          "uikit-document-tab-strip flex min-w-0 flex-1 items-stretch gap-[2px] overflow-x-auto select-none",
          tabbed ? "h-[26px]" : "h-[28px] px-1",
        )}
      >
        {tabs.map((leaf, index) => {
          const active = leaf.id === group.activeId;
          const label = leaf.title ?? `Panel ${leaf.n}`;
          return (
            <Tab
              key={leaf.id}
              {...(!customTab ? { type: "button" as const } : {})}
              aria-label={label}
              role="tab"
              id={tabDomId(leaf.id)}
              aria-selected={active}
              aria-controls={tabPanelDomId(leaf.id)}
              // Roving tabindex: the strip is ONE tab stop, then ←/→ within it.
              tabIndex={active ? 0 : -1}
              data-active={active || undefined}
              data-tab-id={leaf.id}
              data-single-view-header={single ? leaf.id : undefined}
              onKeyDown={(e) => onKeyDown(e, index)}
              onPointerDown={(e) => {
                // Selecting an inactive tab must not also arm a tear-out drag.
                // Once selected, a separate press can drag it past the threshold.
                if (
                  customTab &&
                  (e.target as HTMLElement).closest(
                    'button, a, input, select, textarea, [contenteditable=""], [contenteditable="true"], [role=button], [role=link], [role=combobox], [role=checkbox], [role=switch], [role=slider]',
                  )
                ) {
                  e.stopPropagation();
                  return;
                }
                if (e.button !== 0) return;
                if (!active) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                onHandleDown(leaf, e, TAB_DRAG_THRESHOLD_PX);
              }}
              onClick={(e) => {
                if (
                  customTab &&
                  (e.target as HTMLElement).closest(
                    'button, a, input, select, textarea, [contenteditable=""], [contenteditable="true"], [role=button], [role=link], [role=combobox], [role=checkbox], [role=switch], [role=slider]',
                  )
                ) {
                  e.stopPropagation();
                  return;
                }
                // Drag handling cancels pointerdown's native focus. Move DOM focus
                // off the old panel before activation hides its retained iframe.
                e.currentTarget.focus({ preventScroll: true });
                onActivate(leaf.id);
              }}
              className={cn(
                "uikit-document-tab group/tab inline-flex items-center p-0 cursor-pointer whitespace-nowrap",
                tabbed && "min-w-0 max-w-full shrink-0",
              )}
            >
              <span
                className={cn(
                  "uikit-document-tab-label inline-flex items-center min-w-0",
                  tabbed && "overflow-hidden",
                )}
              >
                {renderTab ? (
                  renderTab(leaf)
                ) : (
                  <span className="truncate max-w-[160px]">{label}</span>
                )}
              </span>
              <span className="uikit-document-tab-end">
                {renderTabTrailing?.(leaf)}
                {canClose(leaf) && showTabClose?.(leaf) !== false && (
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={`Close ${label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(leaf.id);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    // A <button> inside a <button> is invalid HTML — browsers drop the
                    // inner one — so this close affordance carries button semantics on
                    // a span. It stays OUT of the tab order on purpose: the keyboard
                    // route to closing a tab is Delete on the tab itself.
                    className="uikit-document-tab-close"
                  >
                    <CloseIcon />
                  </span>
                )}
              </span>
            </Tab>
          );
        })}
      </div>
    </div>
  );
}
