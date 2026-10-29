// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { Avatar } from "./Avatar";

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const square = () => host.firstElementChild as HTMLElement;
const img = () => host.querySelector("img");

it("draws the initials square under an image that is still loading", () => {
  act(() => root.render(<Avatar name="Ada Lovelace" image="/ada.png" />));
  expect(img()).not.toBeNull();
  expect(square().textContent).toBe("AL");
  expect(square().style.background).not.toBe("");
  // The image names the person; the letters under it are decoration.
  expect(host.querySelector("[aria-hidden]")?.textContent).toBe("AL");
});

it("drops the initials and the fill once the image has loaded", () => {
  act(() => root.render(<Avatar name="Ada Lovelace" image="/ada.png" />));
  act(() => {
    img()!.dispatchEvent(new Event("load"));
  });
  expect(img()).not.toBeNull();
  expect(square().textContent).toBe("");
  expect(square().style.background).toBe("");
});

it("falls back to the initials alone when the image fails", () => {
  act(() => root.render(<Avatar name="Ada Lovelace" image="/ada.png" />));
  act(() => {
    img()!.dispatchEvent(new Event("error"));
  });
  expect(img()).toBeNull();
  expect(square().textContent).toBe("AL");
  expect(host.querySelector("[aria-hidden]")).toBeNull();
});

it("a new image starts over from the initials", () => {
  act(() => root.render(<Avatar name="Ada Lovelace" image="/ada.png" />));
  act(() => {
    img()!.dispatchEvent(new Event("load"));
  });
  act(() => root.render(<Avatar name="Ada Lovelace" image="/ada-2.png" />));
  expect(square().textContent).toBe("AL");
});

it("without an image it is the plain initials square", () => {
  act(() => root.render(<Avatar name="dreamlake" />));
  expect(img()).toBeNull();
  expect(square().textContent).toBe("DR");
});
