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

it("fits the complete nonzero data span once and preserves later navigation", () => {
  let viewport!: ReturnType<typeof useViewport>;
  let data = [
    {
      id: "a",
      parentId: null,
      etype: "task" as const,
      label: "A",
      startTime: 38,
      duration: 20,
    },
    {
      id: "b",
      parentId: "a",
      etype: "task" as const,
      label: "B",
      startTime: 2300,
      duration: 27,
    },
  ];
  function Harness() {
    viewport = useViewport({ visibleLogData: [], initialLogData: data });
    return null;
  }
  act(() => root.render(createElement(Harness)));
  expect(viewport.viewStart).toBeLessThan(38);
  expect(viewport.viewStart + viewport.viewDuration).toBeGreaterThan(2327);
  expect(viewport.viewDuration).toBeCloseTo((2327 - 38) * 1.1);
  act(() => {
    viewport.setViewStart(100);
    viewport.setViewDuration(50);
  });
  data = [...data];
  act(() => root.render(createElement(Harness)));
  expect(viewport.viewStart).toBe(100);
  expect(viewport.viewDuration).toBe(50);
});

it.each([
  [[], 0.01, Infinity, TOTAL_DURATION * 1.5],
  [[], 0.01, 10, 10],
  [
    [
      {
        id: "event",
        parentId: null,
        etype: "info" as const,
        label: "Event",
        time: 5000,
      },
    ],
    5,
    Infinity,
    5,
  ],
  [
    [
      {
        id: "task",
        parentId: null,
        etype: "task" as const,
        label: "Task",
        startTime: 100,
        duration: 5000,
      },
    ],
    0.01,
    100,
    100,
  ],
])(
  "initial window handles empty/single-event data and limits (%j)",
  (data, minWindow, maxWindow, expected) => {
    let viewport!: ReturnType<typeof useViewport>;
    function Harness() {
      viewport = useViewport({
        visibleLogData: [],
        initialLogData: data,
        minWindow,
        maxWindow,
      });
      return null;
    }
    act(() => root.render(createElement(Harness)));
    expect(viewport.viewDuration).toBe(expected);
    expect(Number.isFinite(viewport.viewStart)).toBe(true);
  },
);

it("Waterfall initializes from its logData rather than the built-in demo span", () => {
  render();
  expect(duration()).toBe(11);
});

function renderResizable(props: Partial<Parameters<typeof Waterfall>[0]> = {}) {
  act(() =>
    root.render(
      createElement(Waterfall, { logData: [], getIcon: () => null, ...props }),
    ),
  );
}
function separator() {
  return container.querySelector('[role="separator"]') as HTMLElement;
}
function panelSize() {
  return Number(separator().getAttribute("aria-valuenow"));
}
function resizeKey(key: string, shiftKey = false) {
  act(() =>
    separator().dispatchEvent(
      new KeyboardEvent("keydown", { key, shiftKey, bubbles: true }),
    ),
  );
}
it("resizes through the real divider and keyboard within public bounds", () => {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(800);
  const onPanelWidthChange = vi.fn();
  renderResizable({
    panelWidth: 300,
    minPanelWidth: 200,
    maxPanelWidth: 500,
    onPanelWidthChange,
  });
  expect(panelSize()).toBe(300);
  expect(separator().getAttribute("aria-controls")).toBeTruthy();
  act(() =>
    separator().firstElementChild!.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, clientX: 300 }),
    ),
  );
  act(() =>
    document.dispatchEvent(new MouseEvent("mousemove", { clientX: 350 })),
  );
  act(() => document.dispatchEvent(new MouseEvent("mouseup")));
  expect(panelSize()).toBe(350);
  expect(onPanelWidthChange).toHaveBeenLastCalledWith(350);
  resizeKey("ArrowRight");
  expect(panelSize()).toBe(360);
  resizeKey("ArrowLeft", true);
  expect(panelSize()).toBe(310);
  resizeKey("End");
  expect(panelSize()).toBe(500);
  resizeKey("ArrowRight");
  expect(panelSize()).toBe(500);
  resizeKey("Home");
  expect(panelSize()).toBe(200);
  resizeKey("ArrowLeft");
  expect(panelSize()).toBe(200);
});
it("reserves timeline space as its container shrinks and restores the requested width", () => {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(800);
  const observers: { callback: ResizeObserverCallback; element?: Element }[] =
    [];
  vi.stubGlobal(
    "ResizeObserver",
    class {
      record: (typeof observers)[number];
      constructor(callback: ResizeObserverCallback) {
        this.record = { callback };
        observers.push(this.record);
      }
      observe(element: Element) {
        this.record.element = element;
      }
      unobserve() {}
      disconnect() {}
    },
  );
  renderResizable({ panelWidth: 600 });
  const observer = observers.find(
    ({ element }) => element === separator().parentElement?.parentElement,
  )!;
  expect(observer).toBeTruthy();
  const shrink = (width: number) =>
    act(() =>
      observer.callback(
        [{ contentRect: { width } } as ResizeObserverEntry],
        {} as ResizeObserver,
      ),
    );
  expect(panelSize()).toBe(600);
  shrink(400);
  expect(panelSize()).toBe(280);
  expect(separator().getAttribute("aria-valuemax")).toBe("280");
  shrink(200);
  expect(panelSize()).toBe(100);
  expect(separator().getAttribute("aria-valuemin")).toBe("100");
  shrink(800);
  expect(panelSize()).toBe(600);
});
it("can disable resizing and can reset width through panelWidth", () => {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(800);
  renderResizable({ panelWidth: 250 });
  resizeKey("ArrowRight");
  expect(panelSize()).toBe(260);
  renderResizable({ panelWidth: 400 });
  expect(panelSize()).toBe(400);
  renderResizable({ panelWidth: 400, resizable: false });
  expect(separator()).toBeNull();
});
