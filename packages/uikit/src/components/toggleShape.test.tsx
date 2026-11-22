// @vitest-environment jsdom
import { act, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ChipMulti,
  ChipMultiRound,
  LiquidToggle,
  LiquidToggleRound,
  PillRadio,
  PillRadioRound,
  SlideToggle,
  SlideToggleRound,
  Switch,
  SwitchRound,
  Tabs,
  TabsRound,
  ThemeCycleToggle,
  ThemeCycleToggleRound,
  ThemeModeToggle,
  ThemeModeToggleRound,
  ThemeProvider,
  Toggle,
  ToggleButton,
  ToggleButtons,
  ToggleButtonsRound,
  ToggleRound,
} from "../index";

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  // ThemeProvider reads the OS preference; jsdom has no matchMedia.
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (el: ReactElement) => {
  act(() => root.render(<ThemeProvider>{el}</ThemeProvider>));
  return container.querySelector<HTMLElement>("[data-shape]")!;
};

const noop = () => {};
const opts = [
  { value: "a", label: "A" },
  { value: "b", label: "B" },
];
const face = { node: "a", w: 14 };

// Every toggle: [name, square default, `*Round` preset, round class].
const CASES: [string, ReactElement, ReactElement, string][] = [
  ["Switch", <Switch />, <SwitchRound />, "uikit-switch-round"],
  [
    "Toggle",
    <Toggle>B</Toggle>,
    <ToggleRound>B</ToggleRound>,
    "uikit-toggle-round",
  ],
  [
    "ToggleButtons",
    <ToggleButtons value="a" onValueChange={noop}>
      <ToggleButton value="a">A</ToggleButton>
    </ToggleButtons>,
    <ToggleButtonsRound value="a" onValueChange={noop}>
      <ToggleButton value="a">A</ToggleButton>
    </ToggleButtonsRound>,
    "uikit-toggle-buttons-round",
  ],
  [
    "PillRadio",
    <PillRadio value="a" onValueChange={noop} options={opts} />,
    <PillRadioRound value="a" onValueChange={noop} options={opts} />,
    "uikit-pill-radio-round",
  ],
  [
    "ChipMulti",
    <ChipMulti value={[]} onValueChange={noop} options={opts} />,
    <ChipMultiRound value={[]} onValueChange={noop} options={opts} />,
    "uikit-chip-multi-round",
  ],
  [
    "SlideToggle",
    <SlideToggle on={false} onToggle={noop} left={face} right={face} />,
    <SlideToggleRound on={false} onToggle={noop} left={face} right={face} />,
    "uikit-slide-toggle-round",
  ],
  [
    "Tabs segment",
    <Tabs variant="segment" tabs={[{ value: "a", label: "A" }]} />,
    <TabsRound tabs={[{ value: "a", label: "A" }]} />,
    "uikit-tabs-segment-round",
  ],
  [
    "ThemeModeToggle",
    <ThemeModeToggle />,
    <ThemeModeToggleRound />,
    "uikit-theme-mode-toggle-round",
  ],
  [
    "ThemeCycleToggle",
    <ThemeCycleToggle />,
    <ThemeCycleToggleRound />,
    "uikit-theme-cycle-toggle-round",
  ],
  [
    "LiquidToggle",
    <LiquidToggle />,
    <LiquidToggleRound />,
    "uikit-liquid-toggle-round",
  ],
];

describe.each(CASES)("%s shape", (_name, square, round, roundCls) => {
  it("is square by default", () => {
    const el = render(square);
    expect(el.dataset.shape).toBe("square");
    expect(el.className).not.toContain(roundCls);
    expect(container.innerHTML).not.toContain("rounded-full");
    expect(container.innerHTML).not.toContain("rounded-uikit-round");
    expect(container.innerHTML).not.toContain("9999px");
  });

  it("keeps the round look behind the *Round preset", () => {
    const el = render(round);
    expect(el.dataset.shape).toBe("round");
    expect(el.className).toContain(roundCls);
    expect(container.innerHTML).toMatch(
      /rounded-uikit-round|--radius-uikit-round/,
    );
  });
});

it("Switch square uses the toggle radius tokens on track and thumb", () => {
  const el = render(<Switch />);
  expect(el.className).toContain("rounded-uikit-toggle");
  expect(el.querySelector("[data-slot=switch-thumb]")!.className).toContain(
    "rounded-uikit-toggle-thumb",
  );
});
