import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type Ref,
  cloneElement,
  forwardRef,
  isValidElement,
} from "react";
import { cn } from "../../lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "action"
  | "danger"
  | "destructive"
  | "link";
export type ButtonSize = "sm" | "md" | "lg";
/** Text color for the transparent variants (`ghost`, `action`, `link`). */
export type ButtonTone = "default" | "muted" | "danger";

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "value"
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Text color for the transparent variants — `muted` for secondary chrome
   *  (a back arrow, a row's overflow action), `danger` for a destructive one
   *  (ink at rest, palette red under the pointer). */
  tone?: ButtonTone;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
  leftIcon?: ReactNode;
  /** Square icon-button padding. */
  icon?: boolean;
  /** Active/selected state (accent text). */
  value?: boolean;
  /** Hover surface for the transparent variants. Defaults to the neutral ink
   *  tint, which is right for a button whose label is ink. A button carrying
   *  the accent (a link-shaped action) wants `var(--accent-soft)` instead — a
   *  grey wash under blue text reads as two unrelated decisions. */
  hoverBg?: string;
  /** Renders an `<a>` with identical styling instead of a `<button>` — for
   *  navigation that should keep real link semantics (cmd-click, middle-click,
   *  the URL on hover). `target` and `rel` are forwarded with it. */
  href?: string;
  target?: AnchorHTMLAttributes<HTMLAnchorElement>["target"];
  rel?: string;
  /** Render the single child element instead of a `<button>`, merging classes. */
  asChild?: boolean;
  className?: string;
  children?: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  // The main action fills with the ACCENT, in mono, and rounds to the badge
  // step. This replaces an inverted ink fill, which made the submit button the
  // heaviest ink on a form whose fields are bare text. Hover darkens the
  // accent rather than fading it — a primary action should not look like it is
  // switching off under the pointer.
  primary:
    "bg-uikit-accent text-white " +
    "hover:bg-[color-mix(in_oklab,var(--uikit-accent)_88%,#000)] " +
    "disabled:bg-[color-mix(in_oklab,var(--uikit-accent)_38%,var(--bg))] disabled:opacity-55",
  secondary:
    "bg-transparent border border-uikit-faint text-uikit-ink hover:bg-uikit-ink-5",
  // The action you take by NOT acting — the cancel beside a primary. A bare
  // muted mono label: no fill, no border, no hover chrome, just opacity. Two
  // buttons in a footer make the reader compare two boxes; one button and one
  // label say which is the way forward.
  ghost: "text-uikit-muted opacity-80 hover:opacity-100 bg-transparent",
  // Chrome action — the borderless mono pill in a toolbar or detail header
  // (+ publish, + import, ← back). MONO and denser than `ghost` on purpose:
  // these sit in rows of metadata, not in a dialog footer. `rounded-uikit-badge`
  // for the same reason chips and menu items keep it — this is a chip-shaped
  // control, not a standalone form control on `var(--radius)`.
  action:
    "bg-transparent font-uikit-mono tracking-uikit-snug rounded-uikit-badge shrink-0 " +
    "text-uikit-ink opacity-80 hover:opacity-100 hover:bg-[var(--btn-hover-bg,var(--color-uikit-ink-5))]",
  // Same shape as `primary`, in the palette red — for a delete or disconnect
  // confirm.
  danger:
    "bg-uikit-danger text-white " +
    "hover:bg-[color-mix(in_oklab,var(--color-uikit-danger)_88%,#000)]",
  // Drop-in alias for the legacy kit's `destructive`.
  destructive:
    "bg-uikit-danger text-white " +
    "hover:bg-[color-mix(in_oklab,var(--color-uikit-danger)_88%,#000)]",
  link: "bg-transparent text-uikit-ink underline-offset-4 hover:underline !px-0",
};

// A real ladder: heights 24.5 / 30.5 / 36.5, side padding 10 / 14 / 18.
//
// Both step evenly, and the height is DECLARED rather than inherited. Left to
// itself the mono face gives an 11px label a 16.5px line box, so `sm` came out
// at 26.5px — a number nobody chose. Pinning the box to 14.5px lands `sm` on
// 24.5px, which is the height the app's pills and toolbar buttons already are,
// and lets md and lg step from it by exactly 6.
const SIZES: Record<ButtonSize, string> = {
  sm: "text-uikit-11 leading-[14.5px] px-2.5 py-[5px] gap-1",
  md: "text-uikit-12 leading-[16.5px] px-3.5 py-[7px] gap-1.5",
  lg: "text-uikit-14 leading-[18.5px] px-[18px] py-[9px] gap-1.5",
};

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: "!px-0 !py-0 size-7 gap-0",
  md: "!px-0 !py-0 size-8 gap-0",
  lg: "!px-0 !py-0 size-9 gap-0",
};

// Rest color, and where it goes under the pointer.
//
// `muted` raises to full ink on hover — it is for a button inside an already
// muted strip (the 9px uppercase count rows a file column carries), where the
// default ink made a secondary action the darkest thing in a row of labels. It
// still answers the pointer; it just stops shouting before anyone has pointed
// at it.
//
// `danger` keeps its ink until the pointer arrives — a row of permanently-red
// labels reads as an error state rather than an available action.
const TONES: Record<ButtonTone, string> = {
  default: "",
  muted: "text-uikit-muted hover:text-uikit-ink",
  danger: "hover:text-uikit-danger",
};

export interface ButtonVariantsOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
  icon?: boolean;
  value?: boolean;
  className?: string;
}

/** Composes the Button class string. Exported for drop-in parity with the
 *  legacy kit's `buttonVariants`. */
export function buttonVariants({
  variant = "primary",
  size = "md",
  tone = "default",
  icon = false,
  value = false,
  className,
}: ButtonVariantsOptions = {}) {
  return cn(
    "inline-flex items-center justify-center select-none whitespace-nowrap",
    // ONE radius, ONE padding scale and ONE typeface for every variant. A set
    // whose members round or set differently reads as parts from two kits, and
    // none of those is where a variant should carry its meaning — the fill is.
    // Mono, because that is the app's button vocabulary: the dialog footer, the
    // toolbar pill and the chrome actions are all set in it.
    "rounded-uikit-badge font-uikit-mono font-medium tracking-uikit-snug cursor-pointer outline-none",
    "transition-[background-color,opacity,border-color,color] duration-[120ms]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
    SIZES[size],
    // `ghost` paints nothing, but it keeps the shared padding: the label then
    // shares a baseline and a height with the filled button beside it, and gets
    // a real hit area instead of being a 40px run of text. Only its type is its
    // own — 11.5px, the app's cancel, which the kit's integer scale leaves to
    // an arbitrary.
    variant === "ghost" && "text-[11.5px]!",
    icon && ICON_SIZES[size],
    VARIANTS[variant],
    TONES[tone],
    // An accent label takes an accent hover wash. A grey one under blue text
    // reads as two unrelated decisions — see `hoverBg`, which this sets the
    // default for (the prop lands inline, so it still wins).
    value &&
      "opacity-100 text-uikit-accent [&_svg]:text-uikit-accent [--btn-hover-bg:var(--accent-soft)]",
    className,
  );
}

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const r of refs) {
      if (typeof r === "function") r(node);
      else if (r) (r as { current: T | null }).current = node;
    }
  };
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "sm",
      tone = "default",
      loading = false,
      leftIcon,
      icon = false,
      value = false,
      hoverBg,
      href,
      target,
      rel,
      asChild = false,
      disabled,
      children,
      className,
      style,
      type = "button",
      ...rest
    },
    ref,
  ) {
    const classes = buttonVariants({
      variant,
      size,
      tone,
      icon,
      value,
      className,
    });
    // The hover surface rides in as a custom property rather than an inline
    // `background`, so it only applies on `:hover` — an inline background would
    // paint at rest too, and CSS has no way to scope an inline style to a state.
    const styles = hoverBg
      ? ({ ...style, "--btn-hover-bg": hoverBg } as CSSProperties)
      : style;

    const body = (
      <>
        {loading && <LoadingDot />}
        {!loading && leftIcon && (
          <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        {children}
      </>
    );

    // asChild: render the provided element with button styling (legacy Slot behavior).
    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<{
        className?: string;
        style?: CSSProperties;
        ref?: Ref<HTMLButtonElement>;
      }>;
      return cloneElement(child, {
        ...rest,
        ref: mergeRefs(ref, child.props.ref),
        "data-slot": "button",
        disabled: disabled || loading || undefined,
        style: { ...styles, ...child.props.style },
        className: cn(classes, child.props.className),
      } as Record<string, unknown>);
    }

    // href: a real anchor, same styling. A disabled link has no native
    // equivalent, so it drops the href and says so to assistive tech rather
    // than staying clickable.
    if (href !== undefined) {
      const inert = disabled || loading;
      return (
        <a
          ref={ref as unknown as Ref<HTMLAnchorElement>}
          href={inert ? undefined : href}
          target={target}
          rel={rel}
          data-slot="button"
          data-loading={loading || undefined}
          aria-disabled={inert || undefined}
          className={classes}
          style={styles}
          {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {body}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        data-loading={loading || undefined}
        data-slot="button"
        className={classes}
        style={styles}
        {...rest}
      >
        {body}
      </button>
    );
  },
);

function LoadingDot() {
  return (
    <span
      aria-hidden
      className="inline-block size-3 rounded-full border-2 border-current border-r-transparent animate-spin"
    />
  );
}
