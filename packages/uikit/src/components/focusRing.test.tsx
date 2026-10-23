// @vitest-environment jsdom
// Every kit control a keyboard user can Tab to paints the 2px accent ring on
// :focus-visible (WCAG 2.4.7). `outline-none` zeroes Tailwind v4's
// --tw-outline-style, so a ring needs `outline-solid` as well as a width —
// a class list with `focus-visible:outline-2` but no `outline-solid` paints
// nothing, which is how PillSelect, CollectionEntry and ThemeCycleToggle
// shipped.
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { CollectionEntry } from "./CollectionEntry";
import { PillRadio } from "./PillSelect";
import { Select, SelectTrigger, SelectValue } from "./Select";
import {
  LiquidToggle,
  ThemeCycleToggle,
  ThemeModeToggle,
  ThemeProvider,
} from "./Theme";
import { Toggle, ToggleButton, ToggleButtons } from "./Toggle";

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  // ThemeProvider reads the system scheme; jsdom has no matchMedia.
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const RING = [
  "focus-visible:outline-solid",
  "focus-visible:outline-2",
  "focus-visible:outline-uikit-accent",
];

const noop = () => {};
const CASES: [string, () => ReactNode][] = [
  [
    "SelectTrigger",
    () => (
      <Select value="recent" onValueChange={noop}>
        <SelectTrigger aria-label="Sort">
          <SelectValue />
        </SelectTrigger>
      </Select>
    ),
  ],
  ["Toggle", () => <Toggle aria-label="Bold">B</Toggle>],
  [
    "ToggleButton",
    () => (
      <ToggleButtons value="list" onValueChange={noop}>
        <ToggleButton value="list">List</ToggleButton>
      </ToggleButtons>
    ),
  ],
  [
    "PillRadio",
    () => (
      <PillRadio
        value="a"
        onValueChange={noop}
        options={[{ value: "a", label: "member" }]}
      />
    ),
  ],
  ["CollectionEntry", () => <CollectionEntry label="All Bindrs" />],
  [
    "ThemeCycleToggle",
    () => <ThemeCycleToggle value="system" onValueChange={noop} />,
  ],
  [
    "ThemeModeToggle",
    () => <ThemeModeToggle value="light" onValueChange={noop} />,
  ],
  [
    "LiquidToggle",
    () => (
      <ThemeProvider>
        <LiquidToggle />
      </ThemeProvider>
    ),
  ],
];

it.each(CASES)("%s paints a keyboard focus ring", (_name, render) => {
  act(() => root.render(render()));
  const buttons = [...container.querySelectorAll("button")];
  expect(buttons.length).toBeGreaterThan(0);
  for (const b of buttons) {
    const cls = b.className.split(/\s+/);
    for (const c of RING) expect(cls).toContain(c);
  }
});
