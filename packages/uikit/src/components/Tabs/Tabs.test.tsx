// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { Tabs, type Tab } from "./Tabs";
import { TooltipProvider } from "../Tooltip";

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

const TABS: Tab[] = [
  { value: "overview", label: "Overview" },
  { value: "projects", label: "Projects", count: 3 },
  { value: "notes", label: "Notes" },
];

function Controlled({ initial = "overview" }: { initial?: string }) {
  const [v, setV] = useState(initial);
  return <Tabs tabs={TABS} value={v} onChange={setV} />;
}

const tabs = () => [...container.querySelectorAll<HTMLElement>('[role="tab"]')];
const key = (el: Element, k: string) =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
  });

it("underline tabs take exactly one Tab stop — the selected tab", () => {
  act(() => root.render(<Controlled initial="projects" />));
  expect(tabs().map((t) => t.tabIndex)).toEqual([-1, 0, -1]);
});

it("falls back to the first tab as the Tab stop when none is selected", () => {
  act(() => root.render(<Tabs tabs={TABS} value="missing" />));
  expect(tabs().map((t) => t.tabIndex)).toEqual([0, -1, -1]);
});

it("arrow keys, Home and End move selection and focus along the row", () => {
  act(() => root.render(<Controlled />));
  tabs()[0].focus();
  key(tabs()[0], "ArrowRight");
  expect(tabs()[1].getAttribute("aria-selected")).toBe("true");
  expect(document.activeElement).toBe(tabs()[1]);
  key(tabs()[1], "End");
  expect(document.activeElement).toBe(tabs()[2]);
  key(tabs()[2], "ArrowRight"); // wraps
  expect(tabs()[0].getAttribute("aria-selected")).toBe("true");
  key(tabs()[0], "ArrowLeft"); // wraps back
  expect(document.activeElement).toBe(tabs()[2]);
  key(tabs()[2], "Home");
  expect(document.activeElement).toBe(tabs()[0]);
});

it("Enter and Space select a tab", () => {
  const seen: string[] = [];
  act(() =>
    root.render(
      <Tabs
        tabs={TABS}
        defaultValue="overview"
        onChange={(v) => seen.push(v)}
      />,
    ),
  );
  key(tabs()[2], "Enter");
  key(tabs()[1], " ");
  expect(seen).toEqual(["notes", "projects"]);
});

it("every tab shows a ring on keyboard focus", () => {
  act(() => root.render(<Controlled />));
  for (const t of tabs())
    expect(t.className).toMatch(/focus-visible:outline-2/);
});

it("a segment is a group of pressed-state buttons, never a tablist without tabs", () => {
  act(() =>
    root.render(
      <TooltipProvider>
        <Tabs
          variant="segment"
          value="list"
          tabs={[
            { value: "list", label: "L", title: "List" },
            { value: "grid", label: "G", title: "Grid" },
          ]}
        />
      </TooltipProvider>,
    ),
  );
  expect(container.querySelector('[role="tablist"]')).toBeNull();
  const group = container.querySelector('[role="group"]')!;
  const buttons = [...group.querySelectorAll("button")];
  expect(
    buttons.map((b) => [
      b.getAttribute("aria-label"),
      b.getAttribute("aria-pressed"),
    ]),
  ).toEqual([
    ["List", "true"],
    ["Grid", "false"],
  ]);
  for (const b of buttons)
    expect(b.className).toMatch(/focus-visible:outline-2/);
});
