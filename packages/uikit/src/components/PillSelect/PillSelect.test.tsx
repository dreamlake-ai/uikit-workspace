// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { ChipMulti, PillRadio, type PillOption } from "./PillSelect";

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
});

const OPTIONS: PillOption[] = [
  { value: "private", label: "private", icon: <svg data-testid="lock" /> },
  { value: "public", label: "public", icon: <svg data-testid="globe" /> },
  { value: "team", label: "team" },
];

it("PillRadio draws an option icon before its label, hidden from the accessible name", async () => {
  await act(async () =>
    root.render(
      <PillRadio value="private" onValueChange={() => {}} options={OPTIONS} />,
    ),
  );
  const radios = [
    ...host.querySelectorAll<HTMLButtonElement>('[role="radio"]'),
  ];
  expect(radios.map((r) => r.textContent)).toEqual([
    "private",
    "public",
    "team",
  ]);
  const [selected, rest, plain] = radios.map((r) =>
    r.querySelector('[data-slot="pill-icon"]'),
  );
  expect(selected?.getAttribute("aria-hidden")).toBe("true");
  expect(selected?.nextSibling?.textContent).toBe("private");
  // The glyph trails the label: fainter at rest, a step up when chosen.
  expect(selected?.className).toContain("opacity-75");
  expect(rest?.className).toContain("opacity-50");
  // No icon, no empty slot.
  expect(plain).toBeNull();
});

it("ChipMulti takes the same icon", async () => {
  await act(async () =>
    root.render(
      <ChipMulti
        value={["public"]}
        onValueChange={() => {}}
        options={OPTIONS}
      />,
    ),
  );
  const chips = [
    ...host.querySelectorAll<HTMLButtonElement>("button[aria-pressed]"),
  ];
  expect(
    chips[1].querySelector('[data-slot="pill-icon"]')?.className,
  ).toContain("opacity-75");
  expect(
    chips[0].querySelector('[data-slot="pill-icon"]')?.className,
  ).toContain("opacity-50");
  expect(chips[2].querySelector('[data-slot="pill-icon"]')).toBeNull();
});
