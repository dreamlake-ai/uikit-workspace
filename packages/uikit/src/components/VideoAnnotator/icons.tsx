import type { ReactNode } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "../Tooltip";

/** Transport icon button with a portaled tooltip (uikit Tooltip → escapes any
 *  container overflow, unlike a CSS `::after` tip which gets clipped by a
 *  scrolling/split layout). The label doubles as the a11y name. */
export function TipButton({
  label,
  onClick,
  className,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className={className} aria-label={label} onClick={onClick} disabled={disabled}>
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent className="!bg-uikit-panel !text-uikit-ink border border-uikit-faint">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Sharp-cornered transport glyphs. lucide v1.24 bakes rounded corners straight
 * into its Play / Skip path geometry (arc commands), so stroke-linejoin can't
 * undo them — these use flat polygon geometry instead. Same 24x24 / stroke-2
 * box as lucide; they inherit the miter join + square caps from `.va-root svg`.
 * (ChevronLeft/Right stay lucide — their paths are plain lines, so the CSS
 * miter already sharpens them.)
 */
function glyphAttrs(size = 14) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
  } as const;
}
export function PlaySharp({ size }: { size?: number }) {
  return (
    <svg {...glyphAttrs(size)}>
      <path d="M6 4 20 12 6 20Z" fill="currentColor" />
    </svg>
  );
}
export function PauseSharp({ size }: { size?: number }) {
  return (
    <svg {...glyphAttrs(size)}>
      <rect x="6" y="4" width="4" height="16" fill="currentColor" />
      <rect x="14" y="4" width="4" height="16" fill="currentColor" />
    </svg>
  );
}
export function SkipBackSharp({ size }: { size?: number }) {
  return (
    <svg {...glyphAttrs(size)}>
      <path d="M19 4 9 12 19 20Z" fill="currentColor" />
      <path d="M5 5 5 19" />
    </svg>
  );
}
export function SkipForwardSharp({ size }: { size?: number }) {
  return (
    <svg {...glyphAttrs(size)}>
      <path d="M5 4 15 12 5 20Z" fill="currentColor" />
      <path d="M19 5 19 19" />
    </svg>
  );
}
