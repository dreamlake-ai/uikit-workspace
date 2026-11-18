import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createOutlineRailGeometry } from "./geometry";

export interface OutlineRailProps {
  /** Positioned container holding rows marked data-outline-index and data-depth. */
  containerRef: RefObject<HTMLElement | null>;
  /** Change when visible rows, labels or indentation change (including folds). */
  layoutKey: string;
  active: number;
  /** Fractional heading indices at the exposed document boundaries; null hides progress. */
  viewport?: { start: number; end: number } | null;
  accent?: string;
  muted?: string;
}

/** Memo-style viewport progress: top dot, fading span, and a terminal square.
 * Rows and navigation remain owned by the consumer. No per-frame React updates. */
export function OutlineRail({
  containerRef,
  layoutKey,
  active,
  viewport,
  accent = "var(--color-accent, #d45b34)",
  muted = "var(--color-border, #d5d3d0)",
}: OutlineRailProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const tailRef = useRef<SVGPathElement>(null);
  const markerRef = useRef<SVGCircleElement>(null);
  const endRef = useRef<SVGRectElement>(null);
  const gradientRef = useRef<SVGLinearGradientElement>(null);
  const position = useRef<number | null>(null);
  const trailStart = useRef<number | null>(null);
  const paintedPath = useRef("");
  const gradientId = useId();

  const [rail, setRail] = useState({
    path: "",
    segments: [] as string[],
    points: [] as { x: number; y: number; index: number }[],
  });
  const geometry = useRef<{
    rail: typeof rail;
    lookup: ReturnType<typeof createOutlineRailGeometry>;
  } | null>(null);
  const endPoint = rail.points[rail.points.length - 1];
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function measure() {
      const parent = el!.getBoundingClientRect();
      const links = Array.from(
        el!.querySelectorAll<HTMLElement>("[data-outline-index]"),
      );
      const points: { x: number; y: number; index: number }[] = [];
      const segments: string[] = [];
      let path = "",
        x = 4,
        y = 0;
      links.forEach((link, i) => {
        const rect = link.getBoundingClientRect();
        const nextX = 4 + Number(link.dataset.depth) * 12;
        const nextY = rect.top - parent.top + rect.height / 2;
        let segment = "";
        if (!i) path = `M ${nextX} ${nextY}`;
        else if (x === nextX) segment = ` L ${nextX} ${nextY}`;
        else {
          // Center the bend in the gap, including when a heading wraps onto several lines.
          const gap = nextY - y;
          const bendHeight = Math.min(10, gap * 0.4);
          const midpoint = (y + nextY) / 2;
          const fromY = midpoint - bendHeight / 2;
          const toY = midpoint + bendHeight / 2;
          const control = bendHeight * 0.65;
          segment = ` L ${x} ${fromY} C ${x} ${fromY + control}, ${nextX} ${toY - control}, ${nextX} ${toY} L ${nextX} ${nextY}`;
        }
        if (i) {
          segments.push(`M ${x} ${y}${segment}`);
          path += segment;
        }
        x = nextX;
        y = nextY;
        points.push({
          x: nextX,
          y: nextY,
          index: Number(link.dataset.outlineIndex),
        });
      });
      // The pane can resize while typing without changing outline geometry.
      // Keep the rail identity so that observation does not restart its animation.
      setRail((previous) =>
        previous.path === path &&
        previous.points.length === points.length &&
        previous.points.every((point, i) => point.index === points[i].index)
          ? previous
          : { path, points, segments },
      );
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    let mounted = true;
    void document.fonts?.ready.then(() => {
      if (mounted) measure();
    });
    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, [containerRef, layoutKey]);
  // Typing before a heading changes its source offset, but not the rail's
  // geometry or reading position. Only retarget when these visual inputs move.
  const point = [...rail.points].reverse().find((p) => p.index <= active);
  const spanStart = viewport?.start ?? point?.index ?? active;
  const spanEnd = viewport?.end ?? point?.index ?? active;
  const hasSpan =
    viewport === undefined ? !!point : viewport !== null && active >= 0;
  useLayoutEffect(() => {
    const path = pathRef.current,
      marker = markerRef.current,
      tail = tailRef.current,
      gradient = gradientRef.current;
    if (
      !path ||
      !marker ||
      !tail ||
      !gradient ||
      typeof path.getTotalLength !== "function"
    )
      return;
    function paintEnd(reached: boolean) {
      const fill = reached ? accent : muted;
      if (endRef.current?.getAttribute("fill") !== fill)
        endRef.current?.setAttribute("fill", fill);
    }
    if (!hasSpan || !rail.points.length) {
      paintEnd(false);
      marker.style.opacity = "0";
      tail.style.opacity = "0";
      position.current = null;
      trailStart.current = null;
      return;
    }
    if (geometry.current?.rail !== rail)
      geometry.current = {
        rail,
        lookup: createOutlineRailGeometry(rail.segments, rail.points),
      };
    const lookup = geometry.current.lookup;
    const total = lookup.total;
    const target = lookup.positionAt(spanEnd);
    const from = Math.min(total, position.current ?? target);
    // The dot always marks the top of the viewport span, in either direction.
    // Retarget both ends from their painted positions without flipping the fade.
    const targetStart = Math.min(target, lookup.positionAt(spanStart));
    const fromStart = Math.min(total, trailStart.current ?? targetStart);
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let frame = 0;
    const scheduled = performance.now();
    let start: number | null = null;
    function draw(length: number, end: number) {
      position.current = length;
      trailStart.current = end;
      const head = lookup.pointAt(length);
      // The square occupies the final 3.5px above the path endpoint. Light it
      // when the painted span enters that area, rather than waiting for its center.
      paintEnd(head.y >= rail.points[rail.points.length - 1].y - 3.5);
      const tip = lookup.pointAt(end);
      marker!.setAttribute("cx", String(tip.x));
      marker!.setAttribute("cy", String(tip.y));
      marker!.style.opacity = "1";
      tail!.style.opacity = "1";
      // Presentation attributes avoid changing [style] on every frame, which
      // invalidates ancestor :has() rules across the memo's layout shell.
      tail!.setAttribute("stroke-dasharray", `${length - end} ${total + 1}`);
      tail!.setAttribute("stroke-dashoffset", String(-end));
      const span = head.y - tip.y;
      const fade = Math.min(8, span * 0.12);
      gradient!.setAttribute("x1", "0");
      gradient!.setAttribute("y1", String(head.y - fade));
      gradient!.setAttribute("x2", "0");
      gradient!.setAttribute("y2", String(head.y));
    }
    function tick(now: number) {
      // A frame timestamp can precede this effect. Negative progress eased the
      // marker backwards, and retargeting every scrolled frame dragged it to the
      // start; begin at least one frame in so continuous retargets keep moving.
      start ??= Math.min(scheduled, now - 16);
      // Leave room for scroll delivery and the active-heading commit in the
      // 400ms end-to-end response budget, including reverse travel.
      const t = Math.min(1, (now - start) / 250);
      const eased = 1 - (1 - t) ** 3;
      draw(
        from + (target - from) * eased,
        fromStart + (targetStart - fromStart) * eased,
      );
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    // Dockit's cubic ease-out, with enough frames for fluid travel while still
    // settling promptly. Retarget from the painted position, but
    // snap when folding/resizing changes the path's coordinate system.
    if (
      position.current === null ||
      reduced ||
      paintedPath.current !== rail.path
    )
      draw(target, targetStart);
    else frame = requestAnimationFrame(tick);
    paintedPath.current = rail.path;
    return () => cancelAnimationFrame(frame);
  }, [rail, hasSpan, spanStart, spanEnd, accent, muted]);
  return (
    <svg
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: 40,
        height: "100%",
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      <defs>
        <linearGradient
          id={gradientId}
          ref={gradientRef}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor={accent} />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        ref={pathRef}
        d={rail.path}
        fill="none"
        stroke={muted}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        ref={tailRef}
        d={rail.path}
        fill="none"
        stroke={`url(#${gradientId})`}
        style={{ opacity: 0 }}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {endPoint && (
        <rect
          data-outline-end
          ref={endRef}
          x={endPoint.x - 3.5}
          y={endPoint.y - 3.5}
          width={7}
          height={7}
          fill={muted}
        />
      )}
      <circle
        data-outline-viewport-start
        ref={markerRef}
        r={3.5}
        fill={accent}
        style={{ opacity: 0 }}
      />
    </svg>
  );
}
