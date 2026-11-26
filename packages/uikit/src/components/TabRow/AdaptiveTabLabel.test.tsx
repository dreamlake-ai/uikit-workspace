// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { AdaptiveTabLabel } from "./AdaptiveTabLabel";

it("shortens and expands as space changes while preserving the full accessible label", () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  let width = 240;
  let resize: () => void = () => {};
  const disconnect = vi.fn();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  const box = vi
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(function (this: HTMLElement) {
      return {
        width: this.hasAttribute("data-label-measure")
          ? (this.textContent?.length ?? 0) * 10
          : width,
      } as DOMRect;
    });
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    act(() =>
      root.render(
        <AdaptiveTabLabel
          label="geyang@gpu-box"
          alternatives={["g@gpu-box", "gpu-box"]}
        />,
      ),
    );
    const visible = () =>
      container.querySelector("[data-label-visible]")!.textContent;
    expect(visible()).toBe("geyang@gpu-box");
    for (const [size, label] of [
      [110, "g@gpu-box"],
      [80, "gpu-box"],
      [30, "gpu-box"],
      [240, "geyang@gpu-box"],
    ] as const) {
      width = size;
      act(() => resize());
      expect(visible()).toBe(label);
      expect(container.firstElementChild?.getAttribute("aria-label")).toBe(
        "geyang@gpu-box",
      );
    }
    act(() => root.render(<AdaptiveTabLabel label="New session title" />));
    expect(visible()).toBe("New session title");
  } finally {
    act(() => root.unmount());
    box.mockRestore();
    vi.unstubAllGlobals();
  }
  expect(disconnect).toHaveBeenCalled();
});
