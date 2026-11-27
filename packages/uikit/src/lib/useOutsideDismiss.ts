import { useEffect, useRef } from "react";

type Boundary = { readonly current: Element | null };

/** A press inside a frame never bubbles to its host document. Focus moving
 * into that frame is observable without reading the frame's document, even
 * when it is cross-origin. Keep an embedded frame inside the overlay usable. */
export function useIframeDismiss(
  enabled: boolean,
  boundaries: readonly Boundary[],
  onDismiss: () => void,
) {
  const current = useRef({ boundaries, onDismiss });
  current.current = { boundaries, onDismiss };
  useEffect(() => {
    if (!enabled) return;
    const doc =
      boundaries.find((boundary) => boundary.current)?.current?.ownerDocument ??
      document;
    const win = doc.defaultView;
    if (!win) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;
    const isInside = (target: Element) =>
      current.current.boundaries.some((boundary) =>
        boundary.current?.contains(target),
      );
    const checkFrame = () => {
      const target = doc.activeElement;
      if (target?.tagName !== "IFRAME") return;
      if (isInside(target)) {
        // Moving directly between sibling frames does not blur the host again.
        // Observe only while focus is in an inside frame; never read its DOM.
        frame = win.requestAnimationFrame(checkFrame);
        return;
      }
      current.current.onDismiss();
    };
    const onBlur = () => {
      clearTimeout(timer);
      win.cancelAnimationFrame(frame);
      const target = doc.activeElement;
      // Some browsers already expose the destination during blur. Keep that
      // evidence: a responsive remount or rapid focus move can replace it
      // with BODY before the deferred check runs.
      if (target?.tagName === "IFRAME" && !isInside(target)) {
        current.current.onDismiss();
        return;
      }
      // Other browsers update activeElement after dispatching window blur.
      timer = setTimeout(checkFrame, 0);
    };
    win.addEventListener("blur", onBlur);
    return () => {
      clearTimeout(timer);
      win.cancelAnimationFrame(frame);
      win.removeEventListener("blur", onBlur);
    };
  }, [enabled]);
}

/** Capture before editors/canvases stop propagation. Pointer events cover
 * touch and pen; mousedown also supports callers using legacy mouse events. */
export function useOutsideDismiss(
  enabled: boolean,
  boundaries: readonly Boundary[],
  onDismiss: () => void,
) {
  const current = useRef({ boundaries, onDismiss });
  current.current = { boundaries, onDismiss };
  useIframeDismiss(enabled, boundaries, onDismiss);
  useEffect(() => {
    if (!enabled) return;
    const doc =
      boundaries.find((boundary) => boundary.current)?.current?.ownerDocument ??
      document;
    const onPress = (event: Event) => {
      const path = event.composedPath();
      if (
        current.current.boundaries.some(
          (boundary) =>
            boundary.current &&
            path.some(
              (target) =>
                target === boundary.current ||
                (target instanceof Node && boundary.current!.contains(target)),
            ),
        )
      )
        return;
      current.current.onDismiss();
    };
    doc.addEventListener("pointerdown", onPress, true);
    doc.addEventListener("mousedown", onPress, true);
    return () => {
      doc.removeEventListener("pointerdown", onPress, true);
      doc.removeEventListener("mousedown", onPress, true);
    };
  }, [enabled]);
}
