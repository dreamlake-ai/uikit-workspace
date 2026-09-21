import { type CSSProperties, type ReactNode, useState } from "react";

export interface ToggleFace {
  /** What the face shows — a word, a glyph, an icon. */
  node: ReactNode;
  /** The face's width in px. The knob is sized from it, so a wide face and a
   *  narrow one make the knob expand as it travels rather than just slide. */
  w: number;
  fontSize?: number;
}

export interface SlideToggleProps {
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
  style?: CSSProperties;
}

const PAD = 2;

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
export function SlideToggle({
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
  slideMs = 240,
  bgMs = 240,
  style,
}: SlideToggleProps) {
  const [hover, setHover] = useState(false);

  const splitX = PAD + left.w;
  const width = splitX + right.w + PAD;
  const knob = on
    ? { left: splitX, width: right.w }
    : { left: PAD, width: left.w };

  // `--chip-bg`, the kit's resting chip surface, rather than a hand-mixed
  // percentage — and theme-aware where a black tint is not: it goes to white at
  // 5% on dark, where black at 6% is invisible.
  const pillBg = hover ? (on ? onColor : offColor) : "var(--chip-bg)";

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
          color: active ? "var(--ink)" : hover ? "#fff" : "var(--uikit-muted)",
          opacity: active || hover ? 1 : 0.5,
          transition: `color ${slideMs}ms ease, opacity ${slideMs}ms ease`,
          pointerEvents: "none",
        }}
      >
        {f.node}
      </span>
    );
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={title}
      aria-label={label}
      aria-pressed={on}
      style={{
        position: "relative",
        width,
        height: 20,
        border: "none",
        outline: "none",
        boxShadow: "none",
        WebkitTapHighlightColor: "transparent",
        borderRadius: 5,
        cursor: "pointer",
        flexShrink: 0,
        overflow: "hidden",
        background: pillBg,
        transition: `background ${bgMs}ms ease`,
        ...style,
      }}
    >
      {face("left", left, PAD, left.w)}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 2,
          height: 16,
          borderRadius: 3,
          zIndex: 1,
          left: knob.left,
          width: knob.width,
          background: "var(--bg)",
          transition: `left ${slideMs}ms ease, width ${slideMs}ms ease`,
          pointerEvents: "none",
        }}
      />
      {face("right", right, splitX, right.w)}
    </button>
  );
}

export interface VimToggleProps {
  on: boolean;
  onToggle: () => void;
}

/** The `o` / `vim` sliding pill from the app's editor toolbar. */
export function VimToggle({ on, onToggle }: VimToggleProps) {
  return (
    <SlideToggle
      on={on}
      onToggle={onToggle}
      label="Vim mode"
      title={on ? "Vim mode on" : "Vim mode off"}
      left={{ node: "o", w: 14, fontSize: 9 }}
      right={{ node: "vim", w: 26, fontSize: 10 }}
    />
  );
}
