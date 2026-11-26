import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type Ref,
} from "react";

/** Pick the longest supplied label that fits; keep the full accessible name. */
export function AdaptiveTabLabel({
  ref: forwardedRef,
  label,
  alternatives = [],
  style,
  ...props
}: Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  ref?: Ref<HTMLSpanElement>;
  label: string;
  /** Ordered from most informative to shortest; the last may ellipsize. */
  alternatives?: readonly string[];
}) {
  const root = useRef<HTMLSpanElement>(null);
  const setRoot = useCallback(
    (element: HTMLSpanElement | null) => {
      root.current = element;
      if (typeof forwardedRef === "function") return forwardedRef(element);
      if (forwardedRef) forwardedRef.current = element;
    },
    [forwardedRef],
  );
  const [index, setIndex] = useState(0);
  const candidates = [label, ...alternatives];
  const key = JSON.stringify(candidates);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const measure = () => {
      const width = element.getBoundingClientRect().width;
      if (!width) return;
      const probes = Array.from(
        element.querySelectorAll<HTMLElement>("[data-label-measure]"),
      );
      const fitting = probes.findIndex(
        (probe) => probe.getBoundingClientRect().width <= width + 0.5,
      );
      setIndex(fitting < 0 ? probes.length - 1 : fitting);
    };
    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(element);
    element
      .querySelectorAll("[data-label-measure]")
      .forEach((probe) => observer?.observe(probe));
    return () => observer?.disconnect();
  }, [key]);
  return (
    <span
      {...props}
      ref={setRoot}
      aria-label={label}
      data-adaptive-tab-label=""
      style={{
        position: "relative",
        display: "block",
        minWidth: 0,
        maxWidth: "100%",
        flex: "1 1 auto",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <span aria-hidden="true" data-label-visible="">
        {candidates[Math.min(index, candidates.length - 1)]}
      </span>
      {candidates.map((candidate, i) => (
        <span
          key={i}
          aria-hidden="true"
          data-label-measure=""
          style={{
            position: "absolute",
            visibility: "hidden",
            pointerEvents: "none",
            width: "max-content",
            left: 0,
            top: 0,
          }}
        >
          {candidate}
        </span>
      ))}
    </span>
  );
}
