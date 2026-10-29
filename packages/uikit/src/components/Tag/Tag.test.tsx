// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { Tag, type TagTone } from "./Tag";

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const TONES: [TagTone, string][] = [
  ["blue", "blue"],
  ["green", "green"],
  ["amber", "amber"],
  ["red", "red"],
  ["purple", "purple"],
  ["warmGray", "warm-gray"],
];

it.each(TONES)(
  "tone=%s colours its words with the AA text step, not the palette hex",
  (tone, css) => {
    for (const variant of ["tag", "pill"] as const) {
      act(() => root.render(<Tag name="ok" tone={tone} variant={variant} />));
      const el = container.firstElementChild as HTMLElement;
      expect(el.style.getPropertyValue("--tag-static")).toBe(
        `var(--tone-${css}-text)`,
      );
      expect(el.style.getPropertyValue("--tag-accent")).toBe(
        `var(--tone-${css}-text)`,
      );
    }
  },
);

it("an accent tone name resolves to the text step too", () => {
  act(() => root.render(<Tag name="x" tone="red" accent="amber" />));
  const el = container.firstElementChild as HTMLElement;
  expect(el.style.getPropertyValue("--tag-accent")).toBe(
    "var(--tone-amber-text)",
  );
});

it("styles.css defines every text step in light, dark and system-dark", () => {
  const css = readFileSync(join(__dirname, "../../styles.css"), "utf8");
  for (const [, name] of TONES) {
    const decls = css.match(new RegExp(`--tone-${name}-text:`, "g")) ?? [];
    expect(decls.length, name).toBe(3);
  }
});
