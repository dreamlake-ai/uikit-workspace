// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Timeline } from "./Timeline";
import type { Segment } from "./types";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | null = null;
let host: HTMLDivElement | null = null;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  vi.restoreAllMocks();
});

function mount(segs: Segment[]) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root!.render(
      <Timeline
        trackList={[{ id: "t", name: "subtask", segments: segs }]}
        active={0}
        activeSegs={segs}
        selectedTracks={[0]}
        gutterPx={0}
        D={10}
        zoom={1}
        currentTime={0}
        allowAddTracks={false}
        onScrubDown={() => {}}
        onBoundaryDown={() => {}}
        onAddTrack={() => {}}
      />,
    ),
  );
}
const hoverFirst = () => {
  const seg = document.querySelector(".va-seglabel")!.closest(".va-seg")!;
  act(() => seg.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
};
const tip = () => document.querySelector(".va-celltip");

describe("segment hover tip", () => {
  it("stays hidden while the caption is fully visible in the lane", () => {
    mount([{ start: 0, end: 5, description: "approach", verified: false }]);
    hoverFirst();
    expect(tip()).toBeNull();
  });

  it("shows the caption when the lane cuts it off", () => {
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(40);
    mount([
      {
        start: 0,
        end: 5,
        description: "approach the blueberry from the left",
        verified: false,
      },
    ]);
    hoverFirst();
    expect(tip()?.textContent).toContain("approach the blueberry");
  });

  it("shows the pre-edit caption for an edited segment even when visible", () => {
    mount([
      {
        start: 0,
        end: 5,
        description: "grasp",
        verified: false,
        edited: true,
        original: "reach",
      },
    ]);
    hoverFirst();
    expect(tip()?.textContent).toContain("was: reach");
  });
});
