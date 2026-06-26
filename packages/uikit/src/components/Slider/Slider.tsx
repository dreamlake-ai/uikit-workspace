import {
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "../../lib/utils";

export interface SliderProps extends Omit<
  ComponentProps<"div">,
  "defaultValue" | "onChange"
> {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** Draw step tick markers along the track. */
  showStep?: boolean;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function roundToStep(v: number, min: number, step: number) {
  if (!step) return v;
  const snapped = Math.round((v - min) / step) * step + min;
  // Avoid floating point dust (e.g. 0.30000000000000004).
  return Number(snapped.toPrecision(10));
}

/**
 * Horizontal range slider with single or multiple thumbs. Pointer drag +
 * arrow-key stepping, optional tick markers.
 *
 * Drop-in for the legacy `@vuer-ai/vuer-uikit` Slider (which wrapped
 * `@radix-ui/react-slider`). Reimplemented dependency-free and restyled to
 * DreamLake accent/faint tokens.
 */
export const Slider = forwardRef<HTMLDivElement, SliderProps>(function Slider(
  {
    className,
    value,
    defaultValue,
    onValueChange,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    showStep = false,
    ...props
  },
  ref,
) {
  const trackRef = useRef<HTMLDivElement>(null);
  const activeThumb = useRef<number | null>(null);
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<number[]>(defaultValue ?? [min]);
  const values = isControlled ? value! : internal;

  const range = max - min || 1;
  const percent = (v: number) => ((clamp(v, min, max) - min) / range) * 100;

  const commit = useCallback(
    (next: number[]) => {
      if (!isControlled) setInternal(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const setThumb = useCallback(
    (index: number, raw: number) => {
      const snapped = clamp(roundToStep(raw, min, step), min, max);
      if (values[index] === snapped) return;
      const next = values.slice();
      next[index] = snapped;
      // Keep thumbs ordered so multi-thumb ranges don't cross.
      next.sort((a, b) => a - b);
      commit(next);
    },
    [values, min, max, step, commit],
  );

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return min;
      const rect = track.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / (rect.width || 1), 0, 1);
      return min + ratio * range;
    },
    [min, range],
  );

  const nearestThumb = useCallback(
    (raw: number) => {
      let best = 0;
      let bestDist = Infinity;
      values.forEach((v, i) => {
        const d = Math.abs(v - raw);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    },
    [values],
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    const raw = valueFromClientX(e.clientX);
    const index = nearestThumb(raw);
    activeThumb.current = index;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setThumb(index, raw);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || activeThumb.current === null) return;
    setThumb(activeThumb.current, valueFromClientX(e.clientX));
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    activeThumb.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  };

  const onKeyDown = (index: number) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const delta =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? step
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -step
          : 0;
    if (delta === 0) return;
    e.preventDefault();
    setThumb(index, values[index] + delta);
  };

  const ticks = useMemo(() => {
    if (!showStep || !step) return [];
    const count = Math.ceil(range / step);
    return Array.from({ length: count + 1 }, (_, i) => min + i * step);
  }, [showStep, step, range, min]);

  const lo = percent(Math.min(...values));
  const hi = percent(Math.max(...values));

  return (
    <div
      ref={ref}
      data-slot="slider"
      data-disabled={disabled || undefined}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      {...props}
    >
      <div
        ref={trackRef}
        data-slot="slider-track"
        className="relative h-0.5 w-full grow overflow-visible rounded-full bg-uikit-faint"
      >
        <div
          data-slot="slider-range"
          className={cn(
            "absolute h-full rounded-full",
            disabled ? "bg-uikit-ink-12" : "bg-uikit-accent",
          )}
          style={{
            left: `${values.length > 1 ? lo : 0}%`,
            right: `${100 - hi}%`,
          }}
        />
        {ticks.map((t, i) => (
          <span
            key={i}
            data-slot="slider-step"
            className={cn(
              "absolute top-1/2 block h-[5px] w-px -translate-x-1/2 -translate-y-1/2 rounded-[1px]",
              t < Math.min(...values) || t > Math.max(...values)
                ? "bg-uikit-ink-12"
                : "bg-uikit-accent",
            )}
            style={{ left: `${percent(t)}%` }}
          />
        ))}
      </div>

      {values.map((v, i) => (
        <div
          key={i}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={v}
          aria-disabled={disabled || undefined}
          data-slot="slider-thumb"
          onKeyDown={onKeyDown(i)}
          className={cn(
            "absolute h-4 w-[0.6rem] -translate-x-1/2 shrink-0 rounded-[3px] outline-none",
            "transition-[box-shadow] hover:cursor-ew-resize hover:ring-4 focus-visible:ring-4",
            disabled
              ? "pointer-events-none bg-uikit-ink-12"
              : "bg-uikit-accent ring-uikit-accent/40",
          )}
          style={{ left: `${percent(v)}%` }}
        />
      ))}
    </div>
  );
});
