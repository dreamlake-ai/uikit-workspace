import { useEffect, useRef, useState, type RefObject } from "react";

/** Refresh only after an intentional pull at the top. Ordinary scrolling,
 * horizontal gestures, nested scrollers and browser zoom keep their behavior. */
export function usePullToRefresh(
  ref: RefObject<HTMLDivElement | null>,
  onRefresh?: () => void,
  refreshing = false,
) {
  const latest = useRef({ onRefresh, refreshing });
  latest.current = { onRefresh, refreshing };
  const [distance, setDistance] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node || !onRefresh) return;
    let start: { x: number; y: number } | null = null;
    let pull = 0;
    let wheelTime = 0;
    let cooldown = 0;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      pull = 0;
      setDistance(0);
    };
    const allowed = (target: EventTarget | null) => {
      if (
        latest.current.refreshing ||
        Date.now() < cooldown ||
        node.scrollTop > 0
      )
        return false;
      let el = target instanceof Element ? target : null;
      while (el && el !== node) {
        if (
          el.scrollHeight > el.clientHeight &&
          /auto|scroll/.test(getComputedStyle(el).overflowY)
        )
          return false;
        el = el.parentElement;
      }
      return true;
    };
    const refresh = () => {
      cooldown = Date.now() + 1000;
      reset();
      latest.current.onRefresh?.();
    };
    const touchstart = (e: TouchEvent) => {
      reset();
      start =
        e.touches.length === 1 && allowed(e.target)
          ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
          : null;
    };
    const touchmove = (e: TouchEvent) => {
      if (!start) return;
      if (e.touches.length !== 1 || !allowed(e.target)) {
        start = null;
        reset();
        return;
      }
      const dx = e.touches[0].clientX - start.x;
      const dy = e.touches[0].clientY - start.y;
      if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
        start = null;
        reset();
        return;
      }
      if (e.cancelable) e.preventDefault();
      pull = Math.min(100, dy / 2);
      setDistance(pull);
    };
    const touchend = () => {
      if (start && pull >= 64) refresh();
      else reset();
      start = null;
    };
    const cancel = () => {
      start = null;
      reset();
    };
    const wheel = (e: WheelEvent) => {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.deltaY >= 0 ||
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ||
        !allowed(e.target)
      ) {
        reset();
        return;
      }
      if (e.cancelable) e.preventDefault();
      if (Date.now() - wheelTime > 250) pull = 0;
      wheelTime = Date.now();
      pull = Math.min(
        100,
        pull -
          (e.deltaY *
            (e.deltaMode === 1
              ? 16
              : e.deltaMode === 2
                ? node.clientHeight
                : 1)) /
            2,
      );
      setDistance(pull);
      clearTimeout(timer);
      timer = setTimeout(reset, 250);
      if (pull >= 64) refresh();
    };
    const keydown = (e: KeyboardEvent) => {
      if (
        e.target === node &&
        e.altKey &&
        e.key.toLowerCase() === "r" &&
        allowed(node)
      ) {
        e.preventDefault();
        refresh();
      }
    };
    node.addEventListener("touchstart", touchstart, { passive: true });
    node.addEventListener("touchmove", touchmove, { passive: false });
    node.addEventListener("touchend", touchend);
    node.addEventListener("touchcancel", cancel);
    node.addEventListener("wheel", wheel, { passive: false });
    node.addEventListener("keydown", keydown);
    return () => {
      clearTimeout(timer);
      node.removeEventListener("touchstart", touchstart);
      node.removeEventListener("touchmove", touchmove);
      node.removeEventListener("touchend", touchend);
      node.removeEventListener("touchcancel", cancel);
      node.removeEventListener("wheel", wheel);
      node.removeEventListener("keydown", keydown);
    };
  }, [ref, !!onRefresh]);
  return distance;
}
