// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { VirtualListFlow } from "./VirtualListFlow";
let root: Root, host: HTMLDivElement;
let viewport: number, content: number;
const resizeCallbacks = new Set<ResizeObserverCallback>();
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  viewport = 200;
  content = 200;
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(
    () => viewport,
  );
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(
    () => content,
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private callback: ResizeObserverCallback) {}
      observe() {
        resizeCallbacks.add(this.callback);
      }
      disconnect() {
        resizeCallbacks.delete(this.callback);
      }
    },
  );
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  resizeCallbacks.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const load = vi.fn();
function render(
  props: Partial<Parameters<typeof VirtualListFlow<number>>[0]> = {},
) {
  act(() =>
    root.render(
      <VirtualListFlow
        items={[0, 1, 2]}
        itemHeight={40}
        height={200}
        hasMore
        onLoadMore={load}
        {...props}
      >
        {(item, _index, style) => (
          <div data-row style={style}>
            {item}
          </div>
        )}
      </VirtualListFlow>,
    ),
  );
  return host.firstElementChild as HTMLDivElement;
}
beforeEach(() => load.mockReset());
function resize(height: number) {
  viewport = height;
  act(() => {
    for (const callback of resizeCallbacks)
      callback(
        [{ contentRect: { height } } as ResizeObserverEntry],
        {} as ResizeObserver,
      );
  });
}
it("fills an initially short viewport once per key and advances through empty cursor pages", () => {
  render({ loadMoreKey: "cursor1" });
  expect(load).toHaveBeenCalledTimes(1);
  render({ loadMoreKey: "cursor1", loadingMore: true });
  render({ loadMoreKey: "cursor1", loadingMore: false });
  expect(load).toHaveBeenCalledTimes(1);
  render({ loadMoreKey: "cursor2" });
  expect(load).toHaveBeenCalledTimes(2);
  render({ loadMoreKey: "cursor3", hasMore: false });
  expect(load).toHaveBeenCalledTimes(2);
});
it("defaults to count and stops when a response adds no items", () => {
  render();
  render();
  expect(load).toHaveBeenCalledTimes(1);
  render({ items: [0, 1, 2, 3] });
  expect(load).toHaveBeenCalledTimes(2);
});
it("loads ahead after scrolling and resizing without rendering all rows", () => {
  content = 4000;
  const node = render({
    items: Array.from({ length: 100 }, (_, i) => i),
    loadMoreThreshold: 480,
  });
  expect(load).not.toHaveBeenCalled();
  expect(host.querySelectorAll("[data-row]").length).toBeLessThan(15);
  act(() => {
    node.scrollTop = 3300;
    node.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  expect(load).not.toHaveBeenCalled();
  resize(240);
  expect(load).toHaveBeenCalledTimes(1);
  expect(host.querySelectorAll("[data-row]").length).toBeLessThan(20);
});
it("waits for a measurable idle viewport", () => {
  viewport = 0;
  render();
  expect(load).not.toHaveBeenCalled();
  render({ refreshing: true });
  resize(200);
  expect(load).not.toHaveBeenCalled();
  render({ loadingMore: true });
  expect(load).not.toHaveBeenCalled();
  render();
  expect(load).toHaveBeenCalledTimes(1);
});
it("serializes returned promises even if the cursor advances before loading props", async () => {
  let resolve!: () => void;
  load.mockReturnValueOnce(
    new Promise<void>((r) => {
      resolve = r;
    }),
  );
  render({ loadMoreKey: 1 });
  render({ loadMoreKey: 2 });
  expect(load).toHaveBeenCalledTimes(1);
  await act(async () => {
    resolve();
    await Promise.resolve();
  });
  expect(load).toHaveBeenCalledTimes(2);
});
it("does not retry rejection or synchronous failure until an explicit new key", async () => {
  load.mockRejectedValueOnce(new Error("offline"));
  await act(async () => {
    render({ loadMoreKey: 1 });
  });
  render({ loadMoreKey: 1 });
  expect(load).toHaveBeenCalledTimes(1);
  load.mockImplementationOnce(() => {
    throw new Error("offline");
  });
  render({ loadMoreKey: 2 });
  render({ loadMoreKey: 2 });
  expect(load).toHaveBeenCalledTimes(2);
});
it("shows the Lucide droplet only for physical pulling and preserves rows while refreshing", () => {
  const refresh = vi.fn();
  const node = render({ onRefresh: refresh, hasMore: false });
  const droplet = () =>
    host.querySelector(".uikit-pull-refresh-drop") as HTMLElement;
  expect(droplet().style.opacity).toBe("0");
  act(() =>
    node.dispatchEvent(
      new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: -64 }),
    ),
  );
  expect(Number(droplet().style.opacity)).toBeGreaterThan(0);
  expect(droplet().querySelector("svg.lucide-droplet")).not.toBeNull();
  expect(host.querySelector("[role=status]")?.textContent).toBe(
    "Pull to refresh",
  );
  act(() =>
    node.dispatchEvent(
      new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaY: -100,
      }),
    ),
  );
  expect(refresh).toHaveBeenCalledOnce();
  expect(droplet().style.opacity).toBe("0");
  render({ onRefresh: refresh, refreshing: true, hasMore: false });
  expect(droplet().style.opacity).toBe("0");
  expect(node.getAttribute("aria-busy")).toBe("true");
  expect(host.querySelectorAll("[data-row]")).toHaveLength(3);
  expect(host.querySelector("[role=status]")?.textContent).toBe("Refreshing…");
});
