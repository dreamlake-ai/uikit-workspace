// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { CollectionRow, PinnedCollectionDrawer } from "./CollectionList";

it("keeps menu actions independent of row navigation and exposes pin status", () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const select = vi.fn(),
    pin = vi.fn(),
    rowKey = vi.fn();
  try {
    act(() =>
      root.render(
        <CollectionRow
          role="button"
          tabIndex={0}
          onClick={select}
          onKeyDown={rowKey}
          icon={null}
          name="Evaluation"
          pinned
          actions={<button onClick={pin}>Pin to top</button>}
        />,
      ),
    );
    expect(
      host.querySelector('[aria-label="Pinned in this collection"]'),
    ).not.toBeNull();
    // The badge remains announced after moving into the otherwise decorative icon slot.
    expect(
      host
        .querySelector('[aria-label="Pinned in this collection"]')!
        .closest('[aria-hidden="true"]'),
    ).toBeNull();
    const button = host.querySelector("button")!;
    act(() => button.click());
    expect(pin).toHaveBeenCalledOnce();
    expect(select).not.toHaveBeenCalled();
    act(() =>
      button.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      ),
    );
    expect(rowKey).not.toHaveBeenCalled();
    act(() =>
      host.querySelector<HTMLElement>(".uikit-collection-row")!.click(),
    );
    expect(select).toHaveBeenCalledOnce();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it("opens pins by default, links the disclosure, and makes collapsed children inert", () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <PinnedCollectionDrawer count={1}>
          <button>Research brief</button>
        </PinnedCollectionDrawer>,
      ),
    );
    const trigger = host.querySelector<HTMLButtonElement>(
      '[aria-label="Pinned"]',
    )!;
    const content = host.querySelector<HTMLElement>(
      '[aria-label="Pinned items"]',
    )!;
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(content.id);
    expect(content.hasAttribute("inert")).toBe(false);
    act(() => trigger.click());
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(content.hasAttribute("inert")).toBe(true);
    act(() => trigger.click());
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
