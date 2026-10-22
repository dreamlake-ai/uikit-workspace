// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { Button, buttonVariants, type ButtonVariant } from "./Button";

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
});

const VARIANTS: ButtonVariant[] = [
  "primary",
  "secondary",
  "ghost",
  "action",
  "danger",
  "destructive",
  "link",
];

// `outline-none` zeroes Tailwind v4's --tw-outline-style, so a ring needs
// `outline-solid` as well as a width — without it nothing paints.
const RING = [
  "focus-visible:outline-solid",
  "focus-visible:outline-2",
  "focus-visible:outline-uikit-accent",
];

it.each(VARIANTS)("%s paints a keyboard focus ring", (variant) => {
  const cls = buttonVariants({ variant }).split(" ");
  for (const c of RING) expect(cls).toContain(c);
});

it("filled and padless variants put the ring outside, the rest inset", () => {
  const outside = (v: ButtonVariant) =>
    buttonVariants({ variant: v })
      .split(" ")
      .includes("focus-visible:outline-offset-2");
  expect(VARIANTS.filter(outside)).toEqual([
    "primary",
    "danger",
    "destructive",
    "link",
  ]);
  for (const v of ["secondary", "ghost", "action"] as const)
    expect(buttonVariants({ variant: v })).toContain(
      "focus-visible:-outline-offset-2",
    );
});

it("an icon button and a link-button carry the ring too", () => {
  act(() =>
    root.render(
      <>
        <Button variant="ghost" icon aria-label="Refresh">
          ↻
        </Button>
        <Button variant="action" href="/x">
          open
        </Button>
      </>,
    ),
  );
  const button = container.querySelector("button")!;
  const link = container.querySelector("a")!;
  expect(button.getAttribute("aria-label")).toBe("Refresh");
  for (const el of [button, link])
    for (const c of RING) expect(el.className).toContain(c);
});
