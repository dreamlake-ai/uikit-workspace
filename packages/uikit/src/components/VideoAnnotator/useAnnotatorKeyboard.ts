import { useEffect, useRef } from "react";

export interface AnnotatorKeyActions {
  togglePlay: () => void;
  stepFrame: (dir: number, big?: boolean) => void;
  gotoBoundary: (dir: number) => void;
  doSplit: () => void;
  approveToggle: () => void;
  goSeg: (index: number) => void;
  doMerge: (index: number) => void;
  sel: number;
}

/** Document-level shortcuts: Space, ←/→ (frame; Shift = 1s, Alt = nudge
 *  playhead to boundary), ,/. and j/k (prev/next segment: select + seek to its
 *  start), s (split), a (approve), Backspace (merge). Suppressed while typing in
 *  an input/textarea/select. Install controlled by `enableKeyboard`. */
export function useAnnotatorKeyboard(enabled: boolean, actions: AnnotatorKeyActions): void {
  // Keep the latest actions in a ref so the document listener attaches once (on
  // `enabled` change) instead of re-subscribing every time a callback identity
  // or `sel` changes — the handler always reads current values via the ref.
  const actionsRef = useRef(actions);
  useEffect(() => {
    actionsRef.current = actions;
  });
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      const { togglePlay, stepFrame, gotoBoundary, doSplit, approveToggle, goSeg, doMerge, sel } =
        actionsRef.current;
      const tag = (document.activeElement as HTMLElement | null)?.tagName || "";
      const typing = /^(TEXTAREA|INPUT|SELECT)$/.test(tag);
      if (typing) {
        if (e.key === "Escape") (document.activeElement as HTMLElement).blur();
        return;
      }
      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (e.shiftKey) stepFrame(-1, true);
          else if (e.altKey) gotoBoundary(-1);
          else stepFrame(-1, false);
          break;
        case "ArrowRight":
          e.preventDefault();
          if (e.shiftKey) stepFrame(1, true);
          else if (e.altKey) gotoBoundary(1);
          else stepFrame(1, false);
          break;
        case ",":
          goSeg(sel - 1);
          break;
        case ".":
          goSeg(sel + 1);
          break;
        case "s":
        case "S":
          doSplit();
          break;
        case "a":
        case "A":
          approveToggle();
          break;
        case "j":
          goSeg(sel + 1);
          break;
        case "k":
          goSeg(sel - 1);
          break;
        case "Backspace":
          e.preventDefault();
          doMerge(sel);
          break;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [enabled]);
}
