import {
  type HTMLProps,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
} from "react";

export interface WheelZoomContextProps extends HTMLProps<HTMLDivElement> {
  /** Current view start position */
  viewStart: number;
  /** Current view duration/viewWindow */
  viewDuration: number;
  /** Callback when view start changes */
  onViewStartChange: (newStart: number) => void;
  /** Callback when view duration/viewWindow changes */
  onWindowChange: (newDuration: number) => void;
  /** Minimum zoom viewWindow duration in seconds (default: 0.01) */
  minWindow?: number;
  /** Maximum zoom viewWindow duration in seconds (default: Infinity) */
  maxWindow?: number;
  /** Zoom factor for mouse wheel zoom (default: 1.1) */
  zoomFactor?: number;
  /** Enable wheel handling for pan and zoom (default: true) */
  enabled?: boolean;
  /** Children elements to wrap with wheel zoom functionality */
  children: ReactNode;
  /** Additional CSS classes for the wrapper */
  className?: string;
}

/**
 * Wraps its children with wheel zoom + pan. Uses native (passive: false) wheel
 * handling so it can prevent the page from scrolling.
 *
 * - Normal wheel: pan horizontally and vertically
 * - Shift/Alt + wheel: zoom in/out while keeping the cursor position stable
 */
export function WheelZoomContext({
  ref,
  className,
  viewStart,
  viewDuration,
  onViewStartChange,
  onWindowChange,
  minWindow = 0.01,
  maxWindow = Infinity,
  zoomFactor = 1.1,
  enabled = true,
  children,
}: WheelZoomContextProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const containerRef = (ref as RefObject<HTMLDivElement>) || localRef;

  // Native event listener to prevent default scrolling
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
    };

    // Add passive: false to ensure preventDefault works
    container.addEventListener("wheel", preventScroll, { passive: false });

    return () => {
      container.removeEventListener("wheel", preventScroll);
    };
  }, [enabled]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!enabled) return;

      const container = containerRef.current;
      if (!container) return;

      if (e.shiftKey || e.altKey) {
        // Zoom: maintain cursor position
        const rect = container.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorRatio = cursorX / container.offsetWidth;
        const timeAtCursor = viewStart + cursorRatio * viewDuration;

        // Calculate new duration
        const scaleFactor = e.deltaY < 0 ? 1 / zoomFactor : zoomFactor;
        const newDuration = Math.max(
          minWindow,
          Math.min(maxWindow, viewDuration * scaleFactor),
        );

        if (newDuration === viewDuration) return;

        // Adjust view start to keep cursor position stable
        const newViewStart = timeAtCursor - cursorRatio * newDuration;

        onWindowChange(newDuration);
        onViewStartChange(newViewStart);
      } else {
        // Pan: convert wheel delta to time offset
        const panAmount =
          ((e.deltaX + e.deltaY) / container.offsetWidth) * viewDuration;
        onViewStartChange(viewStart + panAmount);
      }
    },
    [
      enabled,
      viewStart,
      viewDuration,
      onViewStartChange,
      onWindowChange,
      minWindow,
      maxWindow,
      zoomFactor,
    ],
  );

  return (
    <div ref={containerRef} className={className} onWheel={handleWheel}>
      {children}
    </div>
  );
}
