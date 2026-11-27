import { useState } from "react";
import { ToggleButton, ToggleButtons } from "@dreamlake/uikit";

/** Four preview sizes remain quiet; the adjacent two-choice toggle keeps its tint. */
export function GutterSizesSpec() {
  const [size, setSize] = useState("M");
  const [view, setView] = useState("Grid");
  return (
    <div
      data-gutter-sizes-example=""
      style={{
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <ToggleButtons
        variant="panel"
        size="sm"
        value={size}
        onValueChange={setSize}
        role="group"
        aria-label="Preview size"
      >
        {["S", "M", "L", "XL"].map((value) => (
          <ToggleButton key={value} value={value}>
            {value}
          </ToggleButton>
        ))}
      </ToggleButtons>
      <ToggleButtons
        variant="panel"
        size="sm"
        value={view}
        onValueChange={setView}
        role="group"
        aria-label="Browse layout"
      >
        {["List", "Grid"].map((value) => (
          <ToggleButton key={value} value={value}>
            {value}
          </ToggleButton>
        ))}
      </ToggleButtons>
    </div>
  );
}
