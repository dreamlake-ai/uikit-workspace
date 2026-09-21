import {
  forwardRef,
  type ReactNode,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "../../lib/utils";

type NativeProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "size" | "prefix" | "className"
>;

export interface TextFieldProps extends NativeProps {
  value: string;
  /** Called with the raw string value (works directly with RHF field.onChange). */
  onChange: (value: string) => void;
  /** Leading adornment inside the field, e.g. an "@" for slugs. */
  prefix?: ReactNode;
  /** Renders a <textarea> instead of <input>. */
  multiline?: boolean;
  rows?: number;
  /** Red underline + aria-invalid when the field has an error. */
  invalid?: boolean;
  /** Green underline — for a field that has been CHECKED and passed, not
   *  merely filled in. A slug the server confirmed is free, an address that
   *  resolved. Ignored while `invalid`. */
  valid?: boolean;
  /** Message under the field. Takes the state's colour and a `×` or `✓`;
   *  without a state it reads as neutral helper text. */
  note?: ReactNode;
  /** Use the monospace face (slugs, handles, ids). */
  mono?: boolean;
  className?: string;
}

const FIELD_BASE =
  "w-full bg-transparent outline-none text-uikit-13 text-uikit-ink placeholder:text-uikit-muted placeholder:opacity-70 disabled:opacity-50";

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      value,
      onChange,
      prefix,
      multiline,
      rows = 4,
      invalid,
      valid,
      note,
      mono,
      disabled,
      className,
      ...rest
    },
    ref,
  ) {
    // Underline-only field: a single bottom rule, no boxed border, no radius, no
    // horizontal padding.
    //
    // The rule does NOT react to focus. It carries one thing — whether what is
    // typed has been judged — so it is faint at rest, red when validation failed
    // and green when it passed. An accent underline on focus spends that channel
    // on "the caret is here", which the caret already says, and then a field that
    // is merely focused looks exactly like a field that has been approved.
    const shell = cn(
      "flex items-center gap-1.5 border-b bg-transparent px-0 py-1.5",
      "transition-[border-color] duration-[120ms]",
      invalid
        ? "border-uikit-danger"
        : valid
          ? "border-uikit-tone-green"
          : "border-uikit-faint",
      disabled && "opacity-60 cursor-not-allowed",
      className,
    );
    const fieldCls = cn(
      FIELD_BASE,
      mono && "font-uikit-mono",
      !mono && "font-uikit-ui",
    );

    const noteRow = note != null && (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-uikit-mono text-[10.5px] tracking-uikit-snug leading-[1.4]",
          invalid
            ? "text-uikit-danger opacity-90"
            : valid
              ? "text-uikit-tone-green opacity-90"
              : "text-uikit-muted opacity-70",
        )}
      >
        {(invalid || valid) && (
          <span aria-hidden className="font-semibold">
            {invalid ? "\u00d7" : "\u2713"}
          </span>
        )}
        {note}
      </span>
    );

    if (multiline) {
      return (
        <div className="flex flex-col gap-1.5">
          <div className={cn(shell, "items-start")}>
            <textarea
              rows={rows}
              value={value}
              disabled={disabled}
              aria-invalid={invalid || undefined}
              onChange={(e) => onChange(e.target.value)}
              className={cn(fieldCls, "resize-none leading-[1.5] py-0.5")}
              {...(rest as unknown as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          </div>
          {noteRow}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1.5">
        <div className={shell}>
          {prefix != null && (
            <span className="shrink-0 font-uikit-mono text-uikit-12 text-uikit-muted opacity-70 select-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            value={value}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            onChange={(e) => onChange(e.target.value)}
            className={fieldCls}
            {...rest}
          />
        </div>
        {noteRow}
      </div>
    );
  },
);
