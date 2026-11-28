import { useEffect, useRef } from "react";

type Boundary = { readonly current: Element | null };

// An overlay's trigger and portalled surface form one interaction boundary.
// Follow only surfaces anchored inside the current overlay, including nested
// portals. Unrelated overlays remain outside; no event timing is involved.
const overlays = new Set<{
  current: { boundaries: readonly Boundary[] };
}>();
function isInside(
  boundaries: readonly Boundary[],
  targets: readonly EventTarget[],
) {
  const regions = new Set(
    boundaries.flatMap((boundary) =>
      boundary.current ? [boundary.current] : [],
    ),
  );
  const pending = new Set(overlays);
  let changed = true;
  while (changed) {
    changed = false;
    for (const overlay of pending) {
      const nodes = overlay.current.boundaries.flatMap((boundary) =>
        boundary.current ? [boundary.current] : [],
      );
      if (
        !nodes.some((node) =>
          [...regions].some((region) => region.contains(node)),
        )
      )
        continue;
      pending.delete(overlay);
      nodes.forEach((node) => regions.add(node));
      changed = true;
    }
  }
  return targets.some((target) =>
    [...regions].some(
      (region) =>
        target === region ||
        (target instanceof Node && region.contains(target)),
    ),
  );
}

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
    overlays.add(current);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;
    const isInsideFrame = (target: Element) =>
      isInside(current.current.boundaries, [target]);
    const checkFrame = () => {
      const target = doc.activeElement;
      if (target?.tagName !== "IFRAME") return;
      if (isInsideFrame(target)) {
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
      if (target?.tagName === "IFRAME" && !isInsideFrame(target)) {
        current.current.onDismiss();
        return;
      }
      // Other browsers update activeElement after dispatching window blur.
      timer = setTimeout(checkFrame, 0);
    };
    win.addEventListener("blur", onBlur);
    return () => {
      overlays.delete(current);
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
      if (isInside(current.current.boundaries, event.composedPath())) return;
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
