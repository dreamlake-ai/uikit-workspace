// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Waterfall } from "./index";
import { TOTAL_DURATION } from "./utils";
import { useViewport } from "./hooks/useViewport";

vi.mock("./NavigationControls", () => ({
  NavigationControls: ({ viewDuration, handleZoomDragStart }: any) =>
    createElement(
      "button",
      { "data-duration": viewDuration, onMouseDown: handleZoomDragStart },
      "Zoom",
    ),
}));
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(800);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function render(maxWindow?: number) {
  act(() =>
    root.render(
      createElement(Waterfall, {
        logData: [
          {
            id: "task",
            parentId: null,
            label: "Task",
            etype: "task",
            startTime: 0,
            duration: 10,
          },
        ],
        getIcon: () => null,
        maxWindow,
      }),
    ),
  );
}
function duration() {
  return Number(
    container.querySelector("[data-duration]")!.getAttribute("data-duration"),
  );
}
function wheel() {
  act(() =>
    container.querySelector("[data-duration]")!.dispatchEvent(
      new WheelEvent("wheel", {
        bubbles: true,
        shiftKey: true,
        deltaY: 100,
        clientX: 400,
      }),
    ),
  );
}
it("wheel zoom exceeds the old duration cap by default", () => {
  render();
  for (let i = 0; i < 200; i++) wheel();
  expect(duration()).toBeGreaterThan(TOTAL_DURATION * 10);
  expect(Number.isFinite(duration())).toBe(true);
});
it("wheel zoom retains an explicit maximum", () => {
  const max = TOTAL_DURATION * 2;
  render(max);
  for (let i = 0; i < 15; i++) wheel();
  expect(duration()).toBe(max);
});
it.each([undefined, TOTAL_DURATION * 2])(
  "duration drag shares the zoom maximum %s",
  (maxWindow) => {
    render(maxWindow);
    act(() =>
      container
        .querySelector("[data-duration]")!
        .dispatchEvent(
          new MouseEvent("mousedown", { bubbles: true, clientX: 0 }),
        ),
    );
    act(() =>
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: 1000 })),
    );
    act(() => document.dispatchEvent(new MouseEvent("mouseup")));
    if (maxWindow === undefined)
      expect(duration()).toBeGreaterThan(TOTAL_DURATION * 10);
    else expect(duration()).toBe(maxWindow);
  },
);

it.each([1e6, 1e12, 1e100, 1e250])(
  "keeps the ruler finite and bounded at a %s-second window",
  (window) => {
    let viewport!: ReturnType<typeof useViewport>;
    function Harness() {
      viewport = useViewport({ visibleLogData: [] });
      return null;
    }
    act(() => root.render(createElement(Harness)));
    act(() => {
      viewport.setViewStart(-window / 4);
      viewport.setViewDuration(window);
    });
    expect(viewport.ticks.length).toBeGreaterThan(1);
    expect(viewport.ticks.length).toBeLessThanOrEqual(13);
    expect(viewport.ticks.every(({ time }) => Number.isFinite(time))).toBe(
      true,
    );
    expect(viewport.ticks[0].time).toBeLessThanOrEqual(-window / 4);
    expect(viewport.ticks.at(-1)!.time).toBeGreaterThanOrEqual(window * 0.75);
  },
);

it("duration drag respects the minimum and ignores numeric overflow", () => {
  render();
  const startDrag = () =>
    act(() =>
      container
        .querySelector("[data-duration]")!
        .dispatchEvent(
          new MouseEvent("mousedown", { bubbles: true, clientX: 0 }),
        ),
    );
  const move = (clientX: number) =>
    act(() => document.dispatchEvent(new MouseEvent("mousemove", { clientX })));
  const stop = () =>
    act(() => document.dispatchEvent(new MouseEvent("mouseup")));
  startDrag();
  move(-10000);
  stop();
  expect(duration()).toBe(0.01);
  startDrag();
  move(1000000);
  stop();
  expect(duration()).toBe(0.01);
});
