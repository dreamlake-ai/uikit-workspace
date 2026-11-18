// @vitest-environment jsdom
import React, { act, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { OutlineRail } from "./OutlineRail";

let host: HTMLDivElement, root: Root;
let frames: FrameRequestCallback[];
function Spec({ start = 0, end = 1, hidden = false, folded = false }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref}>
      <OutlineRail
        containerRef={ref}
        layoutKey={String(folded)}
        active={0}
        viewport={hidden ? null : { start, end }}
        accent="red"
        muted="gray"
      />
      {[0, ...(folded ? [] : [1]), 2].map((index) => (
        <div
          key={index}
          data-outline-index={index}
          data-depth={index === 1 ? 1 : 0}
        >
          Heading {index}
        </div>
      ))}
    </div>
  );
}
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  frames = [];
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((cb) => {
      frames.push(cb);
      return frames.length;
    }),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      return {
        top: Number(this.dataset.outlineIndex ?? 0) * 30,
        height: 20,
      } as DOMRect;
    },
  );
  Object.defineProperty(SVGElement.prototype, "getTotalLength", {
    configurable: true,
    value() {
      const n = this.getAttribute("d")
        .match(/[-\d.]+/g)
        .map(Number);
      return n.at(-1) - n[1];
    },
  });
  Object.defineProperty(SVGElement.prototype, "getPointAtLength", {
    configurable: true,
    value(length: number) {
      const n = this.getAttribute("d")
        .match(/[-\d.]+/g)
        .map(Number);
      return { x: n[0], y: n[1] + length };
    },
  });
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (SVGElement.prototype as any).getTotalLength;
  delete (SVGElement.prototype as any).getPointAtLength;
});
const render = (props: Parameters<typeof Spec>[0]) =>
  act(() => root.render(<Spec {...props} />));
const dotY = () =>
  Number(
    host.querySelector("[data-outline-viewport-start]")!.getAttribute("cy"),
  );
const terminal = () =>
  host.querySelector("[data-outline-end]")!.getAttribute("fill");
const settle = () =>
  act(() => frames.splice(0).forEach((cb) => cb(performance.now() + 1000)));
it("marks the viewport top and lights the square only when the animated bottom arrives", () => {
  render({ start: 0.25, end: 1 });
  expect(dotY()).toBeCloseTo(17.5);
  expect(terminal()).toBe("gray");
  render({ start: 1, end: 2 });
  expect(terminal()).toBe("gray");
  settle();
  expect(dotY()).toBeCloseTo(40);
  expect(terminal()).toBe("red");
  render({ start: 0, end: 0.5 });
  settle();
  expect(dotY()).toBeCloseTo(10);
  expect(terminal()).toBe("gray");
});
it("hides progress outside the document and restores it without replaying stale positions", () => {
  render({ start: 1, end: 2 });
  render({ hidden: true });
  expect(
    host.querySelector<SVGElement>("[data-outline-viewport-start]")!.style
      .opacity,
  ).toBe("0");
  expect(terminal()).toBe("gray");
  render({ start: 0, end: 0.5 });
  expect(dotY()).toBeCloseTo(10);
});
it("interpolates original indices across folded rows and snaps rebuilt geometry", () => {
  render({ start: 1, end: 2, folded: true });
  expect(dotY()).toBeCloseTo(40);
  expect(terminal()).toBe("red");
});
it("honors reduced motion and does not schedule animation", () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  render({});
  render({ start: 1, end: 2 });
  expect(dotY()).toBeCloseTo(40);
  expect(frames).toHaveLength(0);
});
