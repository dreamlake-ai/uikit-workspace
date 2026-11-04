// @vitest-environment jsdom
import { act, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VideoAnnotator } from "./VideoAnnotator";
import type { Track, VideoAnnotatorHandle } from "./types";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

const tracks: Track[] = [
  {
    id: "subtasks",
    name: "subtasks",
    segments: [
      { id: "a", start: 0, end: 4, description: "reach", verified: false },
      { id: "b", start: 4, end: 10, description: "grasp", verified: false },
    ],
  },
  {
    id: "task",
    name: "task",
    segments: [{ id: "t", start: 0, end: 10, description: "pick", verified: false }],
  },
];

function mount(readOnly: boolean) {
  const onTracksChange = vi.fn();
  const onApproveToggle = vi.fn();
  const onSelectedChange = vi.fn();
  const ref = createRef<VideoAnnotatorHandle>();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() =>
    root!.render(
      <VideoAnnotator
        ref={ref}
        videoUrl="about:blank"
        duration={10}
        tracks={tracks}
        activeTrackIndex={0}
        selectedIndex={1}
        onSelectedChange={onSelectedChange}
        onTracksChange={onTracksChange}
        onApproveToggle={onApproveToggle}
        showDescription
        onDescriptionChange={() => {}}
        readOnly={readOnly}
      />,
    ),
  );
  return { onTracksChange, onApproveToggle, onSelectedChange, ref };
}

const key = (k: string) => {
  const e = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true });
  act(() => {
    document.body.dispatchEvent(e);
  });
  return e;
};
const label = (l: string) => document.querySelector(`[aria-label="${l}"]`);

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

describe("VideoAnnotator readOnly", () => {
  it("editable (control): shows edit entries and the edit keys reach the host", () => {
    const { onTracksChange, onApproveToggle } = mount(false);
    expect(label("Split at playhead (S)")).not.toBeNull();
    expect(document.querySelectorAll(".va-handle").length).toBeGreaterThan(0);
    const back = key("Backspace");
    expect(back.defaultPrevented).toBe(true);
    expect(onTracksChange).toHaveBeenCalledTimes(1);
    key("a");
    expect(onApproveToggle).toHaveBeenCalledTimes(1);
  });

  it("hides split / merge and the boundary handles", () => {
    mount(true);
    expect(label("Split at playhead (S)")).toBeNull();
    expect(label("Merge into previous (Backspace)")).toBeNull();
    expect(document.querySelectorAll(".va-handle")).toHaveLength(0);
    expect(label("Add track")).toBeNull();
    expect(document.querySelector(".va-rowlab-x")).toBeNull();
    // Viewing controls stay (jsdom has no width, so the step buttons are
    // folded into ⋯ — play never folds).
    expect(label("Play/Pause (Space)")).not.toBeNull();
    expect(label("More controls")).not.toBeNull();
  });

  it("leaves s / a / Backspace unbound — no edit callback, no preventDefault", () => {
    const { onTracksChange, onApproveToggle } = mount(true);
    for (const k of ["s", "S", "a", "A"]) key(k);
    const back = key("Backspace");
    expect(back.defaultPrevented).toBe(false);
    expect(onTracksChange).not.toHaveBeenCalled();
    expect(onApproveToggle).not.toHaveBeenCalled();
  });

  it("shows the description in a labelled read-only box, not an editor", () => {
    mount(true);
    const box = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Phase description"]')!;
    expect(box.readOnly).toBe(true);
    expect(box.value).toBe("grasp");
    expect(box.placeholder).not.toMatch(/edit/i);
  });

  it("keeps segment navigation keys", () => {
    const { onSelectedChange } = mount(true);
    key("k");
    expect(onSelectedChange).toHaveBeenCalledWith(0);
  });

  it("makes the imperative edit methods no-ops", () => {
    const { onTracksChange, onApproveToggle, ref } = mount(true);
    act(() => {
      ref.current!.split();
      ref.current!.merge();
      ref.current!.toggleApprove();
      ref.current!.addTrack();
      ref.current!.removeTrack(1);
    });
    expect(onTracksChange).not.toHaveBeenCalled();
    expect(onApproveToggle).not.toHaveBeenCalled();
  });
});
