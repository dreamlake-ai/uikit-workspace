// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Transport, needed } from "./Transport";
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

function at(width: number, extra: Partial<typeof props> = {}) {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(width);
  // The annotator's stylesheet: Transport waits for it before measuring.
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.append(style);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root!.render(<Transport {...props} {...extra} />));
  return document.querySelector<HTMLElement>(".va-transport")!;
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  document.head.querySelectorAll("style").forEach((s) => s.remove());
  vi.restoreAllMocks();
});

// Widths from the bar's fixed sizes (readout 176, speed ~40, icons 30, play 36,
// gaps 8 / 10). Play sits on the exact centre, so both side columns are as wide
// as the WIDER side group: full needs 656, no readout 344, frame step folded
// 268, segment step folded 192. Without hand pose, folding merge (level 2)
// saves nothing over level 1 (split + merge = split + ⋯), so 344 → level 1 and
// just below it → level 3; level 2 shows up when the right side is wider.
describe("Transport stays one row by giving things up in order", () => {
  it("shows everything when it fits", () => {
    expect(at(700).dataset.level).toBe("0");
    expect(screen.getByText(props.readout)).not.toBeNull();
    expect(screen.queryByLabelText("More controls")).toBeNull();
  });
  it("hides the readout once the readout side no longer fits beside the centred cluster", () => {
    expect(at(600).dataset.level).toBe("1");
  });
  it("hides the readout first", () => {
    expect(at(400).dataset.level).toBe("1");
    expect(screen.queryByText(props.readout)).toBeNull();
    expect(screen.getByLabelText("Playback speed")).not.toBeNull();
  });
  it("folds speed, merge and hand pose into ⋯ when the right side is the wider one", () => {
    expect(at(380, { hasHandpose: true }).dataset.level).toBe("2");
    expect(screen.getByLabelText("More controls")).not.toBeNull();
    expect(screen.queryByLabelText("Playback speed")).toBeNull();
    expect(
      screen.queryByLabelText("Merge into previous (Backspace)"),
    ).toBeNull();
    expect(screen.getByLabelText("Prev frame (←)")).not.toBeNull();
  });
  it("then frame step, then segment step", () => {
    expect(at(300).dataset.level).toBe("3");
    expect(screen.queryByLabelText("Prev frame (←)")).toBeNull();
    expect(screen.getByLabelText("Prev segment (,)")).not.toBeNull();
  });
  it("never folds play, split or ⋯", () => {
    expect(at(240).dataset.level).toBe("4");
    expect(screen.getByLabelText("Play/Pause (Space)")).not.toBeNull();
    expect(screen.getByLabelText("Split at playhead (S)")).not.toBeNull();
    expect(screen.getByLabelText("More controls")).not.toBeNull();
    expect(screen.queryByLabelText("Prev segment (,)")).toBeNull();
  });
});

describe("play / pause sits on the bar's exact centre at every level", () => {
  it("lays the bar out as a 1fr auto 1fr grid", () => {
    const bar = at(700);
    const cs = getComputedStyle(bar);
    expect(cs.display).toBe("grid");
    expect(CSS).toMatch(
      /\.va-transport\{display:grid;grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\)/,
    );
  });

  // jsdom has no layout, so lay the grid out by hand from the same sizes:
  // two equal side tracks, the cluster in the middle. At the level Transport
  // picks, each side group must fit its track (so neither can shove the
  // cluster), and play's centre is then the bar's centre.
  const ICON = 30,
    PLAY = 36,
    GAP = 8,
    COL_GAP = 10;
  const w = { readout: 176, speed: 40 };
  const sum = (xs: number[]) =>
    xs.length ? xs.reduce((a, b) => a + b, 0) + GAP * (xs.length - 1) : 0;
  const groups = (level: number, hand: boolean) => {
    const left = sum([
      ...(level < 1 ? [w.readout] : []),
      ...(level < 2 ? [w.speed] : []),
    ]);
    const side = level < 4 ? (level < 3 ? [ICON, ICON] : [ICON]) : [];
    const cluster = [...side, PLAY, ...side];
    const right = sum([
      ICON,
      ...(level < 2 ? [ICON, ...(hand ? [ICON] : [])] : []),
      ...(level >= 2 ? [ICON] : []),
    ]);
    // play's offset inside the cluster: the step buttons before it
    const before = side.length ? sum(side) + GAP : 0;
    return { left, right, cluster: sum(cluster), playMid: before + PLAY / 2 };
  };
  for (const hand of [false, true])
    for (const width of [800, 720, 600, 420, 400, 380, 344, 300, 268, 240, 200])
      it(`${width}px${hand ? " with hand pose" : ""}`, () => {
        const level = Number(at(width, { hasHandpose: hand }).dataset.level);
        const g = groups(level, hand);
        expect(needed(level as 0, w, hand)).toBeLessThanOrEqual(width + 0.5);
        const track = (width - g.cluster - 2 * COL_GAP) / 2;
        expect(g.left).toBeLessThanOrEqual(track + 0.5);
        expect(g.right).toBeLessThanOrEqual(track + 0.5);
        const playCentre = track + COL_GAP + g.playMid;
        expect(Math.abs(playCentre - width / 2)).toBeLessThanOrEqual(1);
      });
});
