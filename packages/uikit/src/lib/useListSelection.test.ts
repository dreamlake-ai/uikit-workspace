// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useListSelection } from "./useListSelection";
type CompareRun = { id: string; name: string; path?: string };
// Original application gesture regression cases retained against the extracted
// controller. Only the React harness and app-owned selection state live here.
const mounted: Array<{ root: Root; element: HTMLElement }> = [];
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => {
  for (const { root, element } of mounted.splice(0)) {
    act(() => root.unmount());
    element.remove();
  }
});
function renderHook<T, P = undefined>(
  callback: (props: P) => T,
  options?: { initialProps: P },
) {
  const element = document.createElement("div");
  document.body.append(element);
  const root = createRoot(element);
  mounted.push({ root, element });
  const result = {} as { current: T };
  let props = options?.initialProps as P;
  function Harness() {
    result.current = callback(props);
    return null;
  }
  const rerender = (next?: P) => {
    if (next !== undefined) props = next;
    act(() => root.render(createElement(Harness)));
  };
  rerender();
  return { result, rerender };
}
function useRunSelection(resetKey: string) {
  const [runs, setRuns] = useState<CompareRun[]>([]);
  return {
    runs,
    ...useListSelection({
      selected: runs,
      onSelectionChange: setRuns,
      resetKey,
    }),
  };
}

/**
 * THE GESTURES, as Dash's `ExperimentListPanel` binds them.
 *
 * Every click on a run row is a selection gesture and is consumed — the caller
 * never navigates. A click a drag produced is consumed WITHOUT selecting, so
 * the suppression tests tell the two apart by the selection, not the return.
 */
const rows: CompareRun[] = [
  { id: "a", name: "001", path: "p/f/001" },
  { id: "b", name: "002", path: "p/f/002" },
  { id: "c", name: "003", path: "p/f/003" },
  { id: "d", name: "004", path: "p/f/004" },
];

const plain = { shiftKey: false, metaKey: false, ctrlKey: false };
const cmd = { shiftKey: false, metaKey: true, ctrlKey: false };
const shift = { shiftKey: true, metaKey: false, ctrlKey: false };

describe("shared controlled and pointer contracts", () => {
  it("is read-only without a callback, including Escape, ranges and resets", () => {
    const selected = [rows[0]];
    const { result, rerender } = renderHook(
      ({ key }) => useListSelection({ selected, resetKey: key }),
      { initialProps: { key: "a" } },
    );
    act(() => {
      result.current.clear();
      result.current.selectAll(rows);
      result.current.toggle(1, rows);
      result.current.handleRowClick(2, rows, plain);
      result.current.handleRowMouseDown(0, rows, { ...plain, button: 0 });
      result.current.handleRowMouseEnter(3, rows, { buttons: 1 });
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    rerender({ key: "b" });
    expect(result.current.isSelected("a")).toBe(true);
    expect(result.current.isSelected("d")).toBe(false);
    expect(selected).toEqual([rows[0]]);
  });
  it("pointer cancellation kills an armed pen drag and touch does not arm one", () => {
    const { result } = renderHook(() => useRunSelection("one"));
    act(() => {
      result.current.handleRowPointerDown(0, rows, {
        ...plain,
        button: 0,
        pointerType: "pen",
      });
      window.dispatchEvent(new Event("pointercancel"));
      result.current.handleRowPointerEnter(3, rows, {
        buttons: 1,
        pointerType: "pen",
      });
    });
    expect(result.current.runs).toEqual([]);
    act(() => {
      result.current.handleRowPointerDown(0, rows, {
        ...plain,
        button: 0,
        pointerType: "touch",
      });
      result.current.handleRowPointerEnter(3, rows, {
        buttons: 1,
        pointerType: "touch",
      });
    });
    expect(result.current.runs).toEqual([]);
    act(() => result.current.handleRowClick(2, rows, plain));
    expect(result.current.runs).toEqual([rows[2]]);
  });
  it("normal pointer release suppresses its click but permits the next gesture", () => {
    const { result } = renderHook(() => useRunSelection("one"));
    act(() => {
      result.current.handleRowPointerDown(0, rows, {
        ...plain,
        button: 0,
        pointerType: "pen",
      });
      result.current.handleRowPointerEnter(2, rows, {
        buttons: 1,
        pointerType: "pen",
      });
      window.dispatchEvent(new Event("pointerup"));
      result.current.endDrag();
      result.current.handleRowClick(2, rows, plain);
    });
    expect(result.current.runs).toEqual(rows.slice(0, 3));
    act(() => {
      result.current.handleRowMouseDown(3, rows, { ...plain, button: 0 });
      result.current.handleRowClick(3, rows, plain);
    });
    expect(result.current.runs).toEqual([rows[3]]);
  });
  it("supports local Escape ownership and focus-only keyboard range anchors", () => {
    const { result } = renderHook(() => {
      const [selected, setSelected] = useState([rows[0]]);
      return {
        selected,
        ...useListSelection({
          selected,
          onSelectionChange: setSelected,
          listenForEscape: false,
        }),
      };
    });
    act(() => {
      result.current.setAnchor(2, rows);
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.selected).toEqual([rows[0]]);
    act(() => result.current.handleRowClick(3, rows, shift));
    expect(result.current.selected).toEqual(rows.slice(2));
    act(() => result.current.clear());
    expect(result.current.selected).toEqual([]);
  });
});

describe("run selection gestures", () => {
  it("a PLAIN click selects that row alone, replacing the selection, and is consumed", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    let consumed = false;
    act(() => {
      result.current.handleRowClick(0, rows, cmd);
      result.current.handleRowClick(1, rows, cmd);
    });
    act(() => {
      consumed = result.current.handleRowClick(2, rows, plain);
    });
    expect(consumed).toBe(true);
    expect(result.current.runs.map((r) => r.id)).toEqual(["c"]);
  });

  it("a plain click moves the anchor, so the next shift-click ranges from it", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    act(() => {
      result.current.handleRowClick(3, rows, plain);
    });
    act(() => {
      result.current.handleRowClick(1, rows, shift);
    });
    expect(result.current.runs.map((r) => r.id)).toEqual(["b", "c", "d"]);
  });

  it("cmd/ctrl click toggles the row and consumes the click", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    let consumed = false;
    act(() => {
      consumed = result.current.handleRowClick(0, rows, cmd);
    });
    expect(consumed).toBe(true);
    expect(result.current.runs.map((r) => r.id)).toEqual(["a"]);
    act(() => {
      result.current.handleRowClick(2, rows, cmd);
    });
    expect(result.current.runs.map((r) => r.id)).toEqual(["a", "c"]);
    act(() => {
      result.current.handleRowClick(0, rows, cmd);
    });
    expect(result.current.runs.map((r) => r.id)).toEqual(["c"]);
  });

  it("shift click selects the inclusive range from the anchor, in LIST order", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    act(() => {
      result.current.handleRowClick(2, rows, cmd); // anchor on '003'
    });
    act(() => {
      result.current.handleRowClick(0, rows, shift);
    });
    // Clicked bottom-up; the selection still reads top-down, because the curve
    // labels have to match the order the list showed.
    expect(result.current.runs.map((r) => r.id)).toEqual(["a", "b", "c"]);
  });

  it("shift click REPLACES the selection, as upstream does — it does not union", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    act(() => {
      result.current.handleRowClick(3, rows, cmd); // 'd' selected, anchor 3
    });
    act(() => {
      result.current.handleRowClick(0, rows, cmd); // 'a' selected, anchor 0
    });
    act(() => {
      result.current.handleRowClick(1, rows, shift);
    });
    expect(result.current.runs.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("the checkbox toggles without any modifier", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    act(() => {
      result.current.toggle(1, rows);
    });
    expect(result.current.isSelected("b")).toBe(true);
    act(() => {
      result.current.toggle(1, rows);
    });
    expect(result.current.isSelected("b")).toBe(false);
  });

  it("Escape clears", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    act(() => {
      result.current.toggle(0, rows);
    });
    expect(result.current.runs).toHaveLength(1);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.runs).toEqual([]);
  });
});

describe("the selection is cleared when its context goes away", () => {
  it("changing FOLDER clears it", () => {
    const { result, rerender } = renderHook(({ k }) => useRunSelection(k), {
      initialProps: { k: "proj|" },
    });
    act(() => {
      result.current.toggle(0, rows);
    });
    expect(result.current.runs).toHaveLength(1);
    rerender({ k: "proj|sub" });
    expect(result.current.runs).toEqual([]);
  });

  it("changing PROJECT clears it", () => {
    const { result, rerender } = renderHook(({ k }) => useRunSelection(k), {
      initialProps: { k: "proj-1|" },
    });
    act(() => {
      result.current.toggle(0, rows);
    });
    rerender({ k: "proj-2|" });
    expect(result.current.runs).toEqual([]);
  });

  it("a re-render with the SAME key does not clear it", () => {
    const { result, rerender } = renderHook(({ k }) => useRunSelection(k), {
      initialProps: { k: "proj|" },
    });
    act(() => {
      result.current.toggle(0, rows);
    });
    rerender({ k: "proj|" });
    expect(result.current.runs.map((r) => r.id)).toEqual(["a"]);
  });
});

const down = { button: 0, shiftKey: false, metaKey: false, ctrlKey: false };
const pressed = { buttons: 1 }; // primary button held
const released = { buttons: 0 }; // primary button up

describe("drag-across selection", () => {
  it("a press alone selects nothing", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    act(() => {
      result.current.handleRowMouseDown(0, rows, down);
    });
    expect(result.current.runs).toEqual([]);
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });
    expect(result.current.runs).toEqual([]);
  });

  it("drag across rows selects the inclusive range, and the click it produces is not navigation", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    act(() => {
      result.current.handleRowMouseDown(0, rows, down);
    });
    act(() => {
      result.current.handleRowMouseEnter(2, rows, pressed);
    });
    expect(result.current.runs.map((r) => r.id)).toEqual(["a", "b", "c"]);
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });
    let consumed = false;
    act(() => {
      consumed = result.current.handleRowClick(2, rows, plain);
    });
    expect(consumed).toBe(true);
    expect(result.current.runs.map((r) => r.id)).toEqual(["a", "b", "c"]);
  });

  it("the NEXT ordinary click, after the drag-produced one, selects as usual", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    act(() => {
      result.current.handleRowMouseDown(0, rows, down);
      result.current.handleRowMouseEnter(1, rows, pressed);
      window.dispatchEvent(new MouseEvent("mouseup"));
      result.current.handleRowClick(1, rows, plain); // the drag's own click — suppressed
    });
    expect(result.current.runs.map((r) => r.id)).toEqual(["a", "b"]);
    act(() => {
      result.current.handleRowClick(3, rows, plain);
    });
    expect(result.current.runs.map((r) => r.id)).toEqual(["d"]);
  });

  it("re-entering the anchor row without ever crossing another row is not a move", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    act(() => {
      result.current.handleRowMouseDown(1, rows, down);
      result.current.handleRowMouseEnter(1, rows, pressed); // back into the anchor itself
    });
    // Press+jitter alone selects nothing — it must not act as a one-row drag.
    expect(result.current.runs).toEqual([]);
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });
    // No move ever happened, so the following click is an ordinary plain click.
    act(() => {
      result.current.handleRowClick(1, rows, plain);
    });
    expect(result.current.runs.map((r) => r.id)).toEqual(["b"]);
  });

  it("a release outside the window (no mouseup ever fires) is caught on the next mouseenter via `buttons`", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    act(() => {
      result.current.handleRowMouseDown(0, rows, down);
    });
    // The button came up somewhere this page never saw a `mouseup` for — the
    // next `mouseenter` reports it released via `buttons` instead.
    act(() => {
      result.current.handleRowMouseEnter(2, rows, released);
    });
    expect(result.current.runs).toEqual([]); // disarmed silently, nothing selected
    act(() => {
      result.current.handleRowClick(2, rows, plain);
    });
    // No drag completed, nothing to suppress: an ordinary plain click.
    expect(result.current.runs.map((r) => r.id)).toEqual(["c"]);
  });

  it("Escape clears an armed drag, not just the selection", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    act(() => {
      result.current.handleRowMouseDown(0, rows, down);
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      result.current.handleRowMouseEnter(2, rows, pressed);
    });
    // The drag was killed by Escape, so entering row 2 afterward is a no-op.
    expect(result.current.runs).toEqual([]);
  });

  it("window blur clears an armed drag", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    act(() => {
      result.current.handleRowMouseDown(0, rows, down);
      window.dispatchEvent(new Event("blur"));
      result.current.handleRowMouseEnter(2, rows, pressed);
    });
    expect(result.current.runs).toEqual([]);
  });

  it("a changed resetKey clears an armed drag along with the selection", () => {
    const { result, rerender } = renderHook(({ k }) => useRunSelection(k), {
      initialProps: { k: "proj|" },
    });
    act(() => {
      result.current.handleRowMouseDown(0, rows, down);
    });
    rerender({ k: "proj|sub" });
    act(() => {
      result.current.handleRowMouseEnter(2, rows, pressed);
    });
    expect(result.current.runs).toEqual([]);
  });

  it("a new mousedown clears leftover suppression without relying on the timeout", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    act(() => {
      result.current.handleRowMouseDown(0, rows, down);
      result.current.handleRowMouseEnter(1, rows, pressed);
      window.dispatchEvent(new MouseEvent("mouseup")); // arms suppression synchronously
    });
    act(() => {
      // A fresh press-alone, synchronously after the drag, before any timer
      // could have run — must not let the OLD suppression swallow ITS click.
      result.current.handleRowMouseDown(3, rows, down);
    });
    act(() => {
      result.current.handleRowClick(3, rows, plain);
    });
    // Swallowed, it would leave the drag's ['a', 'b']; taken, it selects 'd'.
    expect(result.current.runs.map((r) => r.id)).toEqual(["d"]);
  });

  it("a Cmd/Ctrl drag ADDS its range to the selection made before it, as upstream", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    act(() => {
      result.current.toggle(3, rows); // d
    });
    act(() => {
      result.current.handleRowMouseDown(0, rows, { ...down, metaKey: true });
    });
    act(() => {
      result.current.handleRowMouseEnter(1, rows, pressed);
    });
    expect(result.current.runs.map((r) => r.id)).toEqual(["d", "a", "b"]);
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });
    // The drag's own click still carries Cmd — it must not toggle row b back off.
    let consumed = false;
    act(() => {
      consumed = result.current.handleRowClick(1, rows, cmd);
    });
    expect(consumed).toBe(true);
    expect(result.current.runs.map((r) => r.id)).toEqual(["d", "a", "b"]);
  });

  it("a plain drag still REPLACES a prior selection", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    act(() => {
      result.current.toggle(3, rows);
    });
    act(() => {
      result.current.handleRowMouseDown(0, rows, down);
    });
    act(() => {
      result.current.handleRowMouseEnter(1, rows, pressed);
    });
    expect(result.current.runs.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("a Cmd/Ctrl press that crosses no row is still just the toggle click", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    act(() => {
      result.current.handleRowMouseDown(2, rows, { ...down, ctrlKey: true });
      window.dispatchEvent(new MouseEvent("mouseup"));
    });
    act(() => {
      result.current.handleRowClick(2, rows, { ...plain, ctrlKey: true });
    });
    expect(result.current.runs.map((r) => r.id)).toEqual(["c"]);
  });

  it("a Shift press never arms a drag", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    act(() => {
      result.current.handleRowMouseDown(0, rows, { ...down, shiftKey: true });
    });
    act(() => {
      result.current.handleRowMouseEnter(2, rows, pressed);
    });
    expect(result.current.runs).toEqual([]);
  });
});

describe("select all", () => {
  it("selects exactly the rows given, in list order, and clear empties it", () => {
    const { result } = renderHook(() => useRunSelection("proj|"));
    act(() => {
      result.current.toggle(2, rows);
    });
    act(() => {
      result.current.selectAll(rows.slice(0, 3));
    });
    expect(result.current.runs.map((r) => r.id)).toEqual(["a", "b", "c"]);
    act(() => {
      result.current.clear();
    });
    expect(result.current.runs).toEqual([]);
  });
});

describe("shared selection retains app record snapshots", () => {
  it("keeps the clicked name/path until that run is explicitly reselected", () => {
    const { result, rerender } = renderHook(() => useRunSelection("project"));
    act(() => result.current.handleRowClick(0, rows, plain));
    const renamed = [
      { ...rows[0], name: "renamed", path: "new/folder/001" },
      ...rows.slice(1),
    ];
    rerender();
    expect(result.current.runs[0]).toBe(rows[0]);
    act(() => result.current.handleRowClick(1, renamed, cmd));
    expect(result.current.runs[0]).toBe(rows[0]);
    expect(result.current.runs[0].name).toBe("001");
    act(() => result.current.handleRowClick(0, renamed, plain));
    expect(result.current.runs).toEqual([renamed[0]]);
    expect(result.current.runs[0]).toBe(renamed[0]);
  });

  it("preserves batched toggles and press-time record snapshots in additive drags", () => {
    const { result } = renderHook(() => useRunSelection("project"));
    act(() => {
      result.current.toggle(3, rows);
      result.current.toggle(0, rows);
      result.current.toggle(0, rows);
    });
    expect(result.current.runs).toEqual([rows[3]]);
    const renamed = rows.map((row) => ({ ...row, name: `new-${row.name}` }));
    act(() => {
      result.current.handleRowMouseDown(0, renamed, { ...down, ctrlKey: true });
      result.current.handleRowMouseEnter(1, renamed, pressed);
    });
    expect(result.current.runs).toEqual([rows[3], renamed[0], renamed[1]]);
    expect(result.current.runs[0]).toBe(rows[3]);
  });
});

it("leaves Escape inside a confirmation dialog to the dialog", () => {
  const { result } = renderHook(() => useRunSelection("project"));
  const selected = [{ id: "a", name: "run-a" }];
  act(() => result.current.selectAll(selected));
  const dialog = document.createElement("div");
  dialog.setAttribute("role", "dialog");
  const button = document.createElement("button");
  dialog.append(button);
  document.body.append(dialog);
  try {
    act(() =>
      button.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      ),
    );
    expect(result.current.runs).toEqual(selected);
  } finally {
    dialog.remove();
  }
});
