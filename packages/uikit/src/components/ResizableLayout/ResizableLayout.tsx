import { ReactNode, useState, useEffect, useRef, useCallback } from "react";
import { cn } from "../../lib/utils";
import { ResizeDivider } from "./ResizeDivider";

export interface ResizableLayoutProps {
  left: ReactNode;
  middle: ReactNode;
  right: ReactNode;
  top?: ReactNode;
  /**
   * Initial flex weights for each column. Ignored for any column that opts
   * into a fixed-px mode (`leftFixedPx`, `middleFixedPx`).
   */
  defaultWidths?: { left?: number; middle?: number; right?: number };
  /** Minimum pixel width for each column, enforced during drag-resize. */
  minWidths?: { left?: number; middle?: number; right?: number };
  storageKey?: string;
  /** Hide the left column. */
  leftHidden?: boolean;
  /** Hide the middle column. */
  middleHidden?: boolean;
  /** Hide the right column. */
  rightHidden?: boolean;
  /** Enable drag-to-resize on the left divider. Default true. */
  leftResizable?: boolean;
  /** Enable drag-to-resize on the right divider. Default true. */
  rightResizable?: boolean;
  /** Show the cursor-following pill on dividers. The drag area is always active. */
  showDivider?: boolean;
  /** Visual width of the space between columns in px. Default 24. */
  gap?: number;
  /**
   * Pin the left column to a fixed pixel width (`flex: 0 0 <px>`). When set,
   * the left column ignores `defaultWidths.left` and never grows with the
   * viewport. Leave undefined for the default flex-ratio behavior.
   */
  leftFixedPx?: number;
  /**
   * Pin the middle column to a fixed-but-resize-adjustable pixel width. The
   * value is the initial width; the middle-right drag mutates it directly
   * (1px cursor = 1px middle), clamped by `minWidths.middle`. When set, the
   * right column takes the remaining width via `flex: 1 1 0` (the design's
   * `1fr` track). Pair with `storageKey` to persist the px value.
   */
  middleFixedPx?: number;
  className?: string;
}

const DEFAULTS = { left: 2, middle: 3, right: 5 };
const MIN_WIDTH_DEFAULT = 80;

// Persisted shape. `middle` is interpreted in px when `middleFixedPx` is set,
// otherwise as a flex ratio. Mode is implicit from the caller's props — the
// component never tries to convert between the two on the fly.
type StoredWidths = { left?: number; middle?: number; right?: number };

function readWidths(key: string | undefined): StoredWidths {
  if (!key || typeof window === "undefined") return {};
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? "{}");
    return {
      left: typeof stored.left === "number" ? stored.left : undefined,
      middle: typeof stored.middle === "number" ? stored.middle : undefined,
      right: typeof stored.right === "number" ? stored.right : undefined,
    };
  } catch {
    return {};
  }
}

function writeWidths(key: string | undefined, widths: StoredWidths) {
  if (!key || typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(widths));
  } catch {}
}

export function ResizableLayout({
  left,
  middle,
  right,
  top,
  defaultWidths,
  minWidths,
  storageKey,
  leftHidden = false,
  middleHidden = false,
  rightHidden = false,
  leftResizable = true,
  rightResizable = true,
  showDivider = true,
  gap = 24,
  leftFixedPx,
  middleFixedPx,
  className,
}: ResizableLayoutProps) {
  // The divider's hit area is at least 20px regardless of `gap` so the
  // resize handle stays grabbable even when columns sit flush (`gap: 0`,
  // the design's flush-column layout). When the hit exceeds `gap` the
  // divider renders as an absolute overlay so it overhangs the column
  // boundary without stealing flex space.
  const MIN_HIT = 20;
  const hitSize = Math.max(gap, MIN_HIT);
  const overlay = hitSize > gap;
  const defaults = {
    left: defaultWidths?.left ?? DEFAULTS.left,
    middle: defaultWidths?.middle ?? DEFAULTS.middle,
    right: defaultWidths?.right ?? DEFAULTS.right,
  };

  // Flex-ratio state, used when the corresponding column isn't fixed.
  const [leftFlex, setLeftFlex] = useState(defaults.left);
  const [middleFlex, setMiddleFlex] = useState(defaults.middle);
  const [rightFlex, setRightFlex] = useState(defaults.right);
  // Px state for the fixed-but-resizable middle column. Tracks the *current*
  // width, which starts at `middleFixedPx` and is mutated by the resize handle.
  const [middlePx, setMiddlePx] = useState(middleFixedPx ?? 0);
  const [isResizing, setIsResizing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftFlexRef = useRef(leftFlex);
  const middleFlexRef = useRef(middleFlex);
  const rightFlexRef = useRef(rightFlex);
  const middlePxRef = useRef(middlePx);
  const minWidthsRef = useRef(minWidths);

  leftFlexRef.current = leftFlex;
  middleFlexRef.current = middleFlex;
  rightFlexRef.current = rightFlex;
  middlePxRef.current = middlePx;
  minWidthsRef.current = minWidths;

  // Hydrate persisted widths on mount.
  useEffect(() => {
    if (!storageKey) return;
    const stored = readWidths(storageKey);
    if (stored.left != null) setLeftFlex(stored.left);
    if (stored.right != null) setRightFlex(stored.right);
    if (stored.middle != null) {
      if (middleFixedPx != null) setMiddlePx(stored.middle);
      else setMiddleFlex(stored.middle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const handleResizeStart = useCallback(() => setIsResizing(true), []);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    writeWidths(storageKey, {
      left: leftFlexRef.current,
      middle: middleFixedPx != null ? middlePxRef.current : middleFlexRef.current,
      right: rightFlexRef.current,
    });
  }, [storageKey, middleFixedPx]);

  const handleLeftMiddleResize = useCallback((deltaX: number) => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const total =
      leftFlexRef.current + middleFlexRef.current + rightFlexRef.current;
    const raw = deltaX / (cw / total);
    const leftMin =
      ((minWidthsRef.current?.left ?? MIN_WIDTH_DEFAULT) / cw) * total;
    const middleMin =
      ((minWidthsRef.current?.middle ?? MIN_WIDTH_DEFAULT) / cw) * total;
    const delta = Math.max(
      -(leftFlexRef.current - leftMin),
      Math.min(middleFlexRef.current - middleMin, raw)
    );
    setLeftFlex(leftFlexRef.current + delta);
    setMiddleFlex(middleFlexRef.current - delta);
  }, []);

  const handleMiddleRightResize = useCallback((deltaX: number) => {
    if (!containerRef.current) return;

    // When middle is in fixed-px mode the math is direct — the drag mutates
    // middle's pixel width 1:1, right is `1fr` so it absorbs the change.
    if (middleFixedPx != null) {
      const min = minWidthsRef.current?.middle ?? MIN_WIDTH_DEFAULT;
      // Upper bound: leave room for any right-min plus the fixed left + dividers.
      const cw = containerRef.current.clientWidth;
      const fixedLeft = leftFixedPx != null && !leftHidden ? leftFixedPx : 0;
      const rightMin = minWidthsRef.current?.right ?? 0;
      const max = Math.max(min, cw - fixedLeft - rightMin);
      const next = Math.max(min, Math.min(max, middlePxRef.current + deltaX));
      setMiddlePx(next);
      return;
    }

    // Flex-ratio mode (no middleFixedPx).
    const cw = containerRef.current.clientWidth;
    const fixed = leftFixedPx != null && !leftHidden ? leftFixedPx : 0;
    const flexAvailable = Math.max(1, cw - fixed);
    const total =
      (leftFixedPx != null ? 0 : leftFlexRef.current) +
      middleFlexRef.current +
      rightFlexRef.current;
    const raw = deltaX / (flexAvailable / total);
    const middleMin =
      ((minWidthsRef.current?.middle ?? MIN_WIDTH_DEFAULT) / flexAvailable) * total;
    const rightMin =
      ((minWidthsRef.current?.right ?? MIN_WIDTH_DEFAULT) / flexAvailable) * total;
    const delta = Math.max(
      -(middleFlexRef.current - middleMin),
      Math.min(rightFlexRef.current - rightMin, raw)
    );
    setMiddleFlex(middleFlexRef.current + delta);
    setRightFlex(rightFlexRef.current - delta);
  }, [leftFixedPx, leftHidden, middleFixedPx]);

  const showLeftDivider = !leftHidden && !middleHidden;
  const showRightDivider = !middleHidden && !rightHidden;

  // Column flex styles, derived once per render.
  const leftStyle = leftHidden
    ? undefined
    : leftFixedPx != null
      ? { flexGrow: 0, flexShrink: 0, flexBasis: `${leftFixedPx}px` }
      : { flexGrow: leftFlex, flexShrink: 1, flexBasis: 0 };

  const middleStyle = middleHidden
    ? undefined
    : middleFixedPx != null
      ? { flexGrow: 0, flexShrink: 0, flexBasis: `${middlePx}px` }
      : { flexGrow: middleFlex, flexShrink: 1, flexBasis: 0 };

  // When middle is fixed-px, right is the `1fr` track (absorbs remaining
  // space). Otherwise right participates in the flex-ratio split.
  const rightStyle = rightHidden
    ? undefined
    : middleFixedPx != null
      ? { flexGrow: 1, flexShrink: 1, flexBasis: 0 }
      : { flexGrow: rightFlex, flexShrink: 1, flexBasis: 0 };

  return (
    <div className={cn("relative w-full h-full", className)}>
      <div className="absolute inset-3 flex flex-col gap-3">
        {top && <div>{top}</div>}

        <div ref={containerRef} className="flex flex-row flex-1 min-h-0">
          {/* Left column */}
          <div
            className={cn(
              "relative flex flex-col min-w-0 overflow-hidden",
              !isResizing && "transition-all duration-300",
              leftHidden ? "flex-[0_0_0px] opacity-0" : ""
            )}
            style={leftStyle}
          >
            {left}
          </div>

          {/* Divider: left–middle */}
          {showLeftDivider && (
            <div className="relative self-stretch shrink-0" style={{ width: gap }}>
              {leftResizable ? (
                overlay ? (
                  <div
                    className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2"
                    style={{ width: hitSize, zIndex: 5 }}
                  >
                    <ResizeDivider
                      axis="x"
                      size={hitSize}
                      hideCapsule={!showDivider}
                      onResize={handleLeftMiddleResize}
                      onResizeStart={handleResizeStart}
                      onResizeEnd={handleResizeEnd}
                    />
                  </div>
                ) : (
                  <ResizeDivider
                    axis="x"
                    size={gap}
                    hideCapsule={!showDivider}
                    onResize={handleLeftMiddleResize}
                    onResizeStart={handleResizeStart}
                    onResizeEnd={handleResizeEnd}
                  />
                )
              ) : null}
            </div>
          )}

          {/* Middle column */}
          <div
            className={cn(
              "relative flex flex-col min-w-0 min-h-0 overflow-hidden",
              !isResizing && "transition-all duration-300",
              middleHidden ? "flex-[0_0_0px] opacity-0" : ""
            )}
            style={middleStyle}
          >
            {middle}
          </div>

          {/* Gap between left and right when middle is hidden */}
          {!leftHidden && middleHidden && !rightHidden && (
            <div className="shrink-0" style={{ width: gap }} />
          )}

          {/* Divider: middle–right */}
          {showRightDivider && (
            <div className="relative self-stretch shrink-0" style={{ width: gap }}>
              {rightResizable ? (
                overlay ? (
                  <div
                    className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2"
                    style={{ width: hitSize, zIndex: 5 }}
                  >
                    <ResizeDivider
                      axis="x"
                      size={hitSize}
                      hideCapsule={!showDivider}
                      onResize={handleMiddleRightResize}
                      onResizeStart={handleResizeStart}
                      onResizeEnd={handleResizeEnd}
                    />
                  </div>
                ) : (
                  <ResizeDivider
                    axis="x"
                    size={gap}
                    hideCapsule={!showDivider}
                    onResize={handleMiddleRightResize}
                    onResizeStart={handleResizeStart}
                    onResizeEnd={handleResizeEnd}
                  />
                )
              ) : null}
            </div>
          )}

          {/* Right column */}
          <div
            className={cn(
              "relative flex flex-col min-w-0 overflow-hidden",
              !isResizing && "transition-all duration-300",
              rightHidden ? "flex-[0_0_0px] opacity-0" : ""
            )}
            style={rightStyle}
          >
            {right}
          </div>
        </div>
      </div>
    </div>
  );
}
