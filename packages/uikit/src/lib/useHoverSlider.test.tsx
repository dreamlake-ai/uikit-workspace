// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { Menu } from "../components/Menu/Menu";
import { MenuItem } from "../components/Menu/MenuItem";

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.body.innerHTML = "";
});

const slider = () =>
  document.querySelector<HTMLElement>("[data-uikit-hover-slider]")!;
const move = (el: Element) =>
  act(() => {
    el.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );
  });

function render() {
  act(() =>
    root.render(
      <Menu open onOpenChange={() => {}} trigger={() => <button>open</button>}>
        <MenuItem label="One" />
        <button role="menuitemradio" aria-checked="true">
          Current
        </button>
        <MenuItem label="Off" disabled />
      </Menu>,
    ),
  );
}

it("is one fill per panel, shown while a row is under the pointer", () => {
  render();
  expect(document.querySelectorAll("[data-uikit-hover-slider]")).toHaveLength(
    1,
  );
  expect(slider().hasAttribute("data-ready")).toBe(false);
  move(document.querySelector('[role="menuitem"]')!);
  expect(slider().hasAttribute("data-ready")).toBe(true);
});

it("steps aside on the selected row, so grey never mixes into the accent fill", () => {
  render();
  move(document.querySelector('[role="menuitem"]')!);
  move(document.querySelector('[aria-checked="true"]')!);
  expect(slider().hasAttribute("data-ready")).toBe(false);
});

it("gives a disabled row no hover", () => {
  render();
  move(document.querySelector("[data-disabled]")!);
  expect(slider().hasAttribute("data-ready")).toBe(false);
});
