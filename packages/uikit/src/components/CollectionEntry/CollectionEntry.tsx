import { type ComponentProps, type ReactNode } from "react";
import { cn } from "../../lib/utils";

export type CollectionEntrySize = "sm" | "md";

// Row metrics step with Button's sm/md ladder; the glyph keeps one size — at
// 11px tall the back cards would collapse into the front one's border.
const SIZES: Record<CollectionEntrySize, string> = {
  sm: "gap-2 px-2.5 py-1.5 text-uikit-12",
  md: "gap-2.5 px-3.5 py-2.5 text-uikit-14",
};

/** Front-card footprint; back cards peek out behind it to the right. */
const CARD_W = 13;
const CARD_H = 17;
/** How far each successive back card sits to the right of the one before. */
const CARD_STEP = 5;
/** Extra spread per back card when the row is hovered or expanded. */
const FAN_STEP = 2;
const MAX_LAYERS = 3;

/**
 * The stack glyph: overlapping mini-cards fanned horizontally, front card on
 * the left. Divs rather than an SVG so the fan-out can ride plain CSS
 * transforms, and so each card carries the real panel/faint tokens — the
 * glyph is a miniature of the entries it stands for, in both themes.
 */
function CardStack({ layers }: { layers: number }) {
  const width = CARD_W + (MAX_LAYERS - 1) * (CARD_STEP + FAN_STEP);
  return (
    <span
      aria-hidden
      className="relative shrink-0 block"
      style={{ width, height: CARD_H }}
    >
      {Array.from({ length: layers }, (_, i) => (
        <span
          key={i}
          className={cn(
            "absolute rounded-[3px] border border-uikit-faint bg-uikit-panel",
            "transition-transform duration-150 ease-out",
          )}
          style={{
            width: CARD_W,
            // Back cards shrink toward the vertical center, so the stack
            // reads as depth rather than as a staircase.
            top: i,
            bottom: i,
            left: 0,
            opacity: 1 - i * 0.3,
            zIndex: layers - i,
            // Rest offset inline, fan via CSS var the button toggles — a
            // transform transition needs both endpoints on the same property.
            transform: `translateX(calc(${i * CARD_STEP}px + var(--uikit-stack-fan, 0) * ${i * FAN_STEP}px))`,
          }}
        />
      ))}
    </span>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
      className={cn(
        "shrink-0 transition-transform duration-150",
        expanded && "rotate-90",
      )}
    >
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface CollectionEntryProps
  extends Omit<ComponentProps<"button">, "children"> {
  /** The entry's name, e.g. a styled "# All Bindrs" node. */
  label: ReactNode;
  /** How many entries the collection holds — shown as meta, and a stack of
   *  fewer than three cards shows exactly that many. */
  count?: number;
  /** Hide the bare inline count while keeping it for the stack depth — for a
   *  host that words the number itself in `meta` ("12 bindrs"). */
  showCount?: boolean;
  /** Controlled disclosure state. Providing it (or `onExpandedChange`) makes
   *  the entry a disclosure: `aria-expanded` is set and the chevron turns. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Right-aligned meta, rendered between the count and the chevron. */
  meta?: ReactNode;
  size?: CollectionEntrySize;
}

/**
 * A list entry that stands for a COLLECTION of entries rather than one — a
 * synthetic row like "# All Bindrs" sitting among real rows. The affordance
 * is the left glyph: a horizontal stack of overlapping entry cards that fans
 * apart on hover/expansion, saying "several behind this one" the way a text
 * label cannot.
 *
 * It is a real `<button>` (full-row target, Enter/Space, focus ring) and a
 * disclosure when `expanded`/`onExpandedChange` is wired — the HOST owns what
 * expansion means (inline children, navigation, a panel). Tokens only, so it
 * holds up in both themes wherever uikit styles are loaded.
 */
export function CollectionEntry({
  label,
  count,
  showCount = true,
  expanded,
  onExpandedChange,
  meta,
  size = "md",
  className,
  style,
  onClick,
  ...props
}: CollectionEntryProps) {
  const disclosure = expanded !== undefined || onExpandedChange !== undefined;
  const isExpanded = expanded === true;
  const layers =
    count === undefined
      ? MAX_LAYERS
      : Math.min(MAX_LAYERS, Math.max(1, count));

  return (
    <button
      type="button"
      aria-expanded={disclosure ? isExpanded : undefined}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) onExpandedChange?.(!isExpanded);
      }}
      className={cn(
        "group flex w-full items-center text-left select-none cursor-pointer",
        "rounded-[var(--radius)] bg-transparent text-uikit-ink",
        // Opaque hover (ink mixed into bg, not ink over transparent), so the
        // row still occludes anything sticky behind it in a host list.
        "hover:bg-[color-mix(in_srgb,var(--ink)_5%,var(--bg))]",
        "hover:[--uikit-stack-fan:1]",
        "transition-colors duration-150",
        "outline-none focus-visible:outline-2 focus-visible:outline-uikit-accent focus-visible:-outline-offset-2",
        SIZES[size],
        className,
      )}
      style={
        {
          "--uikit-stack-fan": isExpanded ? 1 : undefined,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <CardStack layers={layers} />
      <span className="min-w-0 truncate font-semibold tracking-[-.01em]">
        {label}
      </span>
      {count !== undefined && showCount && (
        <span className="shrink-0 font-uikit-mono text-uikit-11 text-uikit-muted opacity-70">
          {count}
        </span>
      )}
      <span className="flex-1" />
      {meta != null && (
        <span className="shrink-0 font-uikit-mono text-uikit-11 text-uikit-muted">
          {meta}
        </span>
      )}
      <Chevron expanded={isExpanded} />
    </button>
  );
}
