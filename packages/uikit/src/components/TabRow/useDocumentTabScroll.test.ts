// @vitest-environment jsdom
import { expect, it } from "vitest";
import { revealDocumentTab } from "./useDocumentTabScroll";

it("reveals a tab inside the right gutter before its sticky close control overlaps the label", () => {
  const strip = document.createElement("div");
  const item = document.createElement("div");
  strip.style.scrollPaddingLeft = "8px";
  strip.style.scrollPaddingRight = "8px";
  strip.append(item);
  document.body.append(strip);
  strip.getBoundingClientRect = () => new DOMRect(0, 0, 200, 30);
  item.getBoundingClientRect = () =>
    new DOMRect(54 - strip.scrollLeft, 0, 144, 30);
  revealDocumentTab(strip, item);
  expect(strip.scrollLeft).toBe(6);
  expect(item.getBoundingClientRect().right).toBe(192);
  expect(item.style.position).toBe("");
  strip.remove();
});

it.each([0, 8])(
  "preserves a %ipx left gutter when revealing an earlier tab",
  (left) => {
    const strip = document.createElement("div");
    const item = document.createElement("div");
    strip.style.scrollPaddingLeft = `${left}px`;
    strip.style.scrollPaddingRight = "8px";
    strip.scrollLeft = 20;
    strip.append(item);
    document.body.append(strip);
    strip.getBoundingClientRect = () => new DOMRect(0, 0, 200, 30);
    item.getBoundingClientRect = () =>
      new DOMRect(18 - strip.scrollLeft, 0, 144, 30);
    revealDocumentTab(strip, item);
    expect(item.getBoundingClientRect().left).toBe(left);
    strip.remove();
  },
);
