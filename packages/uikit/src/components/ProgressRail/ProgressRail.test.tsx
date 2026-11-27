// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { ProgressRail, type ProgressRailItem } from "./ProgressRail";

let host: HTMLDivElement, root: Root;
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
const render = (items: ProgressRailItem[]) =>
  act(() =>
    root.render(<ProgressRail aria-label="Run progress" items={items} />),
  );

it("announces ordered explicit state without adding controls or inventing details", () => {
  render([
    {
      id: "done",
      label: "Matched",
      state: "complete",
      detail: <time>19:39</time>,
    },
    { id: "now", label: "Running", state: "current" },
    { id: "next", label: "Collect", state: "pending" },
  ]);
  const list = host.querySelector("ol")!;
  expect(list.getAttribute("aria-label")).toBe("Run progress");
  expect([...list.children].map((row) => row.textContent)).toEqual([
    "Matched: complete19:39",
    "Running: current",
    "Collect: pending",
  ]);
  expect(host.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
  expect(host.querySelector('[aria-current="step"]')?.textContent).toBe(
    "Running: current",
  );
  expect(host.querySelectorAll("time")).toHaveLength(1);
  expect(
    host.querySelector("button, a, [tabindex], [role=progressbar]"),
  ).toBeNull();
  for (const svg of host.querySelectorAll("svg"))
    expect(svg.closest('[aria-hidden="true"]')).not.toBeNull();
});

it("updates the same stage to an error without retaining a completion check or old detail", () => {
  render([
    { id: "collect", label: "Collect", state: "complete", detail: "Written" },
  ]);
  const row = host.querySelector("li");
  render([
    {
      id: "collect",
      label: "Collect",
      state: "error",
      detail: "Access expired",
    },
  ]);
  expect(host.querySelector("li")).toBe(row);
  expect(row?.getAttribute("aria-current")).toBe("step");
  expect(row?.textContent).toBe("Collect: errorAccess expired");
  expect(host.querySelector(".lucide-check")).toBeNull();
  expect(host.querySelector(".lucide-x")).not.toBeNull();
  render([]);
  expect(host.children).toHaveLength(0);
});

it("switches to compact rows without losing stage identity, state or observed details", () => {
  const items: ProgressRailItem[] = [
    { id: "done", label: "Matched", state: "complete" },
    {
      id: "now",
      label: "Running",
      state: "current",
      detail: <time>19:39:20</time>,
    },
    { id: "next", label: "Collect", state: "pending" },
  ];
  render(items);
  const rows = [...host.querySelectorAll("li")];
  act(() =>
    root.render(
      <ProgressRail compact aria-label="Run progress" items={items} />,
    ),
  );
  expect([...host.querySelectorAll("li")]).toEqual(rows);
  expect(host.querySelector("ol")?.dataset.variant).toBe("compact");
  expect(host.querySelector('[aria-current="step"]')?.textContent).toBe(
    "Running: current19:39:20",
  );
  expect(host.querySelectorAll("time")).toHaveLength(1);
  expect(host.querySelector("button, a, [tabindex]")).toBeNull();
  expect(host.querySelector(".lucide-circle")).not.toBeNull();
  render(items);
  expect(host.querySelector("ol")?.dataset.variant).toBe("rail");
  expect([...host.querySelectorAll("li")]).toEqual(rows);
});
