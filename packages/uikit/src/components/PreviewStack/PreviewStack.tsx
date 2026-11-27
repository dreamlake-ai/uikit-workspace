import { Children, type ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface PreviewStackProps {
  /** Ordered covers: the first is the sharp front cover. At most three render. */
  previews: ReactNode[];
  className?: string;
}

/** Decorative collection covers. The surrounding link/button owns navigation and naming. */
export function PreviewStack({ previews, className }: PreviewStackProps) {
  const layers = Children.toArray(previews).slice(0, 3);
  if (!layers.length) return null;
  return (
    <span
      className={cn("uikit-preview-stack", className)}
      aria-hidden="true"
      inert
      data-layers={layers.length}
    >
      {layers.map((preview, index) => (
        <span
          key={index}
          className="uikit-preview-stack-layer"
          data-depth={index}
        >
          {preview}
        </span>
      ))}
    </span>
  );
}
