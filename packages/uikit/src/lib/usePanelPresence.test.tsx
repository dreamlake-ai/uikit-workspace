// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/DropdownMenu/DropdownMenu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/Select/Select";
import { PANEL_EXIT_MS, usePanelPresence } from "./usePanelPresence";

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (HTMLElement.prototype as any).animate;
});

/** A stand-in for Element.animate: records each animation, lets the test
 *  finish it, and notes when the hook cancels it. */
interface FakeAnimation {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  cancelled: boolean;
  onfinish: (() => void) | null;
  cancel(): void;
  finish(): void;
}
function installFakeAnimate() {
  const made: FakeAnimation[] = [];
  (HTMLElement.prototype as any).animate = function (
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ) {
    const a: FakeAnimation = {
      keyframes,
      options,
      cancelled: false,
      onfinish: null,
      cancel() {
        this.cancelled = true;
      },
      finish() {
        this.onfinish?.();
      },
    };
    made.push(a);
    return a;
  };
  return made;
}

function Probe({ open }: { open: boolean }) {
  const p = usePanelPresence(open);
  return p.present ? (
    <div ref={p.ref} data-testid="panel" {...p.closingProps} />
  ) : null;
}
const panel = () =>
  document.querySelector<HTMLElement>('[data-testid="panel"]');

it("without Element.animate the panel unmounts at once, as before", async () => {
  await act(async () => root.render(<Probe open />));
  expect(panel()).not.toBeNull();
  await act(async () => root.render(<Probe open={false} />));
  expect(panel()).toBeNull();
});

it("stays mounted while it folds, out of reach, then unmounts when the fold ends", async () => {
  const made = installFakeAnimate();
  await act(async () => root.render(<Probe open />));
  await act(async () => root.render(<Probe open={false} />));
  const el = panel()!;
  expect(el).not.toBeNull();
  expect(el.hasAttribute("inert")).toBe(true);
  expect(el.getAttribute("aria-hidden")).toBe("true");
  expect(el.hasAttribute("data-closing")).toBe(true);
  expect(made).toHaveLength(1);
  expect(made[0].options.duration).toBe(PANEL_EXIT_MS);
  expect(made[0].options.fill).toBe("forwards");
  // Starts from the panel's own (open) pose, ends folded and transparent.
  expect(made[0].keyframes[0]).toMatchObject({
    opacity: "1",
    transform: "scale(1)",
  });
  expect(made[0].keyframes.at(-1)).toMatchObject({
    opacity: "0",
    transform: "scale(0.96)",
  });
  await act(async () => made[0].finish());
  expect(panel()).toBeNull();
});

it("reopening mid-fold animates the same panel back open instead of remounting", async () => {
  const made = installFakeAnimate();
  await act(async () => root.render(<Probe open />));
  const first = panel();
  await act(async () => root.render(<Probe open={false} />));
  await act(async () => root.render(<Probe open />));
  expect(panel()).toBe(first);
  expect(panel()!.hasAttribute("inert")).toBe(false);
  expect(made).toHaveLength(2);
  expect(made[0].cancelled).toBe(true);
  expect(made[1].keyframes.at(-1)).toMatchObject({
    opacity: "1",
    transform: "scale(1)",
  });
  // The fold's own finish can no longer unmount the reopened panel.
  await act(async () => made[0].finish());
  expect(panel()).toBe(first);
  await act(async () => made[1].finish());
  expect(panel()).toBe(first);
  // Closing again starts a fresh fold.
  await act(async () => root.render(<Probe open={false} />));
  expect(made).toHaveLength(3);
  await act(async () => made[2].finish());
  expect(panel()).toBeNull();
});

it("closing again while it is opening back up folds from there", async () => {
  const made = installFakeAnimate();
  await act(async () => root.render(<Probe open />));
  await act(async () => root.render(<Probe open={false} />));
  await act(async () => root.render(<Probe open />));
  await act(async () => root.render(<Probe open={false} />));
  expect(made).toHaveLength(3);
  expect(made[1].cancelled).toBe(true);
  // A stale finish from the reopen does nothing; the new fold unmounts it.
  await act(async () => made[1].finish());
  expect(panel()).not.toBeNull();
  await act(async () => made[2].finish());
  expect(panel()).toBeNull();
});

it("prefers-reduced-motion folds with a short fade only", async () => {
  const made = installFakeAnimate();
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: q.includes("reduce"),
    media: q,
  }));
  await act(async () => root.render(<Probe open />));
  await act(async () => root.render(<Probe open={false} />));
  expect(made[0].keyframes).toEqual([{ opacity: "1" }, { opacity: "0" }]);
  expect(made[0].options.duration).toBeLessThan(PANEL_EXIT_MS);
});

it("unmounts on the fallback timer if the fold never reports finishing", async () => {
  installFakeAnimate();
  await act(async () => root.render(<Probe open />));
  await act(async () => root.render(<Probe open={false} />));
  expect(panel()).not.toBeNull();
  await act(() => new Promise((r) => setTimeout(r, PANEL_EXIT_MS + 200)));
  expect(panel()).toBeNull();
});

function ControlledSelect() {
  const [value, setValue] = useState("a");
  return (
    <>
      <span data-testid="value">{value}</span>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger aria-label="Fruit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Apple</SelectItem>
          <SelectItem value="b">Banana</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}

it("Select: picking an option applies the value at once and folds the list away", async () => {
  const made = installFakeAnimate();
  await act(async () => root.render(<ControlledSelect />));
  const trigger = document.querySelector<HTMLButtonElement>(
    '[aria-label="Fruit"]',
  )!;
  await act(async () => trigger.click());
  const list = document.querySelector<HTMLElement>('[role="listbox"]')!;
  expect(list).not.toBeNull();
  const banana = [
    ...list.querySelectorAll<HTMLElement>('[role="option"]'),
  ].find((o) => o.textContent?.includes("Banana"))!;
  await act(async () => banana.click());
  expect(document.querySelector('[data-testid="value"]')!.textContent).toBe(
    "b",
  );
  // Still in the DOM, but folding and out of reach.
  expect(list.isConnected).toBe(true);
  expect(list.hasAttribute("inert")).toBe(true);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  await act(async () => made.at(-1)!.finish());
  expect(document.querySelector('[role="listbox"]')).toBeNull();
});

it("DropdownMenu: Escape closes with a fold and focus goes back to the trigger at once", async () => {
  const made = installFakeAnimate();
  await act(async () =>
    root.render(
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Rename</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    ),
  );
  const trigger = [...document.querySelectorAll<HTMLElement>("button")].find(
    (b) => b.textContent?.includes("Actions"),
  )!;
  trigger.focus();
  await act(async () => trigger.click());
  const menu = document.querySelector<HTMLElement>('[role="menu"]')!;
  expect(menu).not.toBeNull();
  // Let the menu settle (it moves focus to its first row on a frame) before
  // Escape — jsdom has no `inert`, so a late row focus would otherwise land.
  await act(async () => new Promise((r) => setTimeout(r, 50)));
  await act(async () => {
    menu.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await Promise.resolve();
  });
  await act(async () => new Promise((r) => setTimeout(r, 0)));
  expect(menu.isConnected).toBe(true);
  expect(menu.hasAttribute("inert")).toBe(true);
  expect(document.activeElement).toBe(trigger);
  await act(async () => made.at(-1)!.finish());
  expect(document.querySelector('[role="menu"]')).toBeNull();
});
