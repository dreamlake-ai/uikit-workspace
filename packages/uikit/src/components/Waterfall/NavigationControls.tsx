import { ChevronLeft, ChevronRight } from "lucide-react";
import { type MouseEvent } from "react";

import { formatDuration } from "./utils";

export interface NavigationControlsProps {
  viewDuration: number;
  handlePan: (direction: "left" | "right") => void;
  handleZoomDragStart: (e: MouseEvent) => void;
}

export function NavigationControls({
  viewDuration,
  handlePan,
  handleZoomDragStart,
}: NavigationControlsProps) {
  return (
    <div className="sticky left-1/2 z-20 w-max">
      {/* Square-with-rounded-corners, not a stadium. Its children are 24px
          icon buttons at the badge step, and the shell carries p-1 around
          them: 6 + 4 = 10, so the outer curve is concentric with the inner
          ones instead of swallowing them. */}
      <div className="bg-uikit-panel/75 flex items-center gap-2 rounded-[10px] p-1 text-uikit-13 shadow-uikit-soft backdrop-blur-[2px]">
        <button
          onClick={() => handlePan("left")}
          className="hover:bg-uikit-ink-5 rounded-uikit-badge p-1"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span
          className="text-uikit-11 hover:bg-uikit-ink-5 rounded-uikit-badge w-24 cursor-col-resize px-1 py-0.5 text-center font-uikit-mono transition-colors select-none"
          onMouseDown={handleZoomDragStart}
        >
          {formatDuration(viewDuration)}
        </span>
        <button
          onClick={() => handlePan("right")}
          className="hover:bg-uikit-ink-5 rounded-uikit-badge p-1"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
