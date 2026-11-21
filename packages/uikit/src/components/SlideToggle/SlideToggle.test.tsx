// @vitest-environment jsdom
import { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PreviewToggle, SlideToggle, VimToggle } from "./SlideToggle";

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
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

it("preserves the expanding editor knob and controlled pressed state", () => {
  const toggle = vi.fn();
  act(() => root.render(<VimToggle on={false} onToggle={toggle} />));
  const button = container.querySelector("button")!;
  expect(button.style.width).toBe("44px");
  expect(button.style.height).toBe("20px");
  expect(button.getAttribute("aria-label")).toBe("Vim mode");
  expect(button.getAttribute("aria-pressed")).toBe("false");
  expect(button.querySelector("div")!.style.width).toBe("14px");
  act(() => button.click());
  expect(toggle).toHaveBeenCalledOnce();
  expect(button.getAttribute("aria-pressed")).toBe("false");
  act(() => root.render(<VimToggle on onToggle={toggle} />));
  expect(button.getAttribute("aria-pressed")).toBe("true");
  expect(button.querySelector("div")!.style.left).toBe("16px");
  expect(button.querySelector("div")!.style.width).toBe("26px");
});

it("does not activate or keep hover tint when disabled, including mid-hover", () => {
  const toggle = vi.fn();
  act(() => root.render(<VimToggle on onToggle={toggle} />));
  const button = container.querySelector("button")!;
  act(() =>
    button.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })),
  );
  expect(button.style.background).toBe("rgb(35, 170, 255)");
  act(() => root.render(<VimToggle on disabled onToggle={toggle} />));
  expect(button.disabled).toBe(true);
  expect(button.style.background).toBe("var(--chip-bg)");
  act(() => button.click());
  expect(toggle).not.toHaveBeenCalled();
});

it("forwards native button events, attributes and refs without taking over pointer gestures", () => {
  const ref = createRef<HTMLButtonElement>();
  const toggle = vi.fn();
  const keyDown = vi.fn();
  const pointerDown = vi.fn();
  act(() =>
    root.render(
      <SlideToggle
        ref={ref}
        on={false}
        onToggle={toggle}
        label="Chat"
        left={{ node: "T", w: 20 }}
        right={{ node: "C", w: 20 }}
        className="toolbar-chat"
        aria-controls="chat-pane"
        onKeyDown={keyDown}
        onPointerDown={pointerDown}
      />,
    ),
  );
  const button = container.querySelector("button")!;
  expect(ref.current).toBe(button);
  expect(button.classList.contains("toolbar-chat")).toBe(true);
  expect(button.getAttribute("aria-controls")).toBe("chat-pane");
  act(() => {
    button.dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true }),
    );
    button.dispatchEvent(new Event("pointerdown", { bubbles: true }));
  });
  expect(keyDown).toHaveBeenCalledOnce();
  expect(pointerDown).toHaveBeenCalledOnce();
  expect(toggle).not.toHaveBeenCalled();
});

it("allows a composed click handler to prevent activation and never submits a form", () => {
  const toggle = vi.fn();
  act(() =>
    root.render(
      <form>
        <VimToggle
          on={false}
          onToggle={toggle}
          onClick={(event) => event.preventDefault()}
        />
      </form>,
    ),
  );
  const button = container.querySelector("button")!;
  expect(button.type).toBe("button");
  act(() => button.click());
  expect(toggle).not.toHaveBeenCalled();
});

it("provides the same source/eye preset with disabled and accessible labels", () => {
  act(() => root.render(<PreviewToggle on disabled onToggle={() => {}} />));
  const button = container.querySelector("button")!;
  expect(button.getAttribute("aria-label")).toBe("Live preview");
  expect(button.style.width).toBe("46px");
  expect(button.textContent).toContain("</>");
  expect(button.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  expect(button.querySelector("div")!.style.width).toBe("20px");
  expect(button.disabled).toBe(true);
});
