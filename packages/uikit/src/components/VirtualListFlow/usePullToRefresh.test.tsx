// @vitest-environment jsdom
import { act, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { usePullToRefresh } from "./usePullToRefresh";
let root: Root, host: HTMLDivElement;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  vi.useFakeTimers();
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
});
function mount(refresh = vi.fn(), busy = false) {
  function Fixture() {
    const ref = useRef<HTMLDivElement>(null);
    const distance = usePullToRefresh(ref, refresh, busy);
    return (
      <div ref={ref} tabIndex={0} data-distance={distance}>
        <span>row</span>
      </div>
    );
  }
  act(() => root.render(<Fixture />));
  return { node: host.firstElementChild as HTMLElement, refresh };
}
function wheel(node: HTMLElement, options: WheelEventInit = {}) {
  act(() =>
    node.dispatchEvent(
      new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaY: -140,
        ...options,
      }),
    ),
  );
}
function touch(node: HTMLElement, type: string, x: number, y: number) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "touches", {
    value:
      type === "touchend" || type === "touchcancel"
        ? []
        : [{ clientX: x, clientY: y }],
  });
  act(() => node.dispatchEvent(event));
}
it("refreshes once for intentional top overscroll, retaining a cooldown for momentum", () => {
  const { node, refresh } = mount();
  wheel(node, { deltaY: -50 });
  expect(refresh).not.toHaveBeenCalled();
  wheel(node);
  wheel(node);
  expect(refresh).toHaveBeenCalledTimes(1);
  act(() => vi.advanceTimersByTime(1100));
  wheel(node);
  expect(refresh).toHaveBeenCalledTimes(2);
});
it("leaves ordinary, horizontal and zoom scrolling alone, and ignores busy refreshes", () => {
  const { node, refresh } = mount();
  node.scrollTop = 10;
  wheel(node);
  node.scrollTop = 0;
  wheel(node, { deltaY: 150 });
  wheel(node, { deltaX: 200 });
  wheel(node, { ctrlKey: true });
  expect(refresh).not.toHaveBeenCalled();
  mount(refresh, true);
  wheel(host.firstElementChild as HTMLElement);
  expect(refresh).not.toHaveBeenCalled();
});
it("requires release beyond the touch threshold and cancels interrupted gestures", () => {
  const { node, refresh } = mount();
  touch(node, "touchstart", 10, 10);
  touch(node, "touchmove", 10, 80);
  touch(node, "touchend", 10, 80);
  expect(refresh).not.toHaveBeenCalled();
  touch(node, "touchstart", 10, 10);
  touch(node, "touchmove", 10, 180);
  expect(node.dataset.distance).toBe("85");
  expect(refresh).not.toHaveBeenCalled();
  touch(node, "touchcancel", 10, 180);
  expect(refresh).not.toHaveBeenCalled();
  touch(node, "touchstart", 10, 10);
  touch(node, "touchmove", 10, 180);
  touch(node, "touchend", 10, 180);
  expect(refresh).toHaveBeenCalledTimes(1);
});
it("provides a keyboard refresh without intercepting child input", () => {
  const { node, refresh } = mount();
  act(() =>
    node.firstElementChild!.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, altKey: true, key: "r" }),
    ),
  );
  expect(refresh).not.toHaveBeenCalled();
  act(() =>
    node.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, altKey: true, key: "r" }),
    ),
  );
  expect(refresh).toHaveBeenCalledOnce();
});
