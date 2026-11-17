import { useEffect, type RefObject } from "react";

/** Mouse wheels and trackpads both move the strip; leave zoom and edge scroll alone. */
export function useDocumentTabScroll(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const strip = ref.current;
    if (!strip) return;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.defaultPrevented) return;
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      const scale =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? strip.clientWidth
            : 1;
      const next = Math.max(
        0,
        Math.min(
          strip.scrollWidth - strip.clientWidth,
          strip.scrollLeft + delta * scale,
        ),
      );
      if (next === strip.scrollLeft) return;
      // React's delegated wheel listener is passive; this native listener must
      // cancel page scrolling only when the tab strip actually consumes it.
      event.preventDefault();
      strip.scrollLeft = next;
    };
    strip.addEventListener("wheel", onWheel, { passive: false });
    return () => strip.removeEventListener("wheel", onWheel);
  }, [ref]);
}
