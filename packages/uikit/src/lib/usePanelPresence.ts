import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/** The fold: a little shorter than the unfold (320ms, most of it visible in
 *  the first ~140ms) and on an accelerating curve, so it leaves from where the
 *  eye is and speeds back into the trigger's corner. The chevron's 220ms turn
 *  lands with it. */
export const PANEL_EXIT_MS = 220;
const PANEL_EXIT_EASING = "cubic-bezier(0.4, 0, 1, 1)";
const PANEL_EXIT_REDUCED_MS = 100;
/** Playing a fold back open after a reopen: the unfold's own curve. */
const PANEL_REOPEN_MS = 200;
const PANEL_REOPEN_EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)";
/** Unmount even if `finish` never arrives (a hidden tab, a cancelled timeline). */
const PANEL_EXIT_FALLBACK_MS = PANEL_EXIT_MS + 180;
/** The resting, fully open pose (styles.css: the unfold's `to`). */
const OPEN_POSE = {
  clipPath: "inset(-40px)",
  transform: "scale(1)",
  opacity: "1",
};

export interface PanelPresence {
  /** Render the panel. True while open and for the length of the fold. */
  present: boolean;
  /** True only during the fold: the panel is on its way out. */
  closing: boolean;
  /** Attach to the panel element (compose with any other ref). */
  ref: (el: HTMLElement | null) => void;
  /** Spread on the panel: takes a closing panel out of the pointer, focus and
   *  accessibility trees, so an outside click, Escape, Tab or a screen reader
   *  all behave as if it were already gone. */
  closingProps: { inert?: boolean; "aria-hidden"?: true; "data-closing"?: "" };
}

/** The panel's current clip / transform / opacity, as a keyframe. */
function pose(el: HTMLElement) {
  const cs = getComputedStyle(el);
  return {
    clipPath:
      cs.clipPath && cs.clipPath !== "none" ? cs.clipPath : OPEN_POSE.clipPath,
    transform:
      cs.transform && cs.transform !== "none"
        ? cs.transform
        : OPEN_POSE.transform,
    opacity: cs.opacity || "1",
  };
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Keeps a dropdown-like panel (`.uikit-panel-in[data-unfold]`) mounted after
 * `open` turns false and folds it back into the corner it unfolded from — the
 * unfold played backwards. Everything that listens to `open` (focus return,
 * outside press, Escape, the chevron) still switches the moment it closes;
 * only the DOM waits for the fold.
 *
 * The fold is a Web Animation that starts from the pose the panel is in when
 * it closes — fully open, or half-way through its unfold if it is closed
 * straight after opening. Reopening during the fold animates from wherever the
 * fold has got to back to open (on the unfold's curve), and closing again
 * mid-way folds from there, so nothing jumps in either direction.
 *
 * No `Element.animate` (jsdom, very old engines): unmounts at once, as before.
 */
export function usePanelPresence(open: boolean): PanelPresence {
  const [present, setPresent] = useState(open);
  const node = useRef<HTMLElement | null>(null);
  /** The panel's running Web Animation, if any: the fold, or a fold being
   *  played back open after a reopen. */
  const anim = useRef<{ animation: Animation; closing: boolean } | null>(null);

  // Render-phase: a fresh open mounts in the same pass, so the CSS unfold plays.
  if (open && !present) setPresent(true);

  const finish = useCallback(() => {
    anim.current = null;
    setPresent(false);
  }, []);

  useLayoutEffect(() => {
    const el = node.current;
    const running = anim.current;
    if (open) {
      // Reopened mid-fold: from wherever the fold has got to, back to open.
      if (running?.closing && el) {
        const from = pose(el);
        running.animation.cancel();
        const back = el.animate([from, OPEN_POSE], {
          duration: PANEL_REOPEN_MS,
          easing: PANEL_REOPEN_EASING,
        });
        const entry = { animation: back, closing: false };
        anim.current = entry;
        back.onfinish = () => {
          if (anim.current === entry) anim.current = null;
        };
      }
      return;
    }
    if (!present || running?.closing) return;
    if (!el || typeof el.animate !== "function") {
      finish();
      return;
    }
    const reduce = prefersReducedMotion();
    // Start from the pose the panel is actually in — fully open, half-way
    // through its unfold, or half-way back open after a reopen — so a close
    // at any moment never jumps. (Explicit, not an implicit keyframe: the
    // resting clip-path is `none`, which can't interpolate to an inset.)
    const from = pose(el);
    running?.animation.cancel();
    const corner = getComputedStyle(el)
      .getPropertyValue("--uikit-unfold-from")
      .trim();
    const keyframes: Keyframe[] = reduce
      ? [{ opacity: from.opacity }, { opacity: "0" }]
      : [
          from,
          // Opacity holds while the first part folds, then goes with the rest —
          // the mirror of the unfold's early fade-in.
          { offset: 0.35, opacity: from.opacity },
          {
            opacity: "0",
            transform: "scale(0.96)",
            clipPath: corner || from.clipPath,
          },
        ];
    const animation = el.animate(keyframes, {
      duration: reduce ? PANEL_EXIT_REDUCED_MS : PANEL_EXIT_MS,
      easing: reduce ? "linear" : PANEL_EXIT_EASING,
      fill: "forwards",
    });
    const entry = { animation, closing: true };
    anim.current = entry;
    animation.onfinish = () => {
      if (anim.current === entry) finish();
    };
  }, [open, present, finish]);

  useEffect(() => {
    if (open || !present) return;
    const timer = setTimeout(() => {
      anim.current?.animation.cancel();
      finish();
    }, PANEL_EXIT_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [open, present, finish]);

  const ref = useCallback((el: HTMLElement | null) => {
    node.current = el;
  }, []);

  const closing = present && !open;
  return {
    present,
    closing,
    ref,
    closingProps: closing
      ? { inert: true, "aria-hidden": true, "data-closing": "" }
      : {},
  };
}
