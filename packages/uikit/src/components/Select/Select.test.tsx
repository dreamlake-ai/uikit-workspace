// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Select } from "./Select";

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

const OPTIONS = [
  { value: "recent", label: "recent" },
  { value: "oldest", label: "oldest" },
  { value: "name", label: "name a–z" },
];

function renderSelect(onValueChange: (v: string) => void) {
  act(() =>
    root.render(
      <Select
        defaultValue="recent"
        onValueChange={onValueChange}
        options={OPTIONS}
      />,
    ),
  );
  return container.querySelector<HTMLButtonElement>("button")!;
}
const key = (el: Element, k: string) =>
  act(() => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }),
    );
  });
const option = (label: string) =>
  [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(
    (o) => o.textContent === label,
  )!;

// WCAG 2.1.1: a row reached with the arrow keys is chosen with Enter or
// Space, like a native <select>. It used to take a click only.
it.each(["Enter", " "])("chooses the focused option with %j", async (k) => {
  const onValueChange = vi.fn();
  const trigger = renderSelect(onValueChange);
  act(() => trigger.click());
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  const oldest = option("oldest");
  key(oldest, k);
  expect(onValueChange).toHaveBeenCalledWith("oldest");
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(trigger.textContent).toContain("oldest");
});

it("ignores Enter on a disabled option", () => {
  const onValueChange = vi.fn();
  act(() =>
    root.render(
      <Select
        defaultValue="recent"
        onValueChange={onValueChange}
        options={[...OPTIONS, { value: "off", label: "off", disabled: true }]}
      />,
    ),
  );
  const trigger = container.querySelector<HTMLButtonElement>("button")!;
  act(() => trigger.click());
  key(option("off"), "Enter");
  expect(onValueChange).not.toHaveBeenCalled();
});
