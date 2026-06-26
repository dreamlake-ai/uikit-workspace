import {
  CSSProperties,
  forwardRef,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { InputSlot, type InputRootProps } from "../../Input";
import { InputNumber } from "./input-number";
import { cn } from "../../../lib/utils";

const getHoverElementAndIndex = (
  element: Element | null,
  inputs: Map<string, HTMLInputElement | null>,
) => {
  if (!element) return null;
  const container = element?.closest("[data-input]");

  const currentInput = container?.querySelector("input");

  if (!currentInput) return null;

  return Array.from(inputs.values()).indexOf(currentInput);
};

// down y x none
const changeElementsHoverState = (
  inputs: Map<string, HTMLInputElement | null>,
  range: [number | null, number | null],
  changed: "x" | "y" | "none",
) => {
  const [first, last] = range;
  Array.from(inputs.values()).forEach((input, i) => {
    const container = input?.closest("[data-input]");
    if (first === null || last === null) {
      container?.setAttribute("data-hover", "none");
    } else if (i >= Math.min(first, last) && i <= Math.max(first, last)) {
      container?.setAttribute(
        "data-hover",
        changed !== "none" ? changed : "down",
      );
    } else {
      container?.setAttribute("data-hover", "none");
    }
  });
};

export interface InputNumbersProps extends Omit<
  InputRootProps,
  | "prefix"
  | "suffix"
  | "value"
  | "onValueChange"
  | "step"
  | "min"
  | "max"
  | "disabled"
> {
  step?: number | number[];
  value: number[];
  prefix?: ReactNode[];
  suffix?: ReactNode[];
  /** Array of disabled states for each input field */
  disabledItems?: boolean[];
  onValuesChange?: (value: Array<number>) => void;
  /** Called when suffix area is clicked/dragged, receives array of affected indices */
  onSuffixBatchAction?: (indices: number[]) => void;
  min?: number | number[];
  max?: number | number[];
  gridAutoFlow?: "column" | "row";
  columns?: number;
  rows?: number;
  // Legacy props (deprecated)
  layout?: "column" | "row";
  columnMajor?: boolean;
}

export const InputNumbers = forwardRef<HTMLDivElement, InputNumbersProps>(
  function InputNumbers(
    {
      size,
      side,
      value,
      onValuesChange,
      prefix,
      suffix,
      disabledItems,
      onSuffixBatchAction,
      step = 0.1,
      min,
      max,
      gridAutoFlow,
      columns,
      rows,
      layout = "column",
      columnMajor = false,
    },
    ref,
  ) {
    const inputs = useRef<Map<string, HTMLInputElement | null>>(new Map());
    const selectRange = useRef<[number | null, number | null]>([null, null]);
    const inputChange = useRef(false);
    const [isDragging, setIsDragging] = useState(false);
    const [cursorState, setCursorState] = useState<
      "default" | "dragging-y" | "dragging-x"
    >("default");
    const dragDirection = useRef<"x" | "y" | "none">("none");
    const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const initialDragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const accumulatedDelta = useRef(0);
    const isSuffixDrag = useRef(false);
    const lastMouseMoveTime = useRef<number>(0);
    const accumulatedValues = useRef<number[]>(value);

    const applyConstraints = useCallback(
      (numValue: number, index: number): number => {
        const currentMin = Array.isArray(min) ? min[index] : min;
        const currentMax = Array.isArray(max) ? max[index] : max;

        if (currentMin !== undefined && numValue < currentMin) {
          return currentMin;
        }
        if (currentMax !== undefined && numValue > currentMax) {
          return currentMax;
        }

        return numValue;
      },
      [min, max],
    );

    const stopClick = useCallback(() => {
      const stopClick = (e: Event) => {
        e.stopPropagation();
        e.preventDefault();
        document.removeEventListener("click", stopClick, true);
      };
      document.addEventListener("click", stopClick, true);
    }, []);

    const handleMouseDown = useCallback(
      (e: ReactMouseEvent) => {
        if (e.button !== 0) return; // Only left mouse button

        // e.preventDefault();
        e.stopPropagation();

        // Check if clicking on suffix area (InputSlot with data-side="right")
        const target = e.target as HTMLElement;
        const suffixElement = target.closest('[data-side="right"]');
        isSuffixDrag.current = !!suffixElement;

        setIsDragging(true);
        setCursorState("dragging-y"); // Start with ns-resize cursor
        dragStart.current = { x: e.clientX, y: e.clientY };
        initialDragStart.current = { x: e.clientX, y: e.clientY };
        accumulatedDelta.current = 0;
        inputChange.current = false;
        dragDirection.current = "none";
        lastMouseMoveTime.current = Date.now();
        accumulatedValues.current = [...value];

        selectRange.current[0] = getHoverElementAndIndex(
          document.elementFromPoint(e.clientX, e.clientY),
          inputs.current,
        );
      },
      [value],
    );

    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!isDragging) return;

        e.preventDefault();
        e.stopPropagation();

        const deltaX = e.clientX - dragStart.current.x;
        const now = Date.now();
        const timeDelta = Math.max(1, now - lastMouseMoveTime.current); // Avoid division by zero
        lastMouseMoveTime.current = now;

        // Calculate mouse velocity (pixels per millisecond)
        const velocity = Math.abs(deltaX) / timeDelta;
        // Scale velocity to a reasonable multiplier (base 1.0 at ~1px/ms)
        const velocityMultiplier = Math.max(0.5, Math.min(3, velocity * 2));

        // Determine drag direction - allow switching from Y to X when moving horizontally
        const totalDeltaX = e.clientX - initialDragStart.current.x;
        const totalDeltaY = e.clientY - initialDragStart.current.y;

        if (dragDirection.current === "none") {
          // Initial direction detection - prefer vertical first
          if (Math.abs(totalDeltaY) > 2 || Math.abs(totalDeltaX) > 2) {
            dragDirection.current = "y"; // Start with vertical
            setCursorState("dragging-y");

            Array.from(inputs.current.values()).forEach((input) => {
              input?.blur();
            });
          }
        } else if (
          dragDirection.current === "y" &&
          Math.abs(totalDeltaX) > 5 &&
          !isSuffixDrag.current
        ) {
          // Allow switching from Y to X when significant horizontal movement (but not for suffix drag)
          dragDirection.current = "x";
          setCursorState("dragging-x");
        }

        // Handle horizontal dragging (value change) - skip if suffix drag
        if (dragDirection.current === "x" && !isSuffixDrag.current) {
          // Apply velocity-dependent scaling to the delta
          accumulatedDelta.current += (deltaX / 2) * velocityMultiplier;
          dragStart.current = { x: e.clientX, y: e.clientY };

          // For horizontal dragging, ensure we have a valid range
          if (selectRange.current[1] === null) {
            selectRange.current[1] = selectRange.current[0];
          }

          if (
            Math.abs(accumulatedDelta.current) >= (inputChange.current ? 1 : 5)
          ) {
            const multiplyStep = e.shiftKey ? 5 : e.altKey ? 1 / 5 : 1;

            const newValues = accumulatedValues.current.map((v, i) => {
              const [first, last] = selectRange.current;
              if (first === null || last === null) {
                return v;
              } else if (
                i <= Math.max(first, last) &&
                i >= Math.min(first, last)
              ) {
                const currentStep = Array.isArray(step)
                  ? (step[i] ?? 0.1)
                  : step;
                let newVal = Number(
                  (
                    (v || 0) +
                    Math.floor(accumulatedDelta.current) *
                      currentStep *
                      multiplyStep
                  ).toFixed(6),
                );

                newVal = applyConstraints(newVal, i);

                return newVal;
              } else {
                return v;
              }
            });
            accumulatedValues.current = newValues;
            onValuesChange?.(newValues);
            accumulatedDelta.current = 0;
            inputChange.current = true;
          }

          changeElementsHoverState(inputs.current, selectRange.current, "x");
          stopClick();
        }
        // Handle vertical dragging (selection)
        else if (dragDirection.current === "y") {
          const currentElement = document.elementFromPoint(
            e.clientX,
            e.clientY,
          );
          const currentIndex = getHoverElementAndIndex(
            currentElement,
            inputs.current,
          );
          selectRange.current[1] = currentIndex ?? selectRange.current[1];

          changeElementsHoverState(inputs.current, selectRange.current, "y");
          stopClick();
        }
        // Initial state - show ns-resize cursor
        else {
          dragStart.current = { x: e.clientX, y: e.clientY };
          changeElementsHoverState(inputs.current, selectRange.current, "y");
          stopClick();
        }
      },
      [isDragging, onValuesChange, step, stopClick, applyConstraints],
    );

    const handleMouseUp = useCallback(() => {
      if (!isDragging) return;

      // If suffix drag/click, call the batch action callback
      if (isSuffixDrag.current && onSuffixBatchAction) {
        const [first, last] = selectRange.current;
        if (first !== null) {
          // If last is null or equals first, treat as single click
          const actualLast = last === null || last === first ? first : last;
          const minIndex = Math.min(first, actualLast);
          const maxIndex = Math.max(first, actualLast);
          const indices = Array.from(
            { length: maxIndex - minIndex + 1 },
            (_, i) => minIndex + i,
          );
          onSuffixBatchAction(indices);
        }
      }

      setIsDragging(false);
      setCursorState("default");
      selectRange.current = [null, null];
      inputChange.current = false;
      dragDirection.current = "none";
      isSuffixDrag.current = false;
      changeElementsHoverState(inputs.current, selectRange.current, "none");
    }, [isDragging, onSuffixBatchAction]);

    // Add global mouse event listeners
    useEffect(() => {
      if (isDragging) {
        const handleGlobalMouseMove = (e: MouseEvent) => {
          handleMouseMove(e);
        };
        const handleGlobalMouseUp = () => {
          handleMouseUp();
        };

        document.addEventListener("mousemove", handleGlobalMouseMove);
        document.addEventListener("mouseup", handleGlobalMouseUp);

        return () => {
          document.removeEventListener("mousemove", handleGlobalMouseMove);
          document.removeEventListener("mouseup", handleGlobalMouseUp);
        };
      }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    if (value?.length === 0) {
      throw new Error("`value` cannot be an empty array");
    }

    // Determine the actual grid flow mode
    const actualGridAutoFlow = gridAutoFlow || layout || "row";

    // Use grid layout if we have columns or rows specified, or if layout is 'row'
    const useGrid =
      columns || rows || actualGridAutoFlow === "row" || layout === "row";

    // Create inline styles for grid
    const gridStyles: CSSProperties = {};
    if (useGrid) {
      gridStyles.display = "grid";
      gridStyles.gridAutoFlow = actualGridAutoFlow;

      if (columns) {
        gridStyles.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
      }
      if (rows) {
        gridStyles.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
      }

      // Legacy column-major support
      if (columnMajor && layout === "row") {
        gridStyles.gridAutoFlow = "column";
        if (!rows && columns) {
          gridStyles.gridTemplateRows = `repeat(${Math.ceil(value.length / columns)}, minmax(0, 1fr))`;
        }
      }
    }

    const handleChange = useCallback(
      (change: number, index: number) => {
        const newValues = value.map((v, i) => {
          return i === index ? change : v;
        });

        onValuesChange?.(newValues);
      },
      [onValuesChange, value],
    );

    return (
      <div
        ref={ref}
        onMouseDown={handleMouseDown}
        className={cn([
          "gap-1 touch-none select-none",
          !useGrid && "flex flex-col",
          cursorState === "default" && "cursor-crosshair",
          cursorState === "dragging-y" && "cursor-ns-resize",
          cursorState === "dragging-x" && "cursor-col-resize",
          "data-[hover=down]:bg-uikit-ink-8",
          "data-[hover=x]:bg-uikit-ink-8",
          "data-[hover=y]:bg-uikit-ink-8",
          "data-[hover=x]:cursor-col-resize",
          "data-[hover=y]:cursor-ns-resize",
        ])}
        style={useGrid ? gridStyles : undefined}
      >
        {(Array.isArray(value) ? value : []).map((item, index) => {
          const isDisabled = disabledItems?.[index] ?? false;
          return (
            <InputNumber
              key={index}
              ref={(r) => {
                inputs.current.set(index.toString(), r);
                return () => {
                  inputs.current.delete(index.toString());
                };
              }}
              min={Array.isArray(min) ? min[index] : min}
              max={Array.isArray(max) ? max[index] : max}
              size={size}
              side={side}
              type="number"
              step={Array.isArray(step) ? (step[index] ?? 0.1) : step}
              value={item}
              disabled={isDisabled}
              onValuesChange={(v) => handleChange(v, index)}
              cursorState={cursorState}
              data-hover="none"
              data-input-index={index}
            >
              {prefix?.[index] && (
                <InputSlot
                  side="left"
                  className={cn(
                    "cursor-text",
                    "group-data-[hover=x]/number-input:cursor-col-resize",
                    "group-data-[hover=y]/number-input:cursor-ns-resize",
                  )}
                >
                  {prefix[index]}
                </InputSlot>
              )}
              {suffix?.[index] && (
                <InputSlot
                  side="right"
                  className={cn(
                    "cursor-none",
                    "group-data-[hover=x]/number-input:cursor-col-resize",
                    "group-data-[hover=y]/number-input:cursor-ns-resize",
                  )}
                >
                  {suffix[index]}
                </InputSlot>
              )}
            </InputNumber>
          );
        })}
      </div>
    );
  },
);
