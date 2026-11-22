import { useState } from "react";
import { ToggleButtons, ToggleButton } from "@dreamlake/uikit";
import { ShapePair } from "../ShapePair";

export const SegmentedSpec = () => {
  const [view, setView] = useState("list");
  return (
    <ShapePair>
      {(shape) => (
        <ToggleButtons shape={shape} value={view} onValueChange={setView}>
          <ToggleButton value="list">List</ToggleButton>
          <ToggleButton value="grid">Grid</ToggleButton>
          <ToggleButton value="board">Board</ToggleButton>
        </ToggleButtons>
      )}
    </ShapePair>
  );
};
