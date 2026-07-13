---
name: dreamlake-uikit
description: DreamLake uikit is the React component library and design contract — surfaces, ink, semantic color, type, geometry, and the zebra-list patterns shared by every DreamLake page. Use when answering questions about DreamLake (Overview, Avatar, Style guide, BreadcrumbTree, LLM-Readable Docs, Button, Dialog, Field, FilterBar, Menu, ProfileCard, ProfileLayout, ResizableLayout, Select, SideNav, Tabs, Tag, TextField, VirtualList, VirtualListFlow, VideoAnnotator, Spinner, Skeleton, Switch, Badge, Collapsible, Card, Alert Dialog, Drawer, Toast, UIKit Badge, Pipeline Graph, Anatomy, Pipeline Graph JSON, Architecture & Roadmap, useIsMobile, Subtask Annotation, Label, Toggle, Toolbar, Modal, Form Layout, Input, Mouse Cursor Icons, Tooltip, Popover, Dropdown Menu, Theme, Tree View, Context Menu, Dial, Waterfall, Slider, Number Inputs, Layout, Sync Scroll).
---
# DreamLake

DreamLake uikit is the React component library and design contract — surfaces, ink, semantic color, type, geometry, and the zebra-list patterns shared by every DreamLake page.

This skill bundles the DreamLake documentation. Read the reference
file that matches the question; each is a self-contained markdown page.

## Reference

**Get started**

- `reference/overview.md` — Overview: Surfaces, ink, color, type, geometry, and the zebra-list patterns shared by every DreamLake page.
- `reference/style-guide.md` — Style guide: Surfaces, ink, semantic palette, type pairing, spacing, icons, elevation, radii, motion, and zebra-list bands — the complete DreamLake design contract on one page.
- `reference/llm-readable.md` — LLM-Readable Docs: Every page is available as clean markdown, plus an llms.txt index, a full-corpus dump, and an importable agent skill.

**Components**

- `reference/components-avatar.md` — Avatar: Image-or-initials avatar with adjustable size and corner radius.
- `reference/components-breadcrumb-tree.md` — BreadcrumbTree: Breadcrumb selector with a Miller-column drop-down for navigating deep hierarchies.
- `reference/components-button.md` — Button: Action button with primary, secondary, ghost and danger variants.
- `reference/components-dialog.md` — Dialog: Modal dialog with backdrop, Escape-to-dismiss, and a footer action row.
- `reference/components-field.md` — Field: Form-field wrapper — label, required marker, hint and error.
- `reference/components-filter-bar.md` — FilterBar: Filter chips + search input + sort dropdown for list/table toolbars.
- `reference/components-menu.md` — Menu: Trigger-anchored dropdown menu with sections, items, dividers, and a destructive variant.
- `reference/components-profile-card.md` — ProfileCard: Bordered card for a resource row — title, tag, meta, description, footer, optional hover actions.
- `reference/components-profile-layout.md` — ProfileLayout: Full-page profile layout — sticky top bar with animated tabs, a fixed left rail, and a scrollable main column.
- `reference/components-resizable-layout.md` — ResizableLayout: Three-column drag-to-resize layout with optional persistence and fixed-px column modes.
- `reference/components-select.md` — Select: Composable single-select with a trigger, value, and grouped items.
- `reference/components-side-nav.md` — SideNav: Sidebar shell with pinned header/footer and a scrollable body of titled, sticky groups.
- `reference/components-tabs.md` — Tabs: Animated tab switcher with underline or segment variants, multiple sizes, and controlled/uncontrolled state.
- `reference/components-tag.md` — Tag: Hashtag or pill tag with a six-color tone palette, accent override, and removable variant.
- `reference/components-text-field.md` — TextField: Controlled text input with prefix, multiline, mono and invalid states.
- `reference/components-virtual-list.md` — VirtualList: Windowed list — fixed or dynamic item height, plus infinite-scroll for very large row sets.
- `reference/components-virtual-list-flow.md` — VirtualListFlow: Flow-layout virtual list — items in CSS normal flow, so sticky / gap / scroll stability work like a non-virtual list.
- `reference/components-video-annotator.md` — VideoAnnotator: Video player with an editable, contiguous segment timeline — split, merge, drag boundaries, and frame-step transport.
- `reference/components-spinner.md` — Spinner: Indeterminate loading spinner — a dual dot-pulse ring that inherits text color.
- `reference/components-skeleton.md` — Skeleton: Pulsing placeholder block for loading states.
- `reference/components-switch.md` — Switch: Binary on/off toggle. Controlled or uncontrolled.
- `reference/components-badge.md` — Badge: Small inline status/category badge with filled, outline and dot forms.
- `reference/components-collapsible.md` — Collapsible: Expand/collapse region with an animated-height content area.
- `reference/components-card.md` — Card: Panel container with padding, hairline border, and an optional collapse toggle.
- `reference/components-alert-dialog.md` — Alert Dialog: Modal confirmation dialog for destructive or consequential actions.
- `reference/components-drawer.md` — Drawer: Edge-anchored panel (sheet) that slides in from any side.
- `reference/components-toast.md` — Toast: Transient notifications via an imperative toast() API and a Toaster.
- `reference/components-uikit-badge.md` — UIKit Badge: Version chip showing the @dreamlake/uikit package name and version.
- `reference/components-use-is-mobile.md` — useIsMobile: Hook returning true when the viewport is narrower than 768px.
- `reference/components-label.md` — Label: Form label with size variants, associated via htmlFor.
- `reference/components-toggle.md` — Toggle: Two-state toggle button, plus a segmented ToggleButtons group.
- `reference/components-toolbar.md` — Toolbar: Horizontal container for grouped actions, with separators.
- `reference/components-modal.md` — Modal: General-purpose modal dialog with a trigger and close button.
- `reference/components-form-layout.md` — Form Layout: Pairs a label with a control, stacked or side-by-side.
- `reference/components-input.md` — Input: Styled text input with optional left/right slots.
- `reference/components-mouse-cursor.md` — Mouse Cursor Icons: Cursor-pointer icons (outline and filled) that inherit currentColor.
- `reference/components-tooltip.md` — Tooltip: Hover/focus tooltip with anchored, viewport-aware positioning.
- `reference/components-popover.md` — Popover: Click-triggered floating panel anchored to its trigger.
- `reference/components-dropdown-menu.md` — Dropdown Menu: Click-triggered action menu with labels, separators, radio items and submenus.
- `reference/components-theme.md` — Theme: ThemeProvider, the useTheme hook, and theme toggle controls.
- `reference/components-tree-view.md` — Tree View: Flat-rendered hierarchical tree for scene graphs and file trees, with expand/collapse, selection, and searchable label highlighting.
- `reference/components-context-menu.md` — Context Menu: Right-click menu composed from a trigger area and content items, with labels, groups, shortcuts, and a danger tone.
- `reference/components-dial.md` — Dial: Schema-driven control panel that renders typed inputs (numbers, vectors, colors, booleans, buttons) from a single schema array.
- `reference/components-waterfall.md` — Waterfall: A zoomable, pannable timeline waterfall — a tree of events on the left, a time axis with duration bars and instant-event dots on the right.
- `reference/components-slider.md` — Slider: Horizontal range slider with single or multiple thumbs, optional step ticks, and controlled/uncontrolled state.
- `reference/components-number-inputs.md` — Number Inputs: Drag-to-adjust numeric, vector, color, and text inputs for the Dial system.
- `reference/components-layout.md` — Layout: Studio layout shells — an edge-docked dock layout and a pointer-transparent liquid layout for floating panels over a 3D canvas.
- `reference/components-sync-scroll.md` — Sync Scroll: Synchronize scroll position across multiple panes — a master drives its slaves, with optional drag-to-scroll on either axis.

**Pipeline**

- `reference/pipeline-view-pipeline-graph.md` — Pipeline Graph: The presentational component that renders a traced DreamLake pipeline — what it's for, the Python↔visual↔JSON round-trip, and the interactive canvas.
- `reference/pipeline-view-anatomy.md` — Anatomy: Every field mapped to a pixel — the node card, the two connector tags (data vs mask), and the six connector states — each as visual + TypeScript + JSON, side by side.
- `reference/pipeline-view-pipeline-graph-json.md` — Pipeline Graph JSON: The data format PipelineGraph renders — pipeline, node, and edge shapes, static vs runtime fields, the output artifact, and how status drives edge flow.
- `reference/pipeline-view-architecture.md` — Architecture & Roadmap: How PipelineGraph is built — the file split, the design principles, the render pipeline, and what it deliberately leaves out — plus the current stage and what's planned next.
- `reference/pipeline-view-subtask-annotation.md` — Subtask Annotation: A worked example — the Macrodata Labs robot-video subtask annotation pipeline (contact-sheet segmentation → windowed labeling with Gemini) rendered as a PipelineGraph.

## Canonical source

These docs live at https://uikit.dreamlake.ai. Each page is also fetchable as markdown
at `<page-url>.md`, and the full corpus at https://uikit.dreamlake.ai/llms-full.txt.
