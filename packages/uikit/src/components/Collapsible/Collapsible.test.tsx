// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import {
  Collapsible,
  CollapsibleChevron,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./Collapsible";

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

function render() {
  act(() =>
    root.render(
      <Collapsible>
        <CollapsibleTrigger>
          <CollapsibleChevron /> Options
        </CollapsibleTrigger>
        <CollapsibleContent>
          <input aria-label="Name" />
        </CollapsibleContent>
      </Collapsible>,
    ),
  );
}

it("links trigger and content, and hides closed content from focus", () => {
  render();
  const trigger = host.querySelector("button")!;
  const content = host.querySelector<HTMLElement>(
    '[data-slot="collapsible-content"]',
  )!;
  expect(trigger.getAttribute("aria-controls")).toBe(content.id);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(content.hasAttribute("inert")).toBe(true);
  act(() => trigger.click());
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(content.hasAttribute("inert")).toBe(false);
  expect(content.getAttribute("data-state")).toBe("open");
});

it("turns the chevron with the open state", () => {
  render();
  const chevron = host.querySelector("svg.uikit-collapsible-chevron")!;
  expect(chevron.getAttribute("data-state")).toBe("closed");
  expect(chevron.getAttribute("aria-hidden")).toBe("true");
  act(() => host.querySelector("button")!.click());
  expect(chevron.getAttribute("data-state")).toBe("open");
});
