// @vitest-environment jsdom
import { act, Profiler } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { ToggleButton, ToggleButtons } from "./ToggleButtons";

it("keeps unchanged button registrations stable through continuous parent updates", () => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const commits = vi.fn();
  const selected = vi.fn();
  const render = (frame: number) =>
    act(() =>
      root.render(
        <Profiler id="presets" onRender={commits}>
          <ToggleButtons
            value=""
            onValueChange={(value) => selected(frame, value)}
          >
            <ToggleButton value="half">50%</ToggleButton>
            <ToggleButton value="full">100%</ToggleButton>
          </ToggleButtons>
        </Profiler>,
      ),
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

it("keeps panel hover neutral once three options are mounted, including selected and disabled options", () => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const render = (extra: boolean) =>
    act(() =>
      root.render(
        <ToggleButtons variant="panel" value="m" onValueChange={() => {}}>
          <ToggleButton value="s">S</ToggleButton>
          <ToggleButton value="m">M</ToggleButton>
          {extra && (
            <span>
              <ToggleButton value="l" disabled>
                L
              </ToggleButton>
            </span>
          )}
        </ToggleButtons>,
      ),
    );
  try {
    render(false);
    const group = container.querySelector<HTMLElement>("[data-editor-toggle]")!;
    const first = container.querySelector("button")!;
    act(() =>
      first.dispatchEvent(new MouseEvent("pointerover", { bubbles: true })),
    );
    expect(group.style.background).toBe("rgb(35, 170, 255)");
    render(true);
    expect(group.style.background).toBe("var(--chip-bg)");
    expect(first.style.opacity).toBe("0.5");
    expect(container.querySelector('[aria-pressed="true"]')?.textContent).toBe(
      "M",
    );
    render(false);
    expect(group.style.background).toBe("rgb(35, 170, 255)");
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
