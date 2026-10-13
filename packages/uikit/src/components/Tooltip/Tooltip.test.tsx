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
      </Tooltip>,
    ),
  );
  // A wrapped button must still be reachable through the ref its owner holds.
  expect(ref.current).toBe(host.querySelector("button"));
  act(() => root.unmount());
  host.remove();
});
