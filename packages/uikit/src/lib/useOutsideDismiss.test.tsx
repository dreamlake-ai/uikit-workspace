// @vitest-environment jsdom
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from "../components/ContextMenu/ContextMenu";
import { BreadcrumbTree } from "../components/BreadcrumbTree/BreadcrumbTree";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Menu } from "../components/Menu/Menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "../components/DropdownMenu/DropdownMenu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../components/Popover/Popover";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "../components/Select/Select";

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const menu = (props = {}) => (
  <Menu defaultOpen trigger={() => <button>Version</button>} {...props}>
    <button>Version one</button>
    <iframe title="Inside preview" />
  </Menu>
);
const floating = [
  [
    "DropdownMenu",
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>Version</DropdownMenuTrigger>
      <DropdownMenuContent>
        <button>Version one</button>
      </DropdownMenuContent>
    </DropdownMenu>,
  ],
  [
    "Popover",
    <Popover defaultOpen>
      <PopoverTrigger>Version</PopoverTrigger>
      <PopoverContent>
        <button>Version one</button>
      </PopoverContent>
    </Popover>,
  ],
  [
    "Select",
    <Select defaultOpen>
      <SelectTrigger>Version</SelectTrigger>
      <SelectContent>
        <SelectItem value="one">Version one</SelectItem>
      </SelectContent>
    </Select>,
  ],
] as const;
async function render(children: ReactNode) {
  await act(async () =>
    root.render(
      <>
        <div
          data-outside=""
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          Editor surface
        </div>
        <iframe title="Outside preview" />
        {children}
      </>,
    ),
  );
}
const visiblePanel = () =>
  document.querySelector('[role="menu"], [role="dialog"], [role="listbox"]');
async function focusFrame(title: string) {
  // Popover moves focus after mounting. Exercise a settled open overlay,
  // rather than racing its scheduled initial focus against the outside click.
  const popover = document.querySelector('[data-uikit-overlay="popover"]');
  if (popover)
    await act(async () => {
      await vi.waitFor(() =>
        expect(popover.contains(document.activeElement)).toBe(true),
      );
    });
  await act(async () => {
    document
      .querySelector<HTMLIFrameElement>(`iframe[title="${title}"]`)!
      .focus();
    window.dispatchEvent(new Event("blur"));
    await new Promise((resolve) => setTimeout(resolve, 5));
  });
}
for (const event of ["pointerdown", "mousedown"]) {
  it(`Menu closes when an outside surface stops ${event} propagation`, async () => {
    await render(menu());
    expect(visiblePanel()).not.toBeNull();
    await act(async () =>
      document
        .querySelector("[data-outside]")!
        .dispatchEvent(new MouseEvent(event, { bubbles: true })),
    );
    expect(visiblePanel()).toBeNull();
  });
}
it("Menu keeps trigger/panel presses and embedded frame focus inside; outside frame focus closes it", async () => {
  await render(menu());
  await act(async () => {
    container
      .querySelector("button")!
      .dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    visiblePanel()!
      .querySelector("button")!
      .dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
  });
  expect(visiblePanel()).not.toBeNull();
  await focusFrame("Inside preview");
  expect(visiblePanel()).not.toBeNull();
  await focusFrame("Outside preview");
  expect(visiblePanel()).toBeNull();
});
it("Menu does not close on window blur without an outside iframe", async () => {
  await render(menu());
  await act(async () => {
    window.dispatchEvent(new Event("blur"));
    await new Promise((resolve) => setTimeout(resolve, 5));
  });
  expect(visiblePanel()).not.toBeNull();
});
it("Menu remembers an outside frame press when the frame disappears before the deferred focus check", async () => {
  await render(menu());
  await act(async () => {
    const frame = document.createElement("iframe");
    document.body.appendChild(frame);
    frame.focus();
    window.dispatchEvent(new Event("blur"));
    frame.remove();
    expect(document.activeElement).toBe(document.body);
    await new Promise((resolve) => setTimeout(resolve, 5));
  });
  expect(visiblePanel()).toBeNull();
});
it("Menu respects dismissOnOutsideClick for both presses and frame focus", async () => {
  await render(menu({ dismissOnOutsideClick: false }));
  await act(async () =>
    document
      .querySelector("[data-outside]")!
      .dispatchEvent(new MouseEvent("pointerdown", { bubbles: true })),
  );
  await focusFrame("Outside preview");
  expect(visiblePanel()).not.toBeNull();
});
it("controlled menus can decline dismissal and still receive later outside presses", async () => {
  const change = vi.fn();
  await render(menu({ open: true, onOpenChange: change }));
  for (let i = 0; i < 2; i++)
    await act(async () =>
      document
        .querySelector("[data-outside]")!
        .dispatchEvent(new MouseEvent("pointerdown", { bubbles: true })),
    );
  expect(change.mock.calls).toEqual([[false], [false]]);
});
for (const [name, component] of floating) {
  it(`${name} dismisses an outside stopped press`, async () => {
    await render(component);
    expect(visiblePanel()).not.toBeNull();
    await act(async () =>
      document
        .querySelector("[data-outside]")!
        .dispatchEvent(new MouseEvent("pointerdown", { bubbles: true })),
    );
    expect(visiblePanel()).toBeNull();
  });
  it(`${name} dismisses when focus enters an outside iframe`, async () => {
    await render(component);
    expect(visiblePanel()).not.toBeNull();
    await focusFrame("Outside preview");
    expect(visiblePanel()).toBeNull();
  });
}

it("Menu closes when focus moves directly from an inside frame to an outside frame without another host blur", async () => {
  await render(menu());
  await focusFrame("Inside preview");
  expect(visiblePanel()).not.toBeNull();
  await act(async () => {
    document
      .querySelector<HTMLIFrameElement>('iframe[title="Outside preview"]')!
      .focus();
    await new Promise((resolve) => setTimeout(resolve, 40));
  });
  expect(visiblePanel()).toBeNull();
});

for (const outside of ["press", "frame"]) {
  it(`ContextMenu closes on outside ${outside}`, async () => {
    await render(
      <ContextMenu>
        <ContextMenuTrigger data-context-trigger="">Target</ContextMenuTrigger>
        <ContextMenuContent>
          <button>Action</button>
        </ContextMenuContent>
      </ContextMenu>,
    );
    await act(async () =>
      document
        .querySelector("[data-context-trigger]")!
        .dispatchEvent(new MouseEvent("contextmenu", { bubbles: true })),
    );
    expect(visiblePanel()).not.toBeNull();
    if (outside === "frame") await focusFrame("Outside preview");
    else
      await act(async () =>
        document
          .querySelector("[data-outside]")!
          .dispatchEvent(new MouseEvent("pointerdown", { bubbles: true })),
      );
    expect(visiblePanel()).toBeNull();
  });
  it(`BreadcrumbTree closes on outside ${outside}`, async () => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    await render(
      <BreadcrumbTree
        path={[]}
        onNavigate={() => {}}
        fetchChildren={async () => ({ items: [], totalPages: 1 })}
      />,
    );
    const trigger = document.querySelector<HTMLButtonElement>(
      '[aria-label="Browse folders"]',
    )!;
    await act(async () => trigger.click());
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    if (outside === "frame") await focusFrame("Outside preview");
    else
      await act(async () =>
        document
          .querySelector("[data-outside]")!
          .dispatchEvent(new MouseEvent("pointerdown", { bubbles: true })),
      );
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
}
