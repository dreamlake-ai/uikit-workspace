// Public API for @dreamlake/uikit.
//
// Component primitives + the design-token stylesheet (imported once at
// the app root via `@import "@dreamlake/uikit/styles.css"`). The cn()
// helper composes Tailwind classes with tailwind-merge configured for
// the uikit-prefixed utility groups.

export * from "./components";
export { cn } from "./lib/utils";
export type { ToggleShape } from "./lib/toggleShape";
export { useIsMobile } from "./lib/useIsMobile";
export { useHiddenContentFocus } from "./lib/useHiddenContentFocus";
export { useHoverSlider } from "./lib/useHoverSlider";
export { usePointerDrag, type PointerDragOptions } from "./lib/usePointerDrag";
export { useTooltipPress, type TooltipPress } from "./lib/tooltip-press";
export { useListSelection } from "./lib/useListSelection";
export type {
  ListSelectionApi,
  ListSelectionModifiers,
  UseListSelectionOptions,
} from "./lib/useListSelection";
// TreeDataItem / TreeDataItemWithMeta come from the TreeView component (./components).
export type {
  DialSchema,
  GroupSchema,
  DialValue,
  DialDtype,
  DialCustomRenderContext,
  DialCustomRenderFn,
  NestedTypeDefinition,
} from "./lib/dial-types";

export {
  OutlineRail,
  type OutlineRailProps,
} from "./components/OutlineRail/OutlineRail";
export { outlinePosition } from "./components/OutlineRail/geometry";

export {
  FileDropOverlay,
  isExternalFileDrag,
  useFileDropTarget,
} from "./components/FileDropOverlay";

export {
  CollectionList,
  CollectionLayoutProvider,
  useCollectionColumns,
  PinnedCollectionDrawer,
  PinnedPlaneIcon,
  FolderCollectionIcon,
  BindrCollectionIcon,
  ListDivider,
  CollectionRow,
  CollectionRowBody,
} from "./components/CollectionList";
export type {
  CollectionRowBodyProps,
  PinnedCollectionDrawerProps,
  ListDividerProps,
} from "./components/CollectionList";

export type { CollectionIconProps } from "./components/CollectionList";

export {
  ProgressRail,
  type ProgressRailItem,
  type ProgressRailProps,
} from "./components/ProgressRail";

export { TruncatedText } from "./components/CollectionList/TruncatedText";
