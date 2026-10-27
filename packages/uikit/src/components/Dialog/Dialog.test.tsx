// @vitest-environment jsdom
import { act, useRef, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";
import { MODAL_EXIT_FALLBACK_MS } from "../../lib/useModalPresence";
import { Popover, PopoverContent, PopoverTrigger } from "../Popover/Popover";
let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  // Floating UI intentionally disables layout checks in jsdom. Activate its
  // browser branch with a native-shaped observer and the layout boxes below.
  class LayoutObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(LayoutObserver, "toString", {
    value: () => "function ResizeObserver() { [native code] }",
  });
  vi.stubGlobal("ResizeObserver", LayoutObserver);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  // jsdom has no layout. Supply boxes only for visible controls so Floating UI's
  // actual tabbable filtering (not a mocked focus manager) remains exercised.
  vi.spyOn(Element.prototype, "getClientRects").mockImplementation(function (
    this: HTMLElement,
  ) {
    let element: HTMLElement | null = this;
    while (element) {
      if (element.hidden || element.style.display === "none")
        return [] as unknown as DOMRectList;
      element = element.parentElement;
    }
    return [new DOMRect(0, 0, 100, 30)] as unknown as DOMRectList;
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const button = (text: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
    (el) => el.textContent === text,
  )!;
async function settleFocus() {
  await act(async () => {
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
  });
}
async function click(element: HTMLElement) {
  await act(async () => element.click());
  await settleFocus();
}
// No animations in jsdom: the exit ends on the presence fallback timer.
async function finishExit() {
  await act(
    () => new Promise((resolve) => setTimeout(resolve, MODAL_EXIT_FALLBACK_MS + 20)),
  );
}
/** Dialogs still exposed: an exiting one is aria-hidden and inert. */
const liveDialogs = () =>
  Array.from(document.querySelectorAll('[role="dialog"]')).filter(
    (el) => !el.closest('[aria-hidden="true"]'),
  );
async function render(children: ReactNode) {
  await act(async () => root.render(children));
  await settleFocus();
}
function Demo({
  managed = true,
  children,
}: {
  managed?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={trigger} onClick={() => setOpen(true)}>
        Open
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Managed example"
        managedFocus={managed}
        returnFocus={trigger}
        showEscHint={false}
      >
        <div hidden>
          <input aria-label="Hidden panel" />
        </div>
        <div style={{ display: "none" }}>
          <input aria-label="Hidden ancestor" />
        </div>
        <input aria-label="Disabled" disabled />
        <input aria-label="Readonly" readOnly />
        {children}
        <button onClick={() => setOpen(false)}>Done</button>
      </Dialog>
    </>
  );
}
it("preserves default focus behavior while naming the dialog by its visible title", async () => {
  await render(<Demo managed={false} />);
  button("Open").focus();
  await click(button("Open"));
  expect(document.activeElement).toBe(button("Open"));
  const dialog = document.querySelector('[role="dialog"]')!;
  expect(
    document.getElementById(dialog.getAttribute("aria-labelledby")!)
      ?.textContent,
  ).toBe("Managed example");
  expect(document.querySelector("[data-floating-ui-focus-guard]")).toBeNull();
});
it("uses actual tabbable filtering, guards keyboard edges and returns to the explicit opener", async () => {
  await render(<Demo />);
  button("Open").focus();
  await click(button("Open"));
  const readonly = document.querySelector<HTMLInputElement>(
    '[aria-label="Readonly"]',
  )!;
  expect(document.activeElement).toBe(readonly);
  const guards = document.querySelectorAll<HTMLElement>(
    '[data-floating-ui-focus-guard][data-type="inside"]',
  );
  expect(guards.length).toBe(2);
  await act(async () => guards[0].focus());
  await settleFocus();
  expect(document.activeElement).toBe(button("Done"));
  await act(async () => guards[1].focus());
  await settleFocus();
  expect(document.activeElement).toBe(readonly);
  await click(button("Done"));
  // Focus returns when closing starts, not after the exit animation.
  expect(document.activeElement).toBe(button("Open"));
  expect(liveDialogs()).toHaveLength(0);
  await finishExit();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});
it("accepts an explicit initial element and a name without a visible heading", async () => {
  function Example() {
    const first = useRef<HTMLInputElement>(null);
    return (
      <Dialog
        open
        onClose={() => {}}
        managedFocus
        initialFocus={first}
        aria-label="Explicit name"
      >
        <button>Earlier</button>
        <input ref={first} />
      </Dialog>
    );
  }
  await render(<Example />);
  expect(document.activeElement?.tagName).toBe("INPUT");
  expect(
    document.querySelector('[role="dialog"]')?.getAttribute("aria-label"),
  ).toBe("Explicit name");
});
it("keeps nested UIKit portal controls interactive without competing focus listeners", async () => {
  await render(
    <Demo>
      <Popover>
        <PopoverTrigger>Help</PopoverTrigger>
        <PopoverContent>
          <button>Nested action</button>
        </PopoverContent>
      </Popover>
    </Demo>,
  );
  await click(button("Open"));
  await click(button("Help"));
  expect(button("Nested action")).toBeTruthy();
  await act(async () => button("Nested action").focus());
  expect(document.activeElement).toBe(button("Nested action"));
  await act(async () =>
    button("Nested action").dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    ),
  );
  expect(
    document.querySelector('[role="dialog"][aria-labelledby]'),
  ).not.toBeNull();
  expect(button("Nested action")).toBeUndefined();
});
it("keeps a nested managed dialog separate and restores the parent control", async () => {
  function Nested() {
    const [open, setOpen] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);
    return (
      <>
        <button ref={trigger} onClick={() => setOpen(true)}>
          Child
        </button>
        <Dialog
          managedFocus
          open={open}
          onClose={() => setOpen(false)}
          title="Child dialog"
          returnFocus={trigger}
        >
          <button onClick={() => setOpen(false)}>Close child</button>
        </Dialog>
      </>
    );
  }
  await render(
    <Demo>
      <Nested />
    </Demo>,
  );
  await click(button("Open"));
  await click(button("Child"));
  await act(async () => button("Close child").focus());
  expect(document.activeElement).toBe(button("Close child"));
  await act(async () =>
    button("Close child").dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    ),
  );
  await settleFocus();
  expect(liveDialogs()).toHaveLength(1);
  expect(document.activeElement).toBe(button("Child"));
  await finishExit();
  expect(document.querySelectorAll('[role="dialog"]').length).toBe(1);
  await click(button("Child"));
  await click(button("Close child"));
  expect(document.activeElement).toBe(button("Child"));
  await finishExit();
  expect(document.querySelectorAll('[role="dialog"]').length).toBe(1);
});
it("lets a long eyebrow yield before the title, and never squeezes the close button", async () => {
  await render(
    <Dialog
      open
      onClose={() => {}}
      title="Move note"
      eyebrow="Agent setup: task-specific expectations without prompt bloat"
    >
      body
    </Dialog>,
  );
  const title = document.querySelector("h3")!;
  const eyebrow = Array.from(document.querySelectorAll("span")).find(
    (el) => el.textContent?.startsWith("Agent setup"),
  )!;
  // The eyebrow is the one that ellipsizes, and it spends the overflow first.
  expect(eyebrow.className).toMatch(/\bmin-w-0\b/);
  expect(eyebrow.className).toMatch(/\btruncate\b/);
  expect(eyebrow.className).toMatch(/\bshrink-\[1000\]/);
  expect(eyebrow.className).not.toMatch(/\bshrink-0\b/);
  // The title still truncates as a last resort, but at the default weight.
  expect(title.className).toMatch(/\btruncate\b/);
  expect(title.className).not.toMatch(/shrink-\[/);
  const close = document.querySelector<HTMLButtonElement>('button[aria-label="Close"]')!;
  expect(close.style.flexShrink).toBe("0");
});
