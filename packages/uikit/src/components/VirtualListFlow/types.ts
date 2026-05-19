// VirtualListFlow shares the public API surface with VirtualList — the
// `children` render fn signature, the same prop names, the same
// scrolling/measurement semantics from the caller's perspective.
// The difference is internal: items render in normal document flow
// (CSS in-flow) inside a padding-top/padding-bottom shell, instead of
// as absolutely positioned children with transform-translateY. This
// makes sticky positioning, gap, and DOM-order semantics behave
// naturally.
//
// We deliberately re-export the same prop types so callers can swap
// VirtualList ↔ VirtualListFlow without rewriting their JSX.
export type {
  VirtualListProps as VirtualListFlowProps,
  ItemHeight,
  ItemMeasurement,
} from "../VirtualList/types";

import type { CSSProperties } from "react";

export interface UseVirtualListFlowOptions {
  itemCount: number;
  itemHeight: number | "dynamic";
  estimatedItemHeight: number;
  containerHeight: number;
  overscan: number;
  scrollTop: number;
  // Map of measured heights, keyed by index. Stable reference (a ref's
  // current Map) — the hook returns a version bump signal whenever
  // contents change.
  measurements: Map<number, number>;
  // Bumped by `measureItem`; lets the hook's useMemos invalidate.
  measurementVersion: number;
}

export interface UseVirtualListFlowResult {
  visibleRange: { start: number; end: number };
  totalHeight: number;
  spaceAbove: number;
  spaceBelow: number;
  // Style hint for the children render fn's 3rd arg. Always
  // `{ width: '100%' }` (so children that wrap with `<div style={...}>`
  // keep correct width); no positioning is needed since items are in
  // normal flow.
  itemStyle: CSSProperties;
}
