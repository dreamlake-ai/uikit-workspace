import { type ComponentProps, type ReactNode, useState } from "react";
import { cn } from "../../lib/utils";

export type CardSize = "sm" | "md" | "lg" | "xl";

const PADDING: Record<CardSize, string> = {
  sm: "p-2",
  md: "p-4",
  lg: "p-6",
  xl: "p-8",
};

// Collapse toggle sits at the content's top-right corner — its inset must match
// the card padding so it lines up with the first content row (title / tab bar).
const TOGGLE_POS: Record<CardSize, string> = {
  sm: "right-2 top-2",
  md: "right-4 top-4",
  lg: "right-6 top-6",
  xl: "right-8 top-8",
};

const BASE =
  "relative flex flex-col rounded-[var(--radius)] bg-uikit-panel border border-uikit-faint text-uikit-ink shadow-uikit-sm";

export interface CardProps extends ComponentProps<"div"> {
  size?: CardSize;
  /** Enable collapse/expand. */
  collapsible?: boolean;
  /** Content shown in place of the body while collapsed (usually a title row). */
  collapsedContent?: ReactNode;
  /** Initially collapsed (only when `collapsible`). */
  defaultCollapsed?: boolean;
}

function Chevron({ up }: { up?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        d={up ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CollapseToggle({
  collapsed,
  onClick,
}: {
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={collapsed ? "Expand" : "Collapse"}
      className="inline-flex items-center justify-center size-6 rounded-[var(--radius)] text-uikit-muted hover:bg-uikit-ink-5 hover:text-uikit-ink transition-colors cursor-pointer"
    >
      <Chevron up={!collapsed} />
    </button>
  );
}

/**
 * Container card with padding, radius, a panel surface and a hairline border.
 *
 * Ported from the legacy `@vuer-ai/vuer-uikit` Card with the same API
 * (`size`, `collapsible`, `collapsedContent`, `defaultCollapsed`, and the
 * Card{Header,Title,Description,Action,Content,Footer} family). The collapse
 * toggle uses an inline chevron (no lucide/Button dependency); restyled to
 * DreamLake panel tokens.
 */
export function Card({
  className,
  size = "lg",
  collapsible,
  collapsedContent,
  defaultCollapsed = false,
  children,
  ...props
}: CardProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (collapsible && collapsed) {
    // Mirror the expanded layout exactly: the toggle is absolutely positioned
    // top-right so it stays aligned with the content's first row (title / tab
    // bar) and doesn't jump when collapsing. `items-center` previously centered
    // it against tall collapsed content (e.g. full-height tabs), pushing it
    // below the title row.
    return (
      <div
        data-slot="card"
        className={cn(BASE, PADDING[size], className)}
        {...props}
      >
        <div className={cn("absolute", TOGGLE_POS[size])}>
          <CollapseToggle collapsed onClick={() => setCollapsed(false)} />
        </div>
        {collapsedContent}
      </div>
    );
  }

  return (
    <div
      data-slot="card"
      className={cn(BASE, PADDING[size], className)}
      {...props}
    >
      {collapsible && (
        <div className={cn("absolute", TOGGLE_POS[size])}>
          <CollapseToggle
            collapsed={false}
            onClick={() => setCollapsed(true)}
          />
        </div>
      )}
      {children}
    </div>
  );
}

const HEADER_GAP: Record<CardSize, string> = {
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-6",
};

export interface CardHeaderProps extends ComponentProps<"div"> {
  size?: CardSize;
}

export function CardHeader({
  className,
  size = "lg",
  ...props
}: CardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-row items-center justify-between",
        HEADER_GAP[size],
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-uikit-ink text-uikit-13 leading-uikit-snug font-medium",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-uikit-muted text-uikit-12 leading-uikit-snug",
        className,
      )}
      {...props}
    />
  );
}

export function CardAction({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "text-uikit-muted text-uikit-12 leading-uikit-snug font-medium",
        className,
      )}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={className} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center", className)}
      {...props}
    />
  );
}
