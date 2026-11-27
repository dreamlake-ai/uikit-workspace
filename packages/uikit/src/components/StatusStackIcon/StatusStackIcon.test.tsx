// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, it, expect } from "vitest";
import { StatusStackIcon, type StatusStackIconProps } from "./StatusStackIcon";
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
const render = (props: StatusStackIconProps) =>
  act(() => root.render(<StatusStackIcon {...props} />));
it("requires explicit completeness and nonempty all-passed counts for the completion check", () => {
  render({ counts: { passed: 3, failed: 0, other: 0 }, complete: false });
  expect(host.querySelector("[data-status-check]")).toBeNull();
  expect(host.querySelector("svg")!.getAttribute("aria-label")).toBe(
    "3 passed, 0 failed, 0 running, 0 other; incomplete",
  );
  render({ counts: { passed: 3, failed: 0, other: 0 }, complete: true });
  expect(host.querySelector("[data-status-check]")).not.toBeNull();
  expect(
    host
      .querySelector("[data-status-check] path:last-child")!
      .getAttribute("stroke"),
  ).toBe("#23aaff");
  expect(
    [...host.querySelectorAll("[data-status-layer]")].every(
      (el) => el.getAttribute("data-status-layer") === "passed",
    ),
  ).toBe(true);
  render({ counts: { passed: 0, failed: 0, other: 0 }, complete: true });
  expect(host.querySelector("[data-status-check]")).toBeNull();
  expect(
    host
      .querySelector("[data-status-layer]")!
      .getAttribute("data-status-layer"),
  ).toBe("other");
});
it("retains exact accessible counts and category presence without pretending to show percentages", () => {
  render({
    counts: { passed: 97, failed: 2, other: 1 },
    complete: true,
    label: "Validation",
  });
  expect(host.querySelector("svg")!.getAttribute("role")).toBe("img");
  expect(host.querySelector("svg")!.getAttribute("aria-label")).toBe(
    "Validation: 97 passed, 2 failed, 0 running, 1 other; complete",
  );
  expect(
    [...host.querySelectorAll("[data-status-layer]")].map((el) =>
      el.getAttribute("data-status-layer"),
    ),
  ).toEqual(["other", "failed", "passed"]);
  expect(host.querySelector("[data-status-check]")).toBeNull();
  expect(
    host.querySelector('button,a,[tabindex],[role="progressbar"]'),
  ).toBeNull();
});
it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
  "invalid count %s cannot produce a completion check",
  (passed) => {
    render({ counts: { passed, failed: 0, other: 0 }, complete: true });
    expect(host.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Status unavailable",
    );
    expect(host.querySelector("[data-status-check]")).toBeNull();
  },
);
it("allows decorative use without duplicating the containing control accessible label", () => {
  render({
    counts: { passed: 1, failed: 0, other: 0 },
    complete: true,
    decorative: true,
  });
  expect(host.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  expect(host.querySelector("svg")!.hasAttribute("aria-label")).toBe(false);
  expect(host.querySelector("svg")!.getAttribute("width")).toBe("18");
});

it("keeps explicit running entries separate from other outcomes and suppresses all-passed completion", () => {
  render({
    counts: { passed: 4, failed: 1, running: 2, other: 1 },
    complete: false,
  });
  expect(host.querySelector("svg")!.getAttribute("aria-label")).toBe(
    "4 passed, 1 failed, 2 running, 1 other; incomplete",
  );
  expect(
    [...host.querySelectorAll("[data-status-layer]")].map((layer) =>
      layer.getAttribute("data-status-layer"),
    ),
  ).toEqual(["other", "failed", "running", "passed"]);
  render({
    counts: { passed: 4, failed: 0, running: 1, other: 0 },
    complete: true,
  });
  expect(host.querySelector("[data-status-check]")).toBeNull();
  render({
    counts: { passed: 4, failed: 0, running: -1, other: 0 },
    complete: true,
  });
  expect(host.querySelector("svg")!.getAttribute("aria-label")).toBe(
    "Status unavailable",
  );
});

it("prioritizes a clear failure badge over running without inventing a success state", () => {
  render({
    counts: { passed: 1, failed: 1, running: 2, other: 0 },
    complete: false,
  });
  expect(host.querySelector('[data-status-badge="failed"]')).not.toBeNull();
  expect(host.querySelector('[data-status-badge="running"]')).toBeNull();
  render({
    counts: { passed: 1, failed: 0, running: 2, other: 0 },
    complete: false,
  });
  expect(host.querySelector('[data-status-badge="running"]')).not.toBeNull();
  expect(host.querySelector("[data-status-check]")).toBeNull();
  render({
    counts: { passed: 1, failed: 0, running: 0, other: 0 },
    complete: false,
  });
  expect(host.querySelector("[data-status-badge]")).toBeNull();
});
