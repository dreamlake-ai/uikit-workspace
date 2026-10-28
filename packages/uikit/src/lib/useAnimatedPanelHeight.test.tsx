// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useAnimatedPanelHeight } from "./useAnimatedPanelHeight";

let host: HTMLDivElement;
let root: Root;
let fire: () => void;
let heights: number[];
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  class RO {
    constructor(cb: () => void) {
      fire = cb;
    }
    observe() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", RO);
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  heights = [];
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function Panel({ open = true }: { open?: boolean }) {
  const ref = useAnimatedPanelHeight(open);
  const [more, setMore] = useState(false);
  return (
    <div ref={ref} data-testid="panel">
      <button onClick={() => setMore(true)}>more</button>
      {more && <p>extra</p>}
    </div>
  );
}

function setup(open = true) {
  act(() => root.render(<Panel open={open} />));
  const panel = host.querySelector<HTMLElement>('[data-testid="panel"]')!;
  let h = 200;
  Object.defineProperty(panel, "scrollHeight", {
    get: () => h,
    configurable: true,
  });
  const realGCS = window.getComputedStyle;
  vi.spyOn(window, "getComputedStyle").mockImplementation((node, pseudo) => {
    const cs = realGCS(node, pseudo);
    if (node !== panel) return cs;
    return new Proxy(cs, {
      get: (t, k) =>
        k === "height"
          ? `${h}px`
          : k === "maxHeight"
            ? "none"
            : Reflect.get(t, k),
    });
  });
  const animate = vi.fn((frames: Keyframe[]) => {
    heights = frames.map((f) => parseFloat(String(f.height)));
    return {
      cancel() {},
      onfinish: null,
      oncancel: null,
    } as unknown as Animation;
  });
  panel.animate = animate as unknown as typeof panel.animate;
  return { panel, animate, grow: (n: number) => (h = n) };
}

it("animates from the old height to the new one when content changes", () => {
  const { animate, grow } = setup();
  act(() => fire()); // first measure: no animation
  expect(animate).not.toHaveBeenCalled();
  grow(320);
  act(() => fire());
  expect(animate).toHaveBeenCalledTimes(1);
  expect(heights).toEqual([200, 320]);
});

it("follows a collapsible that animates its own height", () => {
  const { panel, animate, grow } = setup();
  act(() => fire());
  const c = document.createElement("div");
  c.setAttribute("data-slot", "collapsible-content");
  c.setAttribute("data-animating", "");
  panel.append(c);
  grow(260);
  act(() => fire());
  expect(animate).not.toHaveBeenCalled();
});

it("does nothing under reduced motion", () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  const { animate, grow } = setup();
  act(() => fire());
  grow(400);
  act(() => fire());
  expect(animate).not.toHaveBeenCalled();
});
