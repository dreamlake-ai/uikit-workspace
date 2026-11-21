// @vitest-environment jsdom
import { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

it("asChild keeps the child's own ref", () => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const ref = createRef<HTMLButtonElement>();
  act(() =>
    root.render(
      <Tooltip>
        <TooltipTrigger asChild>
          <button ref={ref}>Read aloud</button>
        </TooltipTrigger>
        <TooltipContent>Read aloud</TooltipContent>
      </Tooltip>
    )
  );
  // A wrapped button must still be reachable through the ref its owner holds.
  expect(ref.current).toBe(host.querySelector("button"));
  act(() => root.unmount());
  host.remove();
});

it("keeps pointer-following hints keyboard accessible and dismisses on Escape", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      <Tooltip followPointer side="bottom" showArrow={false}>
        <TooltipTrigger asChild>
          <button>Session details</button>
        </TooltipTrigger>
        <TooltipContent>Host and workspace</TooltipContent>
      </Tooltip>
    )
  );
  await act(async () => host.querySelector("button")!.focus());
  expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
    "Host and workspace"
  );
  await act(async () =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    )
  );
  expect(document.querySelector('[role="tooltip"]')).toBeNull();
  act(() => root.unmount());
  host.remove();
});
