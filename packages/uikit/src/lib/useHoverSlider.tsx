import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

/** The rows a pointer can land on inside a menu-like panel. */
export const HOVER_SLIDER_ROWS =
  '[role="option"], [role^="menuitem"], button, a[href]';

/** A row that paints its own fill: selected (accent) or danger (red). Grey
 *  under either mixes into a colour neither state owns, so the slider steps
 *  aside on these. */
export const HOVER_SLIDER_SELECTED =
  '[aria-selected="true"], [data-selected="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"]), [data-active-row], [data-danger]';

/**
 * Hover for a list of rows, painted ONCE and moved rather than once per row —
 * the app sidebar's nav hover, brought to every menu-like panel in the kit.
 * Crossing five rows is one fill travelling five times, not five fills fading
 * in and out at whatever rate the pointer happens to cross them.
 *
 * The host must be `relative isolate`: the slider sits at `z-index: -1` inside
 * the host's own stacking context, so it paints above the panel surface but
 * under every row — a selected row's accent fill covers it where the two meet,
 * with no z-index needed on the rows themselves.
 *
 * Two ways to aim it. Panels whose rows carry their own active index
 * (floating-ui lists: Select, DropdownMenu) pass that row to `track`, so the
 * keyboard moves the same fill the pointer does. Plain panels (Menu) spread
 * `pointerHandlers` and the slider follows the row under the pointer.
 *
 * Coordinates are the host's content space (rect delta plus scroll offset), so
 * a scrolling host carries the slider with its rows.
 */
export function useHoverSlider<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [box, setBox] = useState({ x: 0, y: 0, w: 0, h: 0, radius: "0px" });

  useLayoutEffect(() => {
    const host = ref.current;
    if (!host || !target || !host.contains(target)) return;
    const r = target.getBoundingClientRect();
    const h = host.getBoundingClientRect();
    const next = {
      x: r.left - h.left + host.scrollLeft,
      y: r.top - h.top + host.scrollTop,
      w: r.width,
      h: r.height,
      radius: getComputedStyle(target).borderRadius,
    };
    setBox((prev) =>
      prev.x === next.x &&
      prev.y === next.y &&
      prev.w === next.w &&
      prev.h === next.h &&
      prev.radius === next.radius
        ? prev
        : next,
    );
  }, [target]);

  // A row can leave while the pointer rests on it — a button that turns into
  // the field it opens (the note version menu's "Name and save"), a row a
  // filter drops. No pointer event says so, and the slider stayed painted
  // where the row used to be until the pointer moved again. Watch the host
  // for the tracked row going away, and step aside when it does.
  useEffect(() => {
    const host = ref.current;
    if (!host || !target || typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver(() => {
      if (!target.isConnected || !host.contains(target)) setTarget(null);
    });
    observer.observe(host, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [target]);

  // A row that cannot be chosen gets no hover, same as before.
  const track = (el: HTMLElement | null) =>
    setTarget(
      el && !el.matches('[aria-disabled="true"], [data-disabled], :disabled')
        ? el
        : null,
    );

  const pointerHandlers = {
    onPointerMove: (e: ReactPointerEvent<T>) => {
      // Touch movement is scrolling, not hover.
      if (e.pointerType === "touch") return track(null);
      // The OUTERMOST row under the pointer: an icon button inside an option
      // is part of that option's row, not a row of its own.
      const host = ref.current;
      let row: HTMLElement | null = null;
      let at = (e.target as HTMLElement | null)?.closest?.(
        HOVER_SLIDER_ROWS,
      ) as HTMLElement | null;
      while (at && host && host !== at && host.contains(at)) {
        row = at;
        at = at.parentElement?.closest(HOVER_SLIDER_ROWS) as HTMLElement | null;
      }
      track(row);
    },
    onPointerLeave: () => track(null),
  };

  // The slider steps aside on the selected row. Selection fills are translucent
  // accent, so grey under them mixed into a third colour neither state owns —
  // the nav rail avoids it with an opaque selected fill; here the slider just
  // stays out, which reads the same: the selected row looks selected, hovered
  // or not. It keeps its position, so leaving the row slides on from there.
  const ready = !!target && !target.matches(HOVER_SLIDER_SELECTED);
  const slider = (
    <span
      aria-hidden="true"
      data-uikit-hover-slider=""
      {...(ready ? { "data-ready": "" } : {})}
      className="uikit-hover-slider"
      style={{
        width: box.w,
        height: box.h,
        borderRadius: box.radius,
        transform: `translate(${box.x}px, ${box.y}px)`,
      }}
    />
  );

  return { ref, track, pointerHandlers, slider };
}
