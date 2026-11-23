// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it } from "vitest";
import { TreeBranchGuides } from "./TreeBranchGuides";
let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement;
function render(element: React.ReactNode) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root!.render(element));
  return container;
}
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
});
it("draws only continuing ancestor trunks and a rounded branch, ending at the last sibling", () => {
  const el = render(
    <TreeBranchGuides ancestors={[true, false]} branch isLast />,
  );
  expect(el.querySelectorAll("[data-tree-trunk]")).toHaveLength(1);
  expect(el.querySelectorAll("[data-tree-elbow]")).toHaveLength(1);
  expect(
    el.querySelector("[data-tree-guides]")?.getAttribute("aria-hidden"),
  ).toBe("true");
});
it("keeps the current trunk unbroken while siblings remain", () => {
  const el = render(<TreeBranchGuides branch />);
  expect(el.querySelectorAll("[data-tree-trunk]")).toHaveLength(1);
  expect(el.querySelectorAll("[data-tree-elbow]")).toHaveLength(1);
});
it("uses an opaque strong token and no interaction target for emphasized drawers", () => {
  const el = render(
    <TreeBranchGuides branch emphasis="strong" style={{ opacity: 0.3 }} />,
  );
  const guides = el.querySelector<HTMLElement>("[data-tree-guides]")!;
  const elbow = el.querySelector<HTMLElement>("[data-tree-elbow]")!;
  expect(guides.style.opacity).toBe("1");
  expect(elbow.style.borderColor).toBe("var(--tree-guide-strong)");
  expect(elbow.style.borderLeftWidth).toBe("2px");
  expect(guides.querySelector("button,a,[tabindex]")).toBeNull();
});
it("leaves roots and unresolved rows unconnected", () => {
  const el = render(<TreeBranchGuides />);
  expect(el.querySelector("[data-tree-elbow],[data-tree-trunk]")).toBeNull();
});
