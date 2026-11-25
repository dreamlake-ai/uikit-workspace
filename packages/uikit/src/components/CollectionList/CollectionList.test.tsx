// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import {
  CollectionList,
  CollectionRow,
  PinnedCollectionDrawer,
} from "./CollectionList";

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

it("retains row DOM and follows grid geometry while ignoring hidden items", () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const render = (columns: number) => (
    <CollectionList columns={columns}>
      {[0, 1, 2, 3, 4, 5].map((id) => (
        <CollectionRow
          key={id}
          role="button"
          tabIndex={0}
          icon={null}
          name={`file-${id}`}
        />
      ))}
    </CollectionList>
  );
  try {
    act(() => root.render(render(1)));
    const rows = Array.from(
      host.querySelectorAll<HTMLElement>("[data-collection-item]"),
    );
    act(() => root.render(render(3)));
    expect(Array.from(host.querySelectorAll("[data-collection-item]"))).toEqual(
      rows,
    );
    rows.forEach((row, i) => {
      const rect = {
        x: (i % 3) * 90,
        y: Math.floor(i / 3) * 80,
        width: 80,
        height: 70,
      } as DOMRect;
      row.getBoundingClientRect = () => rect;
      row.getClientRects = () => [rect] as unknown as DOMRectList;
    });
    rows[0].focus();
    act(() =>
      rows[0].dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          bubbles: true,
          cancelable: true,
        }),
      ),
    );
    expect(document.activeElement).toBe(rows[1]);
    act(() =>
      rows[1].dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowDown",
          bubbles: true,
          cancelable: true,
        }),
      ),
    );
    expect(document.activeElement).toBe(rows[4]);
    rows[5].setAttribute("inert", "");
    act(() =>
      rows[4].dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          bubbles: true,
          cancelable: true,
        }),
      ),
    );
    expect(document.activeElement).not.toBe(rows[5]);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
