// @vitest-environment jsdom
import { act, Profiler } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { ToggleButton, ToggleButtons } from "./ToggleButtons";

it("keeps unchanged button registrations stable through continuous parent updates", () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const commits = vi.fn();
  const selected = vi.fn();
  const render = (frame: number) =>
    act(() =>
      root.render(
        <Profiler id="presets" onRender={commits}>
          <ToggleButtons value="" onValueChange={(value) => selected(frame, value)}>
            <ToggleButton value="half">50%</ToggleButton>
            <ToggleButton value="full">100%</ToggleButton>
          </ToggleButtons>
        </Profiler>
      )
    );
  try {
    render(0);
    commits.mockClear();
    for (let frame = 1; frame <= 100; frame++) render(frame);
    expect(commits).toHaveBeenCalledTimes(100);
    act(() => container.querySelector("button")!.click());
    expect(selected).toHaveBeenCalledWith(100, "half");
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
