// @vitest-environment jsdom
// The top-right action cluster must never be drawn over `titleRight`.
// Pointer: the meta fades while the cluster is revealed — on hover and on
// keyboard focus. Touch (`hover: none`): the cluster is always shown, so the
// meta takes its own line, keyed on `data-uikit-top-actions` in styles.css.
// Before this, a phone drew "9/7/2025" straight through edit/delete.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { ProfileCard } from "./ProfileCard";

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

const render = (withActions: boolean) =>
  act(() =>
    root.render(
      <ProfileCard
        title="arm-bc-v2"
        titleRight="2h ago"
        href="/acme/arm-bc-v2"
        topRightActions={withActions ? <button>Edit</button> : undefined}
      />,
    ),
  );

it("marks a card that has top-right actions, and only that card", () => {
  render(true);
  const card = container.querySelector("[data-uikit-card]")!;
  expect(card.hasAttribute("data-uikit-top-actions")).toBe(true);
  render(false);
  expect(
    container
      .querySelector("[data-uikit-card]")!
      .hasAttribute("data-uikit-top-actions"),
  ).toBe(false);
});

it("fades the meta on keyboard focus as well as on hover", () => {
  render(true);
  const meta = container.querySelector("[data-uikit-title-right]")!;
  expect(meta.className).toContain("group-hover:opacity-0");
  expect(meta.className).toContain(
    "[@media(hover:hover)]:group-focus-within:opacity-0",
  );
});

it("moves the meta to its own line on touch instead of hiding it", () => {
  const css = readFileSync(join(__dirname, "../../styles.css"), "utf8");
  const touch = css.slice(css.indexOf("@media (hover: none) {\n  /* Reserved"));
  expect(touch).toMatch(
    /\[data-uikit-card\]\[data-uikit-top-actions\] \[data-uikit-title-right\] \{\s*flex-basis: 100%;/,
  );
  expect(touch).toMatch(
    /\[data-uikit-card\]\[data-uikit-top-actions\] \[data-uikit-header\] \{\s*flex-wrap: wrap;/,
  );
});
