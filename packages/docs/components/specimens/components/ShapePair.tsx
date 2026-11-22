import type { ReactNode } from "react";
import type { ToggleShape } from "@dreamlake/uikit";

/**
 * Renders a toggle specimen twice, side by side: the square default and the
 * `shape="round"` variant. Every toggle page uses it so the two shapes are
 * always compared on the same ground.
 */
export const ShapePair = ({
  children,
  gap = 40,
}: {
  children: (shape: ToggleShape) => ReactNode;
  gap?: number;
}) => (
  <div
    style={{ display: "flex", flexWrap: "wrap", gap, alignItems: "flex-start" }}
  >
    {(["square", "round"] as const).map((shape) => (
      <div
        key={shape}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        <span
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            color: "var(--uikit-muted)",
          }}
        >
          {shape === "square" ? "square (default)" : 'shape="round"'}
        </span>
        {children(shape)}
      </div>
    ))}
  </div>
);
