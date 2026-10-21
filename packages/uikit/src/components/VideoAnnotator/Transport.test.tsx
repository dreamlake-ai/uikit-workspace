// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Transport } from "./Transport";
import { CSS } from "./styles";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | null = null;
let container: HTMLDivElement | null = null;
const byLabel = (label: string) =>
  document.querySelector(`[aria-label="${label}"]`);
const screen = {
  getByText: (t: string) =>
    [...document.querySelectorAll("*")].find(
      (e) => e.textContent === t && !e.children.length,
    ) ?? null,
  queryByText: (t: string) =>
    [...document.querySelectorAll("*")].find(
      (e) => e.textContent === t && !e.children.length,
    ) ?? null,
  getByLabelText: byLabel,
  queryByLabelText: byLabel,
};

const props = {
  readout: "00:01.00 / 00:10.00",
  rate: 1,
  speeds: [0.5, 1, 2],
  onSpeed: vi.fn(),
  playing: false,
  togglePlay: vi.fn(),
  stepFrame: vi.fn(),
  goSeg: vi.fn(),
  sel: 1,
  segCount: 3,
  doSplit: vi.fn(),
  doMerge: vi.fn(),
  hasHandpose: false,
  showHands: false,
  onToggleHands: vi.fn(),
};

function at(width: number) {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(width);
  // The annotator's stylesheet: Transport waits for it before measuring.
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.append(style);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root!.render(<Transport {...props} />));
  return document.querySelector<HTMLElement>(".va-transport")!;
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  document.head.querySelectorAll("style").forEach((s) => s.remove());
  vi.restoreAllMocks();
});

// Widths from the bar's fixed sizes (readout 176, speed ~40, icons 30, play 36,
// gaps 8 / 10): full needs 656 — the readout side sets BOTH sides' width so
// the cluster stays centred — then no readout 316, folded 266, no frame step
// 190, play + split + ⋯ 114.
describe("Transport stays one row by giving things up in order", () => {
  it("shows everything when it fits", () => {
    expect(at(700).dataset.level).toBe("0");
    expect(screen.getByText(props.readout)).not.toBeNull();
    expect(screen.queryByLabelText("More controls")).toBeNull();
  });
  it("hides the readout once it would push the cluster off centre", () => {
    expect(at(600).dataset.level).toBe("1");
  });
  it("hides the readout first", () => {
    expect(at(400).dataset.level).toBe("1");
    expect(screen.queryByText(props.readout)).toBeNull();
    expect(screen.getByLabelText("Playback speed")).not.toBeNull();
  });
  it("then folds speed and merge into ⋯", () => {
    expect(at(300).dataset.level).toBe("2");
    expect(screen.getByLabelText("More controls")).not.toBeNull();
    expect(screen.queryByLabelText("Playback speed")).toBeNull();
    expect(
      screen.queryByLabelText("Merge into previous (Backspace)"),
    ).toBeNull();
    expect(screen.getByLabelText("Prev frame (←)")).not.toBeNull();
  });
  it("then frame step, then segment step", () => {
    expect(at(200).dataset.level).toBe("3");
    expect(screen.queryByLabelText("Prev frame (←)")).toBeNull();
    expect(screen.getByLabelText("Prev segment (,)")).not.toBeNull();
  });
  it("never folds play, split or ⋯", () => {
    expect(at(120).dataset.level).toBe("4");
    expect(screen.getByLabelText("Play/Pause (Space)")).not.toBeNull();
    expect(screen.getByLabelText("Split at playhead (S)")).not.toBeNull();
    expect(screen.getByLabelText("More controls")).not.toBeNull();
    expect(screen.queryByLabelText("Prev segment (,)")).toBeNull();
  });
});
