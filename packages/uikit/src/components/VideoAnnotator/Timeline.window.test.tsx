// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Timeline } from "./Timeline";
import { VideoAnnotator } from "./VideoAnnotator";
import type { Segment } from "./types";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let host: HTMLDivElement;
const segments = (n: number): Segment[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `s${i}`,
    start: i,
    end: i + 1,
    description: `segment ${i}`,
    verified: false,
  }));
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1000);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const width = this.classList.contains("va-timeline") ? parseFloat(this.style.width) * 10 : 1000;
    return {
      width,
      height: 100,
      left: 0,
      right: width,
      top: 0,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON() {},
    };
  });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
const flushFrame = () => act(() => vi.advanceTimersByTime(32));
function mountTimeline(segs = segments(10000), editable = true) {
  const onBoundaryDown = vi.fn();
  const props = {
    trackList: [{ id: "subtasks", name: "subtasks", segments: segs }],
    active: 0,
    activeSegs: segs,
    selectedTracks: [0],
    gutterPx: 0,
    D: 10000,
    zoom: 10,
    currentTime: 0,
    allowAddTracks: false,
    editable,
    onScrubDown: vi.fn(),
    onBoundaryDown,
    onAddTrack: vi.fn(),
  };
  act(() => root.render(<Timeline {...props} />));
  return props;
}
function scroll(left: number) {
  host.scrollLeft = left;
  act(() => host.dispatchEvent(new Event("scroll")));
  flushFrame();
}

describe("timeline windowing", () => {
  it("bounds mounted segments, preserves global numbers and boundary indices after scrolling", () => {
    const props = mountTimeline();
    expect(host.querySelectorAll(".va-seg").length).toBeLessThan(1300);
    scroll(5000);
    expect(host.querySelector('[data-segment-index="0"]')).toBeNull();
    expect(host.querySelector('[data-segment-index="5000"]')?.textContent).toContain("5001");
    const handle = host.querySelector('[data-boundary-index="5000"]')!;
    act(() => handle.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
    expect(props.onBoundaryDown.mock.calls[0][1]).toBe(5000);
    scroll(9000);
    expect(host.querySelector('[data-segment-index="9999"]')).not.toBeNull();
  });

  it("does not rebuild lane captions for mouse movement or playhead ticks within a segment", () => {
    const segs = segments(10000);
    const description = vi.fn(() => "observed caption");
    Object.defineProperty(segs[10], "description", { get: description });
    const props = mountTimeline(segs);
    description.mockClear();
    act(() =>
      host
        .querySelector(".va-timeline")!
        .dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 300, clientY: 60 })),
    );
    flushFrame();
    expect(document.querySelector(".va-hovertime")).not.toBeNull();
    act(() => root.render(<Timeline {...props} currentTime={0.5} />));
    expect(description).not.toHaveBeenCalled();
  });

  it("keeps tooltip numbering and clears stale portals when scrolling or leaving", () => {
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(2000);
    mountTimeline();
    scroll(5000);
    act(() =>
      host.querySelector('[data-segment-index="5000"]')!.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })),
    );
    expect(document.querySelector(".va-celltip")?.textContent).toContain("5001 segment 5000");
    scroll(6000);
    expect(document.querySelector(".va-celltip")).toBeNull();
    const timeline = host.querySelector(".va-timeline")!;
    act(() => {
      timeline.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 300 }));
      timeline.dispatchEvent(new MouseEvent("mouseleave"));
    });
    flushFrame();
    expect(document.querySelector(".va-hovertime")).toBeNull();
  });

  it("renders all segments when zoomed out and no resize handles in read-only mode", () => {
    const props = mountTimeline(segments(100), false);
    act(() => root.render(<Timeline {...props} D={100} zoom={1} />));
    expect(host.querySelectorAll(".va-seg")).toHaveLength(100);
    expect(host.querySelector(".va-handle")).toBeNull();
  });

  it("keeps every overview cell stable during low-magnification zoom", () => {
    const segs = segments(1000);
    const description = vi.fn(() => "observed caption");
    Object.defineProperty(segs[10], "description", { get: description });
    const props = mountTimeline(segs, false);
    act(() => root.render(<Timeline {...props} D={1000} zoom={1} />));
    const first = host.querySelector('[data-segment-index="0"]');
    const last = host.querySelector('[data-segment-index="999"]');
    description.mockClear();
    for (const zoom of [1.4, 2, 1]) {
      act(() => root.render(<Timeline {...props} D={1000} zoom={zoom} />));
      expect(host.querySelectorAll(".va-seg")).toHaveLength(1000);
      expect(host.querySelector('[data-segment-index="0"]')).toBe(first);
      expect(host.querySelector('[data-segment-index="999"]')).toBe(last);
    }
    expect(description).not.toHaveBeenCalled();
  });

  it("selects the model segment, not its position in the visible DOM", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const onSelectedChange = vi.fn();
    act(() =>
      root.render(
        <VideoAnnotator
          segments={segments(1000)}
          duration={1000}
          selectedIndex={0}
          onSelectedChange={onSelectedChange}
          onSegmentsChange={() => {}}
          enableKeyboard={false}
        />,
      ),
    );
    for (let i = 0; i < 7; i++) {
      act(() => (host.querySelector('[aria-label="Zoom in"]') as HTMLElement).click());
      flushFrame();
    }
    const sc = host.querySelector<HTMLElement>(".va-tlscroll")!;
    sc.scrollLeft = 5000;
    act(() => sc.dispatchEvent(new Event("scroll")));
    flushFrame();
    const cell = host.querySelector('[data-segment-index="500"]')!;
    expect(cell).not.toBeNull();
    expect([...cell.parentElement!.querySelectorAll(".va-seg")].indexOf(cell)).not.toBe(500);
    act(() => {
      cell.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 500 }));
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, clientX: 500 }));
    });
    expect(onSelectedChange).toHaveBeenLastCalledWith(500);
  });
});
