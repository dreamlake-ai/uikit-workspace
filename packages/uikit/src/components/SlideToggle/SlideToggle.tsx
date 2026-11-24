import {
  type ButtonHTMLAttributes,
  type ReactNode,
  forwardRef,
  useState,
} from "react";
import { Eye } from "lucide-react";
import { type ToggleShape, roundClass } from "../../lib/toggleShape";

export interface ToggleFace {
  /** What the face shows — a word, a glyph, an icon. */
  node: ReactNode;
  /** The face's width in px. The knob is sized from it, so a wide face and a
   *  narrow one make the knob expand as it travels rather than just slide. */
  w: number;
  fontSize?: number;
}

export interface SlideToggleProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "type" | "value" | "defaultValue" | "onChange"
> {
  on: boolean;
  onToggle: () => void;
  left: ToggleFace;
  right: ToggleFace;
  title?: string;
  /** Accessible name. The faces are usually too terse to serve as one. */
  label?: string;
  /** Hover tint while ON. */
  onColor?: string;
  /** Hover tint while OFF. */
  offColor?: string;
  slideMs?: number;
  bgMs?: number;
  /** Corner shape. `square` (default): `--radius-uikit-toggle` (4px) track
   *  with a concentric `--radius-uikit-toggle-thumb` (2px) knob. `round`: a
   *  stadium track and pill knob. */
  shape?: ToggleShape;
}

import {
  EDITOR_TOGGLE_INSET as PAD,
  EDITOR_TOGGLE_MS,
  EDITOR_TOGGLE_HOVER,
  editorToggleTrackStyle,
  editorToggleThumbStyle,
  editorToggleFaceStyle,
} from "../../lib/editorToggleStyle";

/**
 * A two-state pill with a knob that slides between a left and a right face.
 *
 * Not a `Switch`. A Switch answers "is this on", and its two positions are the
 * same shape. This answers "which of these two", and each position is *named* —
 * `o` / `vim`, `</>` / an eye. That is why the faces carry their own widths and
 * the knob expands as it travels: the control is as wide as the two words it
 * is choosing between, and the knob is exactly as wide as the word it is on.
 *
 * State reads through colour rather than position alone: the face under the
 * knob is inked, the other muted. Hovering tints the whole pill — accent while
 * on, amber while off — and knocks the exposed face to white, so the control
 * says what it will become before it is clicked.
 */
export const SlideToggle = forwardRef<HTMLButtonElement, SlideToggleProps>(
  function SlideToggle(
    {
      on,
      onToggle,
      left,
      right,
      title,
      label,
      onColor = "var(--uikit-accent)",
      // The app's literal, kept 1:1 — a vivid orange that is deliberately NOT one
      // of the palette's six tones. `--tone-amber` is a dull mustard at this size
      // and reads as a disabled state rather than as "this is off, click to change
      // it". Do not "correct" it to a token.
      offColor = "#f97316",
      slideMs = EDITOR_TOGGLE_MS,
      bgMs = EDITOR_TOGGLE_MS,
      shape = "square",
      disabled = false,
      className,
      onClick,
      onMouseEnter,
      onMouseLeave,
      style,
      ...rest
    },
    ref,
  ) {
    const [hover, setHover] = useState(false);
    const highlighted = hover && !disabled;

    const splitX = PAD + left.w;
    const width = splitX + right.w + PAD;
    const knob = on
      ? { left: splitX, width: right.w }
      : { left: PAD, width: left.w };

    // `--chip-bg`, the kit's resting chip surface, rather than a hand-mixed
    // percentage — and theme-aware where a black tint is not: it goes to white at
    // 5% on dark, where black at 6% is invisible.
    const tone = highlighted ? (on ? onColor : offColor) : null;

    const face = (
      side: "left" | "right",
      f: ToggleFace,
      x: number,
      w: number,
    ) => {
      const active = side === "left" ? !on : on;
      return (
        <span
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: x,
            width: w,
            // Both faces sit ABOVE the knob, so the active label reads on the chip
            // instead of being covered by it.
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--f-mono)",
            fontSize: f.fontSize,
            fontWeight: 600,
            letterSpacing: "0.02em",
            ...editorToggleFaceStyle(active, highlighted, slideMs),
            pointerEvents: "none",
          }}
        >
          {f.node}
        </span>
      );
    };

    return (
      <button
        {...rest}
        ref={ref}
        type="button"
        disabled={disabled}
        data-shape={shape}
        className={[
          "uikit-slide-toggle",
          roundClass("slide-toggle", shape),
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={(event) => {
          onClick?.(event);
          if (!disabled && !event.defaultPrevented) onToggle();
        }}
        onMouseEnter={(event) => {
          if (!disabled) setHover(true);
          onMouseEnter?.(event);
        }}
        onMouseLeave={(event) => {
          setHover(false);
          onMouseLeave?.(event);
        }}
        title={title}
        aria-label={label ?? rest["aria-label"]}
        aria-pressed={on}
        style={{
          position: "relative",
          width,
          ...editorToggleTrackStyle(shape, tone, bgMs),
          outline: "none",
          WebkitTapHighlightColor: "transparent",
          cursor: disabled ? "default" : "pointer",
          flexShrink: 0,
          overflow: "hidden",
          ...style,
        }}
      >
        {face("left", left, PAD, left.w)}
        <div
          aria-hidden
          style={{
            position: "absolute",
            ...editorToggleThumbStyle(shape),
            zIndex: 1,
            left: knob.left,
            width: knob.width,
            transition: `left ${slideMs}ms ease, width ${slideMs}ms ease`,
            pointerEvents: "none",
          }}
        />
        {face("right", right, splitX, right.w)}
        <style>{`
        .uikit-slide-toggle:focus-visible{outline:2px solid var(--uikit-accent) !important;outline-offset:2px}
        @media(prefers-reduced-motion:reduce){.uikit-slide-toggle,.uikit-slide-toggle>span,.uikit-slide-toggle>div{transition:none !important}}
      `}</style>
      </button>
    );
  },
);

export type VimToggleProps = Omit<SlideToggleProps, "left" | "right">;

/** The `o` / `vim` sliding pill from the app's editor toolbar. */
export function VimToggle({ on, ...props }: VimToggleProps) {
  return (
    <SlideToggle
      on={on}
      label="Vim mode"
      title={on ? "Vim mode on" : "Vim mode off"}
      onColor={EDITOR_TOGGLE_HOVER}
      offColor={EDITOR_TOGGLE_HOVER}
      {...props}
      left={{ node: "o", w: 14, fontSize: 9 }}
      right={{ node: "vim", w: 26, fontSize: 10 }}
    />
  );
}

export type PreviewToggleProps = Omit<SlideToggleProps, "left" | "right">;

/** Raw markdown source / live preview, using the same editor pill geometry. */
export function PreviewToggle({ on, ...props }: PreviewToggleProps) {
  return (
    <SlideToggle
      on={on}
      label="Live preview"
      title={
        on
          ? "Live preview — click for raw source"
          : "Raw source — click for live preview"
      }
      {...props}
      left={{ node: "</>", w: 22, fontSize: 10 }}
      right={{ node: <Eye size={13} aria-hidden="true" />, w: 20 }}
    />
  );
}

/** `SlideToggle` with `shape="round"` — stadium track and pill knob. */
export const SlideToggleRound = forwardRef<
  HTMLButtonElement,
  Omit<SlideToggleProps, "shape">
>(function SlideToggleRound(props, ref) {
  return <SlideToggle ref={ref} {...props} shape="round" />;
});
