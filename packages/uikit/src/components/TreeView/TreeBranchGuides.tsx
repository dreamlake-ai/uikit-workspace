import { type CSSProperties } from "react";
import { cn } from "../../lib/utils";

export interface TreeBranchGuidesProps {
  /** One column per ancestor; true continues that ancestor's trunk through this row. */
  ancestors?: readonly boolean[];
  /** Draw a rounded branch into this row. Root and unresolved rows have no branch. */
  branch?: boolean;
  /** Stop the current trunk at this row's branch when there is no next sibling. */
  isLast?: boolean;
  /** Width of each nesting column in pixels. */
  step?: number;
  /** Fixed branch midpoint for a variable-height row; defaults to half its height. */
  branchOffset?: number;
  emphasis?: "normal" | "strong";
  className?: string;
  style?: CSSProperties;
}

/** Decorative per-row geometry shared by file trees and virtualized drawers.
 * Continuation flags come from the full visible hierarchy, not mounted DOM siblings. */
export function TreeBranchGuides({
  ancestors = [],
  branch = false,
  isLast = false,
  step = 20,
  branchOffset,
  emphasis = "normal",
  className,
  style,
}: TreeBranchGuidesProps) {
  const stroke = emphasis === "strong" ? 2 : 1;
  const borderColor =
    emphasis === "strong" ? "var(--tree-guide-strong)" : "var(--tree-guide)";
  return (
    <span
      aria-hidden="true"
      data-tree-guides={emphasis}
      className={cn(
        "pointer-events-none absolute inset-y-0 left-0 z-0 flex",
        className,
      )}
      style={{ ...style, opacity: 1 }}
    >
      {ancestors.map((continues, index) => (
        <span
          key={index}
          data-tree-trunk={continues || undefined}
          style={{
            width: step,
            height: "100%",
            boxSizing: "border-box",
            borderLeft: continues ? `${stroke}px solid` : undefined,
            borderColor,
          }}
        />
      ))}
      {branch && (
        <span className="relative h-full" style={{ width: step }}>
          <span
            data-tree-elbow
            className="absolute left-0 top-0 rounded-bl-md"
            style={{
              width: step / 2,
              height: branchOffset ?? "50%",
              borderLeft: `${stroke}px solid`,
              borderBottom: `${stroke}px solid`,
              borderColor,
            }}
          />
          {!isLast && (
            <span
              data-tree-trunk
              className="absolute left-0 top-0 h-full"
              style={{ borderLeft: `${stroke}px solid`, borderColor }}
            />
          )}
        </span>
      )}
    </span>
  );
}
