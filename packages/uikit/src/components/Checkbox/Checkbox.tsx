import {
  forwardRef,
  type InputHTMLAttributes,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { cn } from "../../lib/utils";

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "children" | "size"
> {
  /** Called with the native input's next checked state. */
  onCheckedChange?: (checked: boolean) => void;
  /** Controlled mixed state. Clear it in onCheckedChange when accepting a choice. */
  indeterminate?: boolean;
}

/** Native checkbox: an accent checkmark at rest, a box on hover or keyboard focus. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    { onCheckedChange, onChange, indeterminate = false, className, ...props },
    forwardedRef,
  ) {
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(forwardedRef, () => inputRef.current!, []);
    // indeterminate is a DOM property, not an HTML attribute. Synchronize after
    // every render, including a parent rejecting a native mixed-state toggle.
    useEffect(() => {
      if (inputRef.current) inputRef.current.indeterminate = indeterminate;
    });
    return (
      <span className="relative inline-flex size-4 shrink-0 align-middle has-[:disabled]:opacity-50">
        <input
          {...props}
          ref={inputRef}
          type="checkbox"
          aria-checked={indeterminate ? "mixed" : props["aria-checked"]}
          className={cn(
            "peer m-0 size-full appearance-none transition-none duration-0 rounded-[2px] border border-transparent bg-transparent p-0 text-[var(--uikit-accent)]",
            "cursor-pointer enabled:hover:border-uikit-ink-50 focus-visible:border-[var(--uikit-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--uikit-accent)]",
            "disabled:cursor-not-allowed forced-colors:appearance-auto",
            className,
          )}
          onChange={(event) => {
            onChange?.(event);
            onCheckedChange?.(event.currentTarget.checked);
            // Browsers clear mixed on activation. It remains controlled until
            // the owner accepts the choice by setting indeterminate=false.
            event.currentTarget.indeterminate = indeterminate;
          }}
        />
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 16 16"
          className="pointer-events-none absolute inset-0 hidden size-full text-[var(--uikit-accent)] peer-checked:block peer-indeterminate:hidden forced-colors:hidden!"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3.5 8 3 3 6-6" />
        </svg>
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 16 16"
          className="pointer-events-none absolute inset-0 hidden size-full text-[var(--uikit-accent)] peer-indeterminate:block forced-colors:hidden!"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 8h8" />
        </svg>
      </span>
    );
  },
);
