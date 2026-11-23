// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  glideTransition,
  resolveGlideMs,
} from "./Tooltip";
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const rect = (top: number, left = 200, height = 24) =>
  ({
    x: left,
    y: top,
    top,
    left,
    width: 0,
    height,
    right: left,
    bottom: top + height,
  }) as DOMRect;

const translate = (el: HTMLElement) => {
  const m = /translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(
    el.style.transform,
  );
  return m ? { x: Number(m[1]), y: Number(m[2]) } : null;
};

const flush = async () => {
  // Floating UI computes in a microtask; the glide arms one frame later.
  for (let i = 0; i < 2; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
  }
};

function mount() {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  return {
    root,
    cleanup: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
}

const box = (x: number, y: number, width: number, height: number) =>
  ({
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    toJSON() {},
  }) as DOMRect;

beforeEach(() => {
  // jsdom has no layout: give the viewport, the trigger and the surface sizes.
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      if (this.tagName === "BUTTON") return box(0, 0, 60, 24);
      if (this.hasAttribute("data-uikit-overlay")) return box(0, 0, 160, 80);
      if (this.hasAttribute("data-uikit-overlay-arrow")) return box(0, 0, 7, 7);
      return box(0, 0, 1000, 800);
    },
  );
  for (const [property, axis] of [
    ["offsetWidth", "width"],
    ["offsetHeight", "height"],
    ["clientWidth", "width"],
    ["clientHeight", "height"],
  ] as const)
    vi.spyOn(HTMLElement.prototype, property, "get").mockImplementation(
      function (this: HTMLElement) {
        return this.getBoundingClientRect()[axis];
      },
    );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document
    .querySelectorAll("[data-floating-ui-portal]")
    .forEach((n) => n.remove());
});

it("resolves glide durations and honours reduced motion", () => {
  expect(resolveGlideMs(undefined, false)).toBe(0);
  expect(resolveGlideMs(false, false)).toBe(0);
  expect(resolveGlideMs(true, false)).toBe(160);
  expect(resolveGlideMs({ durationMs: 90 }, false)).toBe(90);
  expect(resolveGlideMs({}, false)).toBe(160);
  expect(resolveGlideMs(true, true)).toBe(0);
  expect(glideTransition(0, ["transform"])).toBeUndefined();
  expect(glideTransition(160, ["left", "top"])).toMatch(
    /^left 160ms cubic-bezier.*, top 160ms/,
  );
});

it("positions against anchorRect without a trigger and keeps content mounted as it moves", async () => {
  const { root, cleanup } = mount();
  const render = (top: number) =>
    root.render(
      <Tooltip open anchorRect={rect(top)} side="right" glide>
        <TooltipContent>
          <span data-testid="body">Preview</span>
        </TooltipContent>
      </Tooltip>,
    );
  await act(async () => render(100));
  await flush();
  const tip = document.querySelector<HTMLElement>('[role="tooltip"]')!;
  const body = tip.querySelector('[data-testid="body"]');
  const before = translate(tip)!;
  // side="right" of an anchor at x=200: the surface starts right of it.
  expect(before.x).toBeGreaterThanOrEqual(200);
  // Once the first position is painted the glide arms; the wedge follows.
  expect(tip.hasAttribute("data-glide")).toBe(true);
  expect(tip.style.transition).toMatch(/^transform 160ms cubic-bezier/);
  const wedge = tip.querySelector<HTMLElement>("[data-uikit-overlay-arrow]")!;
  expect(wedge.style.transition).toMatch(/^left 160ms .*top 160ms/);

  await act(async () => render(300));
  await flush();
  const after = document.querySelector<HTMLElement>('[role="tooltip"]')!;
  // Same surface and same child node: the content moved, it did not remount.
  expect(after).toBe(tip);
  expect(after.querySelector('[data-testid="body"]')).toBe(body);
  expect(translate(after)!.y - before.y).toBe(200);
  cleanup();
});

it("re-reads a getter anchor each frame while open", async () => {
  const { root, cleanup } = mount();
  let top = 40;
  await act(async () =>
    root.render(
      <Tooltip open anchorRect={() => rect(top)} side="right" showArrow={false}>
        <TooltipContent>Moving</TooltipContent>
      </Tooltip>,
    ),
  );
  await flush();
  const tip = document.querySelector<HTMLElement>('[role="tooltip"]')!;
  const first = translate(tip)!;
  top = 260;
  // No re-render: the animation-frame autoUpdate must pick the new rect up.
  await flush();
  expect(translate(tip)!.y - first.y).toBe(220);
  cleanup();
});

it("does not glide without glide, or under reduced motion", async () => {
  vi.stubGlobal(
    "matchMedia",
    (q: string) =>
      ({
        matches: q.includes("reduce"),
        media: q,
        addEventListener() {},
        removeEventListener() {},
      }) as unknown as MediaQueryList,
  );
  const { root, cleanup } = mount();
  await act(async () =>
    root.render(
      <>
        <Tooltip open anchorRect={rect(10)} glide>
          <TooltipContent>Reduced</TooltipContent>
        </Tooltip>
        <Tooltip open anchorRect={rect(80)}>
          <TooltipContent>Plain</TooltipContent>
        </Tooltip>
      </>,
    ),
  );
  await flush();
  const tips = document.querySelectorAll<HTMLElement>('[role="tooltip"]');
  expect(tips).toHaveLength(2);
  for (const tip of tips) {
    expect(tip.hasAttribute("data-glide")).toBe(false);
    expect(tip.style.transition).toBe("");
  }
  cleanup();
});

it("anchorRect overrides placement while the trigger still opens it", async () => {
  const { root, cleanup } = mount();
  await act(async () =>
    root.render(
      <Tooltip anchorRect={rect(500, 400)} side="right" showArrow={false}>
        <TooltipTrigger asChild>
          <button>Row</button>
        </TooltipTrigger>
        <TooltipContent>Row details</TooltipContent>
      </Tooltip>,
    ),
  );
  await act(async () => document.querySelector("button")!.focus());
  await flush();
  const tip = document.querySelector<HTMLElement>('[role="tooltip"]')!;
  expect(tip.textContent).toBe("Row details");
  // jsdom lays the button out at 0,0; the anchor sits at x=400.
  expect(translate(tip)!.x).toBeGreaterThanOrEqual(400);
  cleanup();
});

it("Escape dismisses an anchor-only tooltip", async () => {
  const { root, cleanup } = mount();
  const onOpenChange = vi.fn();
  await act(async () =>
    root.render(
      <Tooltip open anchorRect={rect(10)} onOpenChange={onOpenChange}>
        <TooltipContent>Anchored</TooltipContent>
      </Tooltip>,
    ),
  );
  await act(async () =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    ),
  );
  expect(onOpenChange).toHaveBeenCalledWith(false);
  cleanup();
});
