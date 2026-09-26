// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { TabbedContainer } from "./TabbedContainer";
it("keeps inactive content state, provides linked ARIA panels and keyboard navigation", () => {
  (
    globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <TabbedContainer
        aria-label="Examples"
        items={[
          { value: "a", label: "A", children: <input defaultValue="draft" /> },
          { value: "b", label: "B", children: <span>Second</span> },
        ]}
      />,
    ),
  );
  const tabs = container.querySelectorAll<HTMLButtonElement>("[role=tab]"),
    input = container.querySelector("input")!;
  input.value = "changed";
  act(() =>
    tabs[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    ),
  );
  expect(tabs[1].getAttribute("aria-selected")).toBe("true");
  expect(document.activeElement).toBe(tabs[1]);
  expect(input.closest("[role=tabpanel]")?.hasAttribute("hidden")).toBe(true);
  act(() =>
    tabs[1].dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
    ),
  );
  expect(container.querySelector("input")).toBe(input);
  expect(input.value).toBe("changed");
  expect(
    document
      .getElementById(tabs[0].getAttribute("aria-controls")!)
      ?.getAttribute("aria-labelledby"),
  ).toBe(tabs[0].id);
  act(() => root.unmount());
  container.remove();
});
it("supports controlled selection and an empty item list", () => {
  const container = document.createElement("div"),
    root = createRoot(container);
  let selected = "";
  act(() =>
    root.render(
      <TabbedContainer
        aria-label="Examples"
        value="a"
        onValueChange={(v) => {
          selected = v;
        }}
        items={[
          { value: "a", label: "A", children: "one" },
          { value: "b", label: "B", children: "two" },
        ]}
      />,
    ),
  );
  act(() => container.querySelectorAll<HTMLButtonElement>("button")[1].click());
  expect(selected).toBe("b");
  expect(container.querySelector("[aria-selected=true]")?.textContent).toBe(
    "A",
  );
  act(() => root.render(<TabbedContainer aria-label="Empty" items={[]} />));
  expect(container.childElementCount).toBe(0);
  act(() => root.unmount());
});

it("only opts into mouse hover and preserves focus, click, and touch behavior", () => {
  const container = document.createElement("div"),
    root = createRoot(container);
  document.body.append(container);
  const render = (activationMode: "click" | "hover") =>
    act(() =>
      root.render(
        <TabbedContainer
          aria-label="Hover examples"
          activationMode={activationMode}
          items={[
            { value: "a", label: "A", children: "First" },
            { value: "b", label: "B", children: "Second" },
          ]}
        />,
      ),
    );
  const hover = (button: Element, pointerType: string) =>
    act(() => {
      const event = new MouseEvent("pointerover", { bubbles: true });
      Object.defineProperty(event, "pointerType", { value: pointerType });
      button.dispatchEvent(event);
    });
  render("click");
  const tabs = container.querySelectorAll<HTMLButtonElement>("[role=tab]");
  tabs[0].focus();
  hover(tabs[1], "mouse");
  expect(tabs[0].getAttribute("aria-selected")).toBe("true");
  render("hover");
  hover(tabs[1], "touch");
  expect(tabs[0].getAttribute("aria-selected")).toBe("true");
  hover(tabs[1], "mouse");
  expect(tabs[1].getAttribute("aria-selected")).toBe("true");
  expect(document.activeElement).toBe(tabs[0]);
  act(() => tabs[0].click());
  expect(tabs[0].getAttribute("aria-selected")).toBe("true");
  act(() => root.unmount());
  container.remove();
});
