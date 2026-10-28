import { useCallback, useEffect, useRef } from "react";

/** Height changes of a modal panel glide instead of jumping. */
export const PANEL_HEIGHT_MS = 220;
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

/**
 * Animates a dialog panel between its old and new height whenever its content
 * grows or shrinks while it is open — a section expanding, an error line
 * appearing, a multi-step dialog changing step — instead of the panel (and,
 * because it is centred, its top edge) jumping in one frame.
 *
 * The panel keeps `height: auto`; each change is a short Web Animation from
 * the height on screen to the new natural height (`scrollHeight`, capped at
 * the panel's own `max-height`), so a change mid-glide continues from where
 * the panel is. Content that animates its own height (a kit Collapsible marks
 * itself `data-animating`) is simply followed. The panel's children are
 * observed rather than the panel, so the animation never re-triggers itself.
 * Reduced motion, or no `ResizeObserver` / `Element.animate`: no-op.
 *
 * Returns a callback ref for the panel.
 */
export function useAnimatedPanelHeight(active: boolean) {
  const panel = useRef<HTMLElement | null>(null);
  const last = useRef<number | null>(null);
  const anim = useRef<Animation | null>(null);
  const ro = useRef<ResizeObserver | null>(null);
  const mo = useRef<MutationObserver | null>(null);

  const measure = useCallback(() => {
    const el = panel.current;
    if (!el) return;
    // Layout height, not the bounding box: the enter animation scales the
    // panel, and a scaled box would be read as a shorter panel.
    const onScreen = parseFloat(getComputedStyle(el).height);
    // At rest the panel is at its natural (auto) height already; mid-glide the
    // natural height is the content's, capped at the panel's max-height.
    const max = parseFloat(getComputedStyle(el).maxHeight);
    // Mid-glide the panel is clipped, and a scrolling child (the Dialog body)
    // is squeezed to fit; add back what each child hides to get the height
    // the content wants.
    let wanted = el.scrollHeight;
    for (const child of Array.from(el.children)) {
      wanted += Math.max(0, child.scrollHeight - child.clientHeight);
    }
    const natural = !anim.current
      ? onScreen
      : Number.isFinite(max)
        ? Math.min(wanted, max)
        : wanted;
    const from = anim.current ? onScreen : last.current;
    last.current = natural;
    if (from == null || Math.abs(natural - from) < 1) return;
    if (el.querySelector('[data-slot="collapsible-content"][data-animating]'))
      return;
    if (typeof el.animate !== "function") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    anim.current?.cancel();
    const prevOverflow = el.style.overflowY;
    el.style.overflowY = "hidden";
    const a = el.animate(
      [{ height: `${from}px` }, { height: `${natural}px` }],
      {
        duration: PANEL_HEIGHT_MS,
        easing: EASE,
      },
    );
    anim.current = a;
    const done = () => {
      if (anim.current !== a) return;
      anim.current = null;
      el.style.overflowY = prevOverflow;
    };
    a.onfinish = done;
    a.oncancel = done;
  }, []);

  const observe = useCallback(() => {
    const el = panel.current;
    if (!el || !ro.current) return;
    ro.current.disconnect();
    for (const child of Array.from(el.children)) ro.current.observe(child);
  }, []);

  useEffect(() => {
    if (!active || typeof ResizeObserver === "undefined") return;
    ro.current = new ResizeObserver(measure);
    mo.current = new MutationObserver(() => {
      observe();
      measure();
    });
    const el = panel.current;
    if (el) {
      observe();
      mo.current.observe(el, { childList: true });
    }
    return () => {
      ro.current?.disconnect();
      mo.current?.disconnect();
      ro.current = null;
      mo.current = null;
      anim.current?.cancel();
      last.current = null;
    };
  }, [active, measure, observe]);

  return useCallback(
    (el: HTMLElement | null) => {
      panel.current = el;
      if (el && ro.current) {
        observe();
        mo.current?.observe(el, { childList: true });
      }
    },
    [observe],
  );
}
