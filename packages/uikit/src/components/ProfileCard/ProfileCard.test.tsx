// @vitest-environment jsdom
// The top-right action cluster must never be drawn over `titleRight`.
// Pointer: the meta fades while the cluster is revealed — on hover and on
// keyboard focus. Touch (`hover: none`): the cluster is always shown and joins
// the title row, and the meta moves to the bottom-right corner — the end of the
// footer row — keyed on `data-uikit-top-actions` in styles.css. Before this, a
// phone drew "9/7/2025" straight through edit/delete. The real geometry (title
// and buttons on one line, the meta bottom-right) is asserted on WebKit with
// the iPad / iPhone descriptors in packages/docs/e2e/profile-card-touch.spec.ts.
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

it("puts the action cluster in the header row, after the meta", () => {
  render(true);
  const header = container.querySelector("[data-uikit-header]")!;
  const slot = header.querySelector("[data-uikit-top-actions-slot]")!;
  expect(slot).not.toBeNull();
  // Order on the line: title column, meta, then the cluster.
  const main = header.querySelector("[data-uikit-header-main]")!;
  expect(main.nextElementSibling).toBe(slot);
  expect(main.lastElementChild!.hasAttribute("data-uikit-title-right")).toBe(
    true,
  );
});

it("renders a footer copy of the meta only when the card has top-right actions", () => {
  render(true);
  const foot = container.querySelector("[data-uikit-title-right-foot]")!;
  expect(foot.textContent).toBe("2h ago");
  // No footer was passed, so the row exists only to carry the meta on touch.
  const row = foot.closest("[data-uikit-footer]")!;
  expect(row.hasAttribute("data-uikit-footer-meta-only")).toBe(true);
  expect(row.lastElementChild).toBe(foot);
  render(false);
  expect(container.querySelector("[data-uikit-title-right-foot]")).toBeNull();
  expect(container.querySelector("[data-uikit-footer]")).toBeNull();
});

it("puts the footer meta after the card's own footer content", () => {
  act(() =>
    root.render(
      <ProfileCard
        title="arm-bc-v2"
        titleRight="2h ago"
        footer="0b · 0an"
        footerRight={<span>acl</span>}
        topRightActions={<button>Edit</button>}
      />,
    ),
  );
  const row = container.querySelector("[data-uikit-footer]")!;
  expect(row.hasAttribute("data-uikit-footer-meta-only")).toBe(false);
  expect(row.lastElementChild!.hasAttribute("data-uikit-title-right-foot")).toBe(true);
});

it("on touch, shows the meta bottom-right instead of in the title row", () => {
  const css = readFileSync(join(__dirname, "../../styles.css"), "utf8");
  const touch = css.slice(
    css.indexOf(
      "@media (hover: none) {\n  [data-uikit-card][data-uikit-top-actions]",
    ),
  );
  const rule = (sel: string) =>
    touch.match(
      new RegExp(sel.replace(/[[\]]/g, "\\$&") + " \\{([^}]*)\\}"),
    )?.[1] ?? "";
  const scope = "[data-uikit-card][data-uikit-top-actions] ";
  expect(rule(scope + "[data-uikit-header]")).toMatch(/flex-wrap: nowrap/);
  expect(rule(scope + "[data-uikit-top-actions-slot]")).toMatch(
    /position: static/,
  );
  expect(rule(scope + "[data-uikit-header] [data-uikit-title-right]")).toMatch(
    /display: none/,
  );
  expect(rule(scope + "[data-uikit-title-right-foot]")).toMatch(/display: block/);
  expect(rule(scope + "[data-uikit-footer-meta-only]")).toMatch(/display: flex/);
  // Pointer devices never see the copy or the meta-only row.
  const base = css.slice(0, css.indexOf("@media (hover: none) {\n  [data-uikit-card][data-uikit-top-actions]"));
  expect(base).toMatch(/\[data-uikit-title-right-foot\],\n\[data-uikit-footer-meta-only\] \{\n  display: none;/);
});
