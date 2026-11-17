import { useCallback, useEffect, useMemo, useRef } from "react";

export interface ListSelectionModifiers {
  shiftKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
}
export interface UseListSelectionOptions<T extends { id: string }> {
  /** Controlled record snapshots, in selection order. */
  selected: readonly T[];
  /** Omit for read-only selection. */
  onSelectionChange?: (selected: T[]) => void;
  /** Changing context clears selection, anchor and an unfinished gesture. */
  resetKey?: unknown;
  /** App-compatible window Escape handling; disable for a focused-list scope. */
  listenForEscape?: boolean;
}
export interface ListSelectionApi<T extends { id: string }> {
  isSelected: (id: string) => boolean;
  clear: () => void;
  selectAll: (rows: readonly T[]) => void;
  toggle: (index: number, rows: readonly T[]) => void;
  /** Move the range anchor with keyboard focus without changing selection. */
  setAnchor: (index: number, rows: readonly T[]) => void;
  handleRowClick: (
    index: number,
    rows: readonly T[],
    event: ListSelectionModifiers,
  ) => boolean;
  handleRowMouseDown: (
    index: number,
    rows: readonly T[],
    event: ListSelectionModifiers & { button: number },
  ) => void;
  handleRowMouseEnter: (
    index: number,
    rows: readonly T[],
    event: { buttons: number },
  ) => void;
  handleRowPointerDown: (
    index: number,
    rows: readonly T[],
    event: ListSelectionModifiers & { button: number; pointerType: string },
  ) => void;
  handleRowPointerEnter: (
    index: number,
    rows: readonly T[],
    event: { buttons: number; pointerType: string },
  ) => void;
  /** Normal release: retain suppression of the completed drag's click. */
  endDrag: () => void;
  /** Cancel/blur/context change: discard the gesture and click suppression. */
  cancelDrag: () => void;
}

/** The DreamLake experiments selection controller, extracted from useRunSelection.
 * Plain click/drag replaces; Cmd/Ctrl toggles or adds the drag range; Shift-click
 * replaces with an inclusive range. Press alone never selects. Rendering,
 * virtualization, focus, pointer capture and scrolling remain with the caller.
 */
export function useListSelection<T extends { id: string }>({
  selected,
  onSelectionChange,
  resetKey,
  listenForEscape = true,
}: UseListSelectionOptions<T>): ListSelectionApi<T> {
  const current = useRef({ selected, onSelectionChange });
  current.current = { selected, onSelectionChange };
  const anchor = useRef(0);
  const drag = useRef<{
    anchor: number;
    moved: boolean;
    base: readonly T[];
  } | null>(null);
  const suppressClick = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emit = useCallback((next: T[]) => {
    const callback = current.current.onSelectionChange;
    if (!callback) return;
    // Multiple imperative gestures can occur in one React batch. Each must read
    // the preceding selection, just as the original functional state setter did.
    current.current.selected = next;
    callback(next);
  }, []);
  const cancelDrag = useCallback(() => {
    drag.current = null;
    suppressClick.current = false;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const clear = useCallback(() => {
    cancelDrag();
    emit([]);
  }, [cancelDrag, emit]);
  const context = useRef(resetKey);
  useEffect(() => {
    if (Object.is(context.current, resetKey)) return;
    context.current = resetKey;
    anchor.current = 0;
    clear();
  }, [resetKey, clear]);
  useEffect(() => {
    if (!onSelectionChange) cancelDrag();
  }, [!!onSelectionChange, cancelDrag]);

  const selectAll = useCallback(
    (rows: readonly T[]) => emit([...rows]),
    [emit],
  );
  const setAnchor = useCallback((index: number, rows: readonly T[]) => {
    if (rows[index]) anchor.current = index;
  }, []);
  const toggle = useCallback(
    (index: number, rows: readonly T[]) => {
      if (!current.current.onSelectionChange) return;
      const row = rows[index];
      if (!row) return;
      const previous = current.current.selected;
      emit(
        previous.some((item) => item.id === row.id)
          ? previous.filter((item) => item.id !== row.id)
          : [...previous, row],
      );
      anchor.current = index;
    },
    [emit],
  );
  const handleRowClick = useCallback<ListSelectionApi<T>["handleRowClick"]>(
    (index, rows, event) => {
      const row = rows[index];
      if (!row) return false;
      if (!current.current.onSelectionChange) return true;
      if (suppressClick.current) {
        suppressClick.current = false;
        return true;
      }
      if (event.shiftKey) {
        emit(
          rows.slice(
            Math.min(anchor.current, index),
            Math.max(anchor.current, index) + 1,
          ),
        );
      } else if (event.metaKey || event.ctrlKey) {
        toggle(index, rows);
      } else {
        emit([row]);
        anchor.current = index;
      }
      return true;
    },
    [emit, toggle],
  );
  const handleRowMouseDown = useCallback<
    ListSelectionApi<T>["handleRowMouseDown"]
  >(
    (index, rows, event) => {
      cancelDrag();
      if (
        !current.current.onSelectionChange ||
        event.button !== 0 ||
        event.shiftKey ||
        !rows[index]
      )
        return;
      drag.current = {
        anchor: index,
        moved: false,
        base: event.metaKey || event.ctrlKey ? current.current.selected : [],
      };
    },
    [cancelDrag],
  );
  const handleRowMouseEnter = useCallback<
    ListSelectionApi<T>["handleRowMouseEnter"]
  >(
    (index, rows, event) => {
      const gesture = drag.current;
      if (!gesture || !current.current.onSelectionChange) return;
      if ((event.buttons & 1) === 0) {
        drag.current = null;
        return;
      }
      if (!rows[index]) return;
      if (index !== gesture.anchor) gesture.moved = true;
      if (!gesture.moved) return;
      const known = new Set(gesture.base.map((row) => row.id));
      const range = rows.slice(
        Math.min(gesture.anchor, index),
        Math.max(gesture.anchor, index) + 1,
      );
      emit([...gesture.base, ...range.filter((row) => !known.has(row.id))]);
    },
    [emit],
  );
  const endDrag = useCallback(() => {
    const gesture = drag.current;
    drag.current = null;
    if (!gesture?.moved) return;
    anchor.current = gesture.anchor;
    suppressClick.current = true;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      suppressClick.current = false;
      timer.current = null;
    }, 0);
  }, []);
  const handleRowPointerDown = useCallback<
    ListSelectionApi<T>["handleRowPointerDown"]
  >(
    (index, rows, event) => {
      if (event.pointerType === "touch") cancelDrag();
      else handleRowMouseDown(index, rows, event);
    },
    [cancelDrag, handleRowMouseDown],
  );
  const handleRowPointerEnter = useCallback<
    ListSelectionApi<T>["handleRowPointerEnter"]
  >(
    (index, rows, event) => {
      if (event.pointerType !== "touch")
        handleRowMouseEnter(index, rows, event);
    },
    [handleRowMouseEnter],
  );

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        (event.target instanceof Element &&
          event.target.closest('[role="dialog"], [role="alertdialog"]'))
      )
        return;
      cancelDrag();
      if (current.current.selected.length) emit([]);
    };
    if (listenForEscape) window.addEventListener("keydown", escape);
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", cancelDrag);
    window.addEventListener("blur", cancelDrag);
    return () => {
      if (listenForEscape) window.removeEventListener("keydown", escape);
      window.removeEventListener("mouseup", endDrag);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", cancelDrag);
      window.removeEventListener("blur", cancelDrag);
      cancelDrag();
    };
  }, [listenForEscape, endDrag, cancelDrag, emit]);
  const ids = useMemo(() => new Set(selected.map((row) => row.id)), [selected]);
  const isSelected = useCallback((id: string) => ids.has(id), [ids]);
  return {
    isSelected,
    clear,
    selectAll,
    toggle,
    setAnchor,
    handleRowClick,
    handleRowMouseDown,
    handleRowMouseEnter,
    handleRowPointerDown,
    handleRowPointerEnter,
    endDrag,
    cancelDrag,
  };
}
