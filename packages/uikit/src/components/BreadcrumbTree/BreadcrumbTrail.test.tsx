// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { BreadcrumbTrail, hiddenAncestorCount } from "./BreadcrumbTrail";

let root: Root;
let host: HTMLDivElement;
let width = 220;
let resize: (() => void) | undefined;
const selected = vi.fn();
const items = [
  "Workspace",
  "First ancestor",
  "Second ancestor",
  "Current folder",
].map((label, i) => ({ key: String(i), label, onSelect: () => selected(i) }));
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  width = 220;
  resize = undefined;
  selected.mockClear();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resize ??= callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(
    () => width,
  );
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      const sample = this.querySelector<HTMLElement>("[data-label]");
      const w = sample ? sample.dataset.label!.length * 7 + 12 : 16;
      return {
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: w,
        bottom: 16,
        width: w,
        height: 16,
        toJSON() {},
      };
    },
  );
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("keeps short paths intact and removes only middle ancestors as room decreases", () => {
  expect(hiddenAncestorCount([60, 80, 80, 60], 300, 16, 16)).toBe(0);
  expect(hiddenAncestorCount([60, 80, 80, 60], 250, 16, 16)).toBe(1);
  expect(hiddenAncestorCount([60, 80, 80, 60], 150, 16, 16)).toBe(2);
  expect(hiddenAncestorCount([600, 600], 150, 16, 16)).toBe(0);
});

it("keeps root/current buttons, exposes every hidden ancestor, and restores crumbs on resize", async () => {
  await act(async () =>
    root.render(
      <BreadcrumbTrail items={items}>
        <button>Browse folders</button>
      </BreadcrumbTrail>,
    ),
  );
  const buttons = () => Array.from(host.querySelectorAll("button"));
  expect(buttons().map((b) => b.textContent)).toEqual([
    "Workspace",
    "…",
    "Current folder",
    "Browse folders",
  ]);
  expect(host.querySelector('[aria-current="location"]')?.textContent).toBe(
    "Current folder",
  );
  await act(async () =>
    (
      host.querySelector('[aria-label="Show hidden ancestors"]') as HTMLElement
    ).click(),
  );
  const ancestors = Array.from(
    document.querySelectorAll<HTMLElement>('[role="menuitem"]'),
  );
  expect(ancestors.map((a) => a.textContent)).toEqual([
    "First ancestor",
    "Second ancestor",
  ]);
  await act(async () => ancestors[1].click());
  expect(selected).toHaveBeenCalledWith(2);
  width = 900;
  await act(async () => resize?.());
  expect(buttons().map((b) => b.textContent)).toEqual([
    "Workspace",
    "First ancestor",
    "Second ancestor",
    "Current folder",
    "Browse folders",
  ]);
});
