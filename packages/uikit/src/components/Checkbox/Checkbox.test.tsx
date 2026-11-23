// @vitest-environment jsdom
import { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Checkbox } from "./Checkbox";

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

it("uses native label activation and forwards the checked value in callback order", () => {
  const changes: string[] = [];
  const ref = createRef<HTMLInputElement>();
  act(() =>
    root.render(
      <label>
        Curves
        <Checkbox
          ref={ref}
          onChange={(e) => changes.push(`native:${e.currentTarget.checked}`)}
          onCheckedChange={(value) => changes.push(`checked:${value}`)}
        />
      </label>,
    ),
  );
  expect(ref.current?.type).toBe("checkbox");
  act(() => container.querySelector("label")!.click());
  expect(ref.current?.checked).toBe(true);
  expect(changes).toEqual(["native:true", "checked:true"]);
  act(() => ref.current!.click());
  expect(ref.current?.checked).toBe(false);
});

it("keeps controlled state authoritative and allows updates from the owner", () => {
  const change = vi.fn();
  act(() => root.render(<Checkbox checked={false} onCheckedChange={change} />));
  const input = container.querySelector("input")!;
  act(() => input.click());
  expect(change).toHaveBeenCalledWith(true);
  expect(input.checked).toBe(false);
  act(() => root.render(<Checkbox checked onCheckedChange={change} />));
  expect(input.checked).toBe(true);
});

it("maintains controlled mixed state until the owner clears it", () => {
  const change = vi.fn();
  act(() => root.render(<Checkbox indeterminate onCheckedChange={change} />));
  const input = container.querySelector("input")!;
  expect(input.indeterminate).toBe(true);
  expect(input.getAttribute("aria-checked")).toBe("mixed");
  act(() => input.click());
  expect(change).toHaveBeenCalledWith(true);
  expect(input.indeterminate).toBe(true);
  act(() =>
    root.render(<Checkbox indeterminate={false} onCheckedChange={change} />),
  );
  expect(input.indeterminate).toBe(false);
  expect(input.hasAttribute("aria-checked")).toBe(false);
});

it("supports native form values, required validation and uncontrolled reset", () => {
  act(() =>
    root.render(
      <form>
        <Checkbox name="curves" value="shown" defaultChecked required />
      </form>,
    ),
  );
  const form = container.querySelector("form")!;
  const input = container.querySelector("input")!;
  expect(new FormData(form).get("curves")).toBe("shown");
  act(() => input.click());
  expect(new FormData(form).has("curves")).toBe(false);
  expect(input.validity.valueMissing).toBe(true);
  act(() => form.reset());
  expect(input.checked).toBe(true);
  expect(input.validity.valid).toBe(true);
});

it("disabled inputs neither activate nor submit and preserve native event props", () => {
  const change = vi.fn();
  const down = vi.fn();
  act(() =>
    root.render(
      <form>
        <Checkbox
          disabled
          defaultChecked
          name="choice"
          onCheckedChange={change}
          onPointerDown={down}
          aria-label="Choice"
          className="custom"
        />
      </form>,
    ),
  );
  const input = container.querySelector("input")!;
  act(() => input.click());
  expect(change).not.toHaveBeenCalled();
  expect(input.checked).toBe(true);
  expect(new FormData(container.querySelector("form")!).has("choice")).toBe(
    false,
  );
  expect(input.classList.contains("custom")).toBe(true);
  expect(input.getAttribute("aria-label")).toBe("Choice");
  act(() => input.dispatchEvent(new Event("pointerdown", { bubbles: true })));
  expect(down).toHaveBeenCalledOnce();
});

it("renders a named native checkbox on the server without browser APIs", () => {
  const html = renderToString(
    <Checkbox indeterminate aria-label="All experiments" />,
  );
  expect(html).toContain('type="checkbox"');
  expect(html).toContain('aria-checked="mixed"');
  expect(html).toContain('aria-label="All experiments"');
});
