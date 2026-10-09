// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./DropdownMenu";

let root: Root;
let container: HTMLDivElement;
let triggerBox = { x: 300, y: 300, width: 80, height: 30 };
const box = (x: number, y: number, width: number, height: number) => ({
  x,
  y,
  width,
  height,
  top: y,
  left: x,
  right: x + width,
  bottom: y + height,
  toJSON() {},
});
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  triggerBox = { x: 300, y: 300, width: 80, height: 30 };
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      if (this instanceof HTMLElement && this.dataset.trigger !== undefined)
        return box(
          triggerBox.x,
          triggerBox.y,
          triggerBox.width,
          triggerBox.height,
        );
      if (this.getAttribute("role") === "menu") return box(0, 0, 180, 100);
      if (this.hasAttribute("data-dropdown-menu-arrow")) return box(0, 0, 7, 7);
      return box(0, 0, 800, 600);
    },
  );
  for (const [property, axis] of [
    ["offsetWidth", "width"],
    ["offsetHeight", "height"],
    ["clientWidth", "width"],
    ["clientHeight", "height"],
  ] as const)
    vi.spyOn(HTMLElement.prototype, property, "get").mockImplementation(
      function (this: HTMLElement) {
        return this.getBoundingClientRect()[axis];
      },
    );
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});
async function render(
  arrow = false,
  side: "top" | "right" | "bottom" | "left" = "bottom",
  defaultOpen = true,
) {
  await act(async () =>
    root.render(
      <DropdownMenu arrow={arrow} side={side} defaultOpen={defaultOpen}>
        <DropdownMenuTrigger data-trigger="">View</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <button>Machines</button>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <button>Cluster overview</button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    ),
  );
}
it("preserves the existing default menu without a wedge or extra gap", async () => {
  await render();
  expect(document.querySelector("[data-dropdown-menu-arrow]")).toBeNull();
  expect(
    (document.querySelector('[role="menu"]') as HTMLElement).style.top,
  ).toBe("334px");
});
for (const [side, edge, translation] of [
  ["top", "bottom", "0 50%"],
  ["bottom", "top", "0 -50%"],
  ["left", "right", "50% 0"],
  ["right", "left", "-50% 0"],
] as const)
  it(`points the ${side} menu wedge toward its trigger`, async () => {
    await render(true, side);
    const arrow = document.querySelector(
      "[data-dropdown-menu-arrow]",
    ) as HTMLElement;
    expect(arrow.dataset.side).toBe(side);
    expect(arrow.style[edge]).toBe("-0.5px");
    expect(arrow.style.translate).toBe(translation);
    expect(arrow.getAttribute("aria-hidden")).toBe("true");
    expect(arrow.style.pointerEvents).toBe("none");
    expect(arrow.hasAttribute("tabindex")).toBe(false);
    if (side === "bottom")
      expect(
        (document.querySelector('[role="menu"]') as HTMLElement).style.top,
      ).toBe("338px");
  });
it("follows an actual viewport flip instead of the requested side", async () => {
  triggerBox.y = 570;
  await render(true, "bottom");
  const arrow = document.querySelector(
    "[data-dropdown-menu-arrow]",
  ) as HTMLElement;
  expect(arrow.dataset.side).toBe("top");
  expect(arrow.style.bottom).toBe("-0.5px");
  expect(arrow.style.top).toBe("");
});
it("keeps keyboard navigation and Escape focus return with the wedge", async () => {
  await render(true, "top", false);
  const trigger = container.querySelector("button")!;
  const key = async (element: Element, value: string) =>
    act(async () => {
      element.dispatchEvent(
        new KeyboardEvent("keydown", { key: value, bubbles: true }),
      );
    });
  act(() => trigger.focus());
  await key(trigger, "ArrowDown");
  const items = document.querySelectorAll('[role="menuitem"]');
  expect(items).toHaveLength(2);
  await vi.waitFor(() => expect(document.activeElement).toBe(items[0]));
  await key(items[0], "ArrowDown");
  await vi.waitFor(() => expect(document.activeElement).toBe(items[1]));
  await key(items[1], "Escape");
  await vi.waitFor(() =>
    expect(document.querySelector('[role="menu"]')).toBeNull(),
  );
  await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
});
