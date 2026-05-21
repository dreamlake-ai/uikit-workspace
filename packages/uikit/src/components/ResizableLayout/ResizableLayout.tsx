import { ReactNode, useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { ResizeDivider } from "./ResizeDivider";

export interface ResizableLayoutProps {
  left: ReactNode;
  middle: ReactNode;
  right: ReactNode;
  top?: ReactNode;
  defaultWidths?: { left?: number; middle?: number; right?: number };
  /** Minimum pixel width for each column. Default 80px per column. */
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
  /** Optional toggle button on the left divider. Only rendered when `showToggle` is true. */
  onToggleLeft?: () => void;
  /** Optional toggle button on the right divider. Only rendered when `showToggle` is true. */
  onToggleRight?: () => void;
  /**
   * Show the morphing collapse-toggle button on the divider when an `onToggleLeft` /
   * `onToggleRight` callback is provided. Default false — the divider is a clean
   * 2px accent line that fades in on hover/drag (matches design).
   */
  showToggle?: boolean;
  /** Show the accent line indicator on the divider. Default true. */
  showDivider?: boolean;
  /** Width of the gap between columns in px. Default 24. */
  gap?: number;
  /**
   * Pin the left column to a fixed pixel width (`flex: 0 0 <px>`). When set,
   * the left column ignores `defaultWidths.left` / `minWidths.left` and never
   * grows with the viewport. The remaining width is divided between middle
   * and right via their flex ratios as usual. Leave undefined for the default
   * flex-ratio behavior.
   */
  leftFixedPx?: number;
  className?: string;
}

const DEFAULTS = { left: 2, middle: 3, right: 5 };

function readWidths(
  key: string | undefined,
  defaults: typeof DEFAULTS
): typeof DEFAULTS {
  if (!key) return defaults;
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? "{}");
    return {
      left: typeof stored.left === "number" ? stored.left : defaults.left,
      middle:
        typeof stored.middle === "number" ? stored.middle : defaults.middle,
      right: typeof stored.right === "number" ? stored.right : defaults.right,
    };
  } catch {
    return defaults;
  }
}

function writeWidths(key: string | undefined, widths: typeof DEFAULTS) {
  if (!key || typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(widths));
  } catch {}
}

const MIN_WIDTH_DEFAULT = 80;

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
  onToggleLeft,
  onToggleRight,
  showToggle = false,
  showDivider = true,
  gap = 24,
  leftFixedPx,
  className,
}: ResizableLayoutProps) {
  const defaults = {
    left: defaultWidths?.left ?? DEFAULTS.left,
    middle: defaultWidths?.middle ?? DEFAULTS.middle,
    right: defaultWidths?.right ?? DEFAULTS.right,
  };

  const [leftFlex, setLeftFlex] = useState(defaults.left);
  const [middleFlex, setMiddleFlex] = useState(defaults.middle);
  const [rightFlex, setRightFlex] = useState(defaults.right);
  const [isResizing, setIsResizing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftFlexRef = useRef(leftFlex);
  const middleFlexRef = useRef(middleFlex);
  const rightFlexRef = useRef(rightFlex);
  const minWidthsRef = useRef(minWidths);

  leftFlexRef.current = leftFlex;
  middleFlexRef.current = middleFlex;
  rightFlexRef.current = rightFlex;
  minWidthsRef.current = minWidths;

  useEffect(() => {
    if (!storageKey) return;
    const stored = readWidths(storageKey, defaults);
    setLeftFlex(stored.left);
    setMiddleFlex(stored.middle);
    setRightFlex(stored.right);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const handleResizeStart = useCallback(() => setIsResizing(true), []);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    writeWidths(storageKey, {
      left: leftFlexRef.current,
      middle: middleFlexRef.current,
      right: rightFlexRef.current,
    });
  }, [storageKey]);

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
    const cw = containerRef.current.clientWidth;
    // When the left column is pinned to a fixed pixel width it sits outside
    // the flex pool, so the cursor-px ↔ flex-ratio conversion has to use the
    // *remaining* width and the *remaining* flex sum. Otherwise the same px
    // delta would translate to a different flex delta depending on whether
    // left was fixed or flex-grown.
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
  }, [leftFixedPx, leftHidden]);

  const showLeftDivider = !leftHidden && !middleHidden;
  const showRightDivider = !middleHidden && !rightHidden;
  const leftToggleOn = showToggle && !!onToggleLeft;
  const rightToggleOn = showToggle && !!onToggleRight;

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
            style={
              !leftHidden
                ? leftFixedPx != null
                  ? { flexGrow: 0, flexShrink: 0, flexBasis: `${leftFixedPx}px` }
                  : { flexGrow: leftFlex, flexShrink: 1, flexBasis: 0 }
                : undefined
            }
          >
            {left}
          </div>

          {/* Divider: left–middle */}
          {showLeftDivider && (
            <div className="relative flex items-center">
              {leftToggleOn && (
                <div className="peer absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-10 w-6 h-6 flex items-center justify-center group z-10">
                  <button
                    onClick={onToggleLeft}
                    title="Collapse left panel"
                    className="cursor-pointer size-1.5 rounded-full bg-gray-200 group-hover:bg-gray-400 dark:bg-gray-800 group-hover:size-6 transition-all flex items-center justify-center origin-center"
                  >
                    <ChevronLeft className="w-0 h-0 group-hover:size-4 transition-all text-white" />
                  </button>
                </div>
              )}
              <div
                className={cn(
                  "self-stretch",
                  leftToggleOn &&
                    "[clip-path:inset(0_round_9999px)] peer-hover:[clip-path:inset(10px_0_0_0_round_9999px)] transition-[clip-path] duration-300"
                )}
              >
                {leftResizable ? (
                  <ResizeDivider
                    axis="x"
                    size={gap}
                    hideCapsule={!showDivider}
                    onResize={handleLeftMiddleResize}
                    onResizeStart={handleResizeStart}
                    onResizeEnd={handleResizeEnd}
                  />
                ) : (
                  <div style={{ width: gap }} />
                )}
              </div>
            </div>
          )}

          {/* Middle column */}
          <div
            className={cn(
              "relative flex flex-col min-w-0 min-h-0 overflow-hidden",
              !isResizing && "transition-all duration-300",
              middleHidden ? "flex-[0_0_0px] opacity-0" : ""
            )}
            style={
              !middleHidden
                ? { flexGrow: middleFlex, flexShrink: 1, flexBasis: 0 }
                : undefined
            }
          >
            {middle}
          </div>

          {/* Gap between left and right when middle is hidden */}
          {!leftHidden && middleHidden && !rightHidden && (
            <div className="shrink-0" style={{ width: gap }} />
          )}

          {/* Divider: middle–right */}
          {showRightDivider && (
            <div className="relative flex items-center">
              {rightToggleOn && (
                <div className="peer absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-10 w-6 h-6 flex items-center justify-center group z-10">
                  <button
                    onClick={onToggleRight}
                    title="Toggle right panel"
                    className="cursor-pointer size-1.5 rounded-full bg-gray-200 group-hover:bg-gray-400 dark:bg-gray-800 group-hover:size-6 transition-all flex items-center justify-center origin-center"
                  >
                    <ChevronRight className="w-0 h-0 group-hover:size-4 transition-all text-white" />
                  </button>
                </div>
              )}
              <div
                className={cn(
                  "self-stretch",
                  rightToggleOn &&
                    "[clip-path:inset(0_round_9999px)] peer-hover:[clip-path:inset(10px_0_0_0_round_9999px)] transition-[clip-path] duration-300"
                )}
              >
                {rightResizable ? (
                  <ResizeDivider
                    axis="x"
                    size={gap}
                    hideCapsule={!showDivider}
                    onResize={handleMiddleRightResize}
                    onResizeStart={handleResizeStart}
                    onResizeEnd={handleResizeEnd}
                  />
                ) : (
                  <div style={{ width: gap }} />
                )}
              </div>
            </div>
          )}

          {/* Right column */}
          <div
            className={cn(
              "relative flex flex-col min-w-0 overflow-hidden",
              !isResizing && "transition-all duration-300",
              rightHidden ? "flex-[0_0_0px] opacity-0" : ""
            )}
            style={
              !rightHidden
                ? { flexGrow: rightFlex, flexShrink: 1, flexBasis: 0 }
                : undefined
            }
          >
            {right}
          </div>
        </div>
      </div>
    </div>
  );
}
