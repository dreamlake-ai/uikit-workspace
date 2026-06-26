import {
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type Ref,
  forwardRef,
  useCallback,
  useRef,
  useState,
} from "react";

import { cn } from "../../../lib/utils";
import { InputRoot, type InputRootProps } from "../../Input";

function composeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: T | null }).current = node;
    }
  };
}

/**
 * Props for the InputNumber component.
 * Extends InputRootProps with number-specific properties.
 */
export interface InputNumberProps extends InputRootProps {
  /** Current numeric value of the input */
  value: number;

  /**
   * Cursor state indicating the current interaction mode.
   * - "default": Normal text cursor
   * - "dragging-y": Vertical drag cursor (north-south resize)
   * - "dragging-x": Horizontal drag cursor (east-west resize)
   */
  cursorState: "default" | "dragging-y" | "dragging-x";

  /**
   * Callback fired when the value changes. Only called when the new value
   * differs from the current value and passes constraints.
   */
  onValuesChange?: (value: number) => void;
}

/**
 * Controlled numeric input with constraint validation and keyboard/drag
 * interaction. Min/max clamping, ArrowUp/Down stepping, constraint-on-blur.
 *
 * Ported from the legacy `@vuer-ai/vuer-uikit`; restyled to DreamLake tokens
 * (chip fill, ink-tinted drag-hover surfaces).
 */
export const InputNumber = forwardRef<HTMLInputElement, InputNumberProps>(
  function InputNumber(props, ref) {
    const {
      value,
      min,
      max,
      step,
      disabled,
      cursorState,
      children,
      onKeyDown,
      onBlur,
      onValuesChange,
      ...other
    } = props;
    const inputRef = useRef<HTMLInputElement>(null);
    const previousRef = useRef<number>(value);

    const [inputValue, setInputValue] = useState<string>(String(value));

    const applyConstraints = useCallback(
      (applyValue: number, force = false) => {
        const isMin = (min !== undefined || min !== "") && !isNaN(Number(min));
        const isMax = (max !== undefined || max !== "") && !isNaN(Number(max));

        const minValue = isMin ? Number(min) : -Infinity;
        const maxValue = isMax ? Number(max) : Infinity;

        const newValue = Math.min(Math.max(applyValue, minValue), maxValue);

        if (!force && newValue !== applyValue) {
          return;
        }

        if (newValue !== applyValue) {
          setInputValue(newValue.toString());
        }

        if (newValue === value) {
          return;
        }

        onValuesChange?.(newValue);
      },
      [min, max, value, onValuesChange],
    );

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        setInputValue(inputValue);
        if (!isNaN(Number(inputValue))) {
          applyConstraints(Number(inputValue));
        }
      },
      [applyConstraints],
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          const direction = e.key === "ArrowUp" ? 1 : -1;
          const currentValue = value ?? 0;
          const currentStep = Number(step ?? 0.1);
          const newValue = Number(
            (currentValue + direction * currentStep).toPrecision(6),
          );

          applyConstraints(newValue);
        }

        onKeyDown?.(e);
      },
      [onKeyDown, value, step, applyConstraints],
    );

    const handleBlur = useCallback(
      (e: FocusEvent<HTMLInputElement>) => {
        applyConstraints(Number(e.target.value), true);

        onBlur?.(e);
      },
      [applyConstraints, onBlur],
    );

    const handleClick = useCallback(() => {
      if (!disabled) {
        inputRef.current?.focus();
      }
    }, [disabled]);

    // Synchronize internal input value with external prop changes (e.g. drag).
    if (previousRef.current !== value && Number(inputValue) !== value) {
      setInputValue(value.toString());
      previousRef.current = value;
    }

    return (
      <InputRoot
        ref={composeRefs(inputRef, ref)}
        {...other}
        value={inputValue}
        type="number"
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onClick={handleClick}
        onBlur={handleBlur}
        className={cn([
          "group/number-input",
          "cursor-text",
          cursorState === "dragging-x" && [
            "hover:bg-uikit-chip!",
            "data-[hover=x]:hover:bg-uikit-ink-8!",
          ],
          "data-[hover=down]:bg-uikit-ink-8",
          "data-[hover=x]:bg-uikit-ink-8",
          "data-[hover=y]:bg-uikit-ink-8",
          "data-[hover=x]:cursor-col-resize",
          "data-[hover=y]:cursor-ns-resize",
          disabled && "cursor-not-allowed opacity-50",
        ])}
        inputClassName={cn([
          "cursor-text",
          "group-data-[hover=x]/number-input:cursor-col-resize",
          "group-data-[hover=y]/number-input:cursor-ns-resize",
          disabled && "cursor-not-allowed",
        ])}
      >
        {children}
      </InputRoot>
    );
  },
);
