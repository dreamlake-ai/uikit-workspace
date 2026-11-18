import { useRef, useState } from "react";
import { OutlineRail } from "@dreamlake/uikit";
export function OutlineRailSpec() {
  const ref = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState(0);
  return (
    <div>
      <label>
        Viewport position{" "}
        <input
          aria-label="Viewport position"
          type="range"
          min="0"
          max="2"
          step="0.01"
          value={start}
          onChange={(e) => setStart(Number(e.target.value))}
        />
      </label>
      <div
        ref={ref}
        style={{ position: "relative", maxWidth: 320, marginTop: 16 }}
      >
        <OutlineRail
          containerRef={ref}
          layoutKey="example"
          active={Math.floor(start)}
          viewport={{ start, end: Math.min(3, start + 1) }}
        />
        {["Overview", "Details", "Examples", "Next steps"].map(
          (text, index) => (
            <div
              key={text}
              data-outline-index={index}
              data-depth={index === 1 ? 1 : 0}
              style={{ padding: "8px 0", paddingLeft: index === 1 ? 34 : 22 }}
            >
              {text}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
