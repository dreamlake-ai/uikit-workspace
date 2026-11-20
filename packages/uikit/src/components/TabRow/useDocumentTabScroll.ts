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

/** Reveal a natural tab slot without scrolling any document or dock ancestor. */
export function revealDocumentTab(
  strip: HTMLElement,
  item: HTMLElement,
  smooth = false,
  inset = 0,
) {
  const viewport = strip.getBoundingClientRect();
  const original = item.style.position;
  item.style.position = "static";
  const tab = item.getBoundingClientRect();
  item.style.position = original;
  if (!viewport.width || !tab.width) return;
  const delta =
    tab.left < viewport.left + inset || tab.width > viewport.width
      ? tab.left - viewport.left - inset
      : Math.max(0, tab.right - viewport.right + inset);
  if (!delta) return;
  if (
    smooth &&
    strip.scrollBy &&
    !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  )
    strip.scrollBy({ left: delta, behavior: "smooth" });
  else strip.scrollLeft += delta;
}
